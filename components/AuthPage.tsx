'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebaseConfig';
import { gsap } from 'gsap';

type UserRole = 'radiologist' | 'gp' | 'official' | null;
type AuthView = 'login' | 'signup' | 'role' | 'forgot';
type Language = 'Fr' | 'En';

interface AuthPageProps {
  onBack: () => void;
  onAuthSuccess?: (user: any) => void;
  initialEmail?: string;
}

interface InputFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}

// Extracted outside to prevent re-mount on every parent render
function InputField({ label, type, value, onChange, placeholder, required = true }: InputFieldProps) {
  return (
    <div className="space-y-1 auth-fade">
      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-0.5">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder} 
        required={required}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-900 text-xs font-medium outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-gray-300" 
      />
    </div>
  );
}

function RoleButton({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full p-3.5 bg-white border border-gray-100 rounded-xl hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-900/5 transition-all text-left flex items-center gap-4 group auth-fade active:scale-[0.98]">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 transition-all border border-gray-100 shrink-0">
        <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-gray-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{title}</div>
        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{sub}</div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all shrink-0">
        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
    </button>
  );
}

const translations = {
  En: {
    welcome: "Create Account",
    bonjour: "Clinical Sign In",
    loginDesc: "Access the sovereign diagnostic network.",
    signupDesc: "Join Rwanda's clinical AI infrastructure.",
    emailLabel: "Work Email",
    passwordLabel: "Password",
    nameLabel: "Full Name",
    licenseLabel: "RBC License ID",
    forgotPass: "Reset password?",
    nextStep: "Authorize Access",
    signupBtn: "Create Free Account",
    identifyBtn: "Register Now",
    googleBtn: "Continue with Google",
    noAccount: "New here? Join free",
    alreadyAccount: "Member? Sign In",
    forgotTitle: "Reset Access",
    forgotDesc: "We'll send a link to your institutional email.",
    forgotBack: "Back to Login",
    forgotSend: "Send Reset Link",
    resetSuccess: "Link sent. Check your inbox.",
    stepRole: "Clinical Category",
    rights: "\u00a9 2026 Ubuzima Connect ",
    insightTitle: "Clinical Sovereignty",
    insightDesc: "High-precision diagnostic protocol calibrated for Rwanda\u2019s infrastructure. Free for all verified clinicians in 2026.",
    backToRoles: "Change category",
  },
  Fr: {
    welcome: "Cr\u00e9er un compte",
    bonjour: "Connexion Clinique",
    loginDesc: "Acc\u00e9dez au r\u00e9seau de diagnostic souverain.",
    signupDesc: "Rejoignez l'infrastructure IA clinique du Rwanda.",
    emailLabel: "Email Professionnel",
    passwordLabel: "Mot de passe",
    nameLabel: "Nom Complet",
    licenseLabel: "Num\u00e9ro de licence RBC",
    forgotPass: "R\u00e9initialiser ?",
    nextStep: "Autoriser l'Acc\u00e8s",
    signupBtn: "Cr\u00e9er un compte gratuit",
    identifyBtn: "S'enregistrer maintenant",
    googleBtn: "Continuer avec Google",
    noAccount: "Nouveau? Rejoindre",
    alreadyAccount: "D\u00e9j\u00e0 membre? Connexion",
    forgotTitle: "R\u00e9initialiser",
    forgotDesc: "Un lien sera envoy\u00e9 \u00e0 votre email institutionnel.",
    forgotBack: "Retour \u00e0 la connexion",
    forgotSend: "Envoyer le lien",
    resetSuccess: "Lien envoy\u00e9. V\u00e9rifiez votre bo\u00eete.",
    stepRole: "Cat\u00e9gorie Clinique",
    rights: "\u00a9 2026 Ubuzima Connect | M\u00e9dical Souverain",
    insightTitle: "Souverainet\u00e9 Clinique",
    insightDesc: "Protocole de diagnostic calibr\u00e9 pour le Rwanda. Gratuit pour les cliniciens v\u00e9rifi\u00e9s en 2026.",
    backToRoles: "Changer de cat\u00e9gorie",
  }
};

const AuthPage: React.FC<AuthPageProps> = ({ onBack, onAuthSuccess, initialEmail = "" }) => {
  const [view, setView] = useState<AuthView>('login');
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lang, setLang] = useState<Language>('En');

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [licenseId, setLicenseId] = useState('');

  const t = translations[lang];

  // Clear error/success whenever view changes
  const switchView = useCallback((newView: AuthView) => {
    setError('');
    setSuccess('');
    setView(newView);
  }, []);

  useEffect(() => {
    gsap.fromTo(".auth-form-container", 
      { opacity: 0 },
      { opacity: 1, duration: 0.35, ease: "power2.out", clearProps: "transform,opacity" }
    );
    gsap.fromTo(".auth-fade", 
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, stagger: 0.04, duration: 0.4, ease: "power2.out", clearProps: "transform,opacity" }
    );
  }, [view]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (view === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess?.(userCredential.user);
        return;
      } else if (view === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: fullName });
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          role: role || 'gp',
          fullName,
          email,
          licenseId,
          createdAt: serverTimestamp(),
          setupComplete: true,
          freeTier: true,
          registeredYear: 2026
        });
        await sendEmailVerification(userCredential.user);
        onAuthSuccess?.(userCredential.user);
        return;
      } else if (view === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setSuccess(t.resetSuccess);
      }
    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try signing in.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userDocRef = doc(db, 'users', result.user.uid);
      await setDoc(userDocRef, {
        role: 'gp',
        fullName: result.user.displayName,
        email: result.user.email,
        lastSeen: serverTimestamp(),
        freeTier: true,
        registeredYear: 2026
      }, { merge: true });
      onAuthSuccess?.(result.user);
    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Try again.');
      } else if (code === 'auth/popup-blocked') {
        setError('Popup blocked by browser. Allow popups and retry.');
      } else {
        setError(err.message || 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Form Section */}
      <div className="w-full lg:w-[45%] p-5 md:p-8 flex flex-col justify-between z-10 bg-white border-r border-gray-50">
        <header className="flex justify-between items-center auth-fade">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={onBack}>
            <div className="w-7 h-7 bg-emerald-900 rounded-md flex items-center justify-center relative overflow-hidden transition-transform group-hover:scale-105">
              <div className="w-4 h-[1.5px] bg-emerald-100 rounded-full"></div>
            </div>
            <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">Ubuzima Connect</span>
          </div>
          
          <div className="flex items-center gap-0.5 bg-gray-50 p-1 rounded-lg">
            <button onClick={() => setLang('En')} className={`px-2.5 py-1.5 text-[9px] font-bold rounded-md transition-all ${lang === 'En' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>EN</button>
            <button onClick={() => setLang('Fr')} className={`px-2.5 py-1.5 text-[9px] font-bold rounded-md transition-all ${lang === 'Fr' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>FR</button>
          </div>
        </header>

        <div className="max-w-[340px] mx-auto w-full py-6 auth-form-container">
          <div className="mb-6 auth-fade text-center lg:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1.5 tracking-tight">
              {view === 'login' ? t.bonjour : view === 'signup' ? t.welcome : view === 'role' ? t.stepRole : t.forgotTitle}
            </h1>
            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.15em]">
              {view === 'login' ? t.loginDesc : view === 'signup' ? t.signupDesc : view === 'forgot' ? t.forgotDesc : t.stepRole}
            </p>
          </div>

          {/* Error / Success messages */}
          {error && (
            <div className="p-3 rounded-xl mb-4 text-[9px] font-bold uppercase tracking-widest border auth-fade flex items-center gap-3 bg-red-50 text-red-600 border-red-100">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-red-100 text-red-600 text-xs font-black">!</div>
              <span className="flex-1 leading-relaxed">{error}</span>
              <button type="button" onClick={() => setError('')} className="shrink-0 text-red-400 hover:text-red-600 transition-colors p-0.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl mb-4 text-[9px] font-bold uppercase tracking-widest border auth-fade flex items-center gap-3 bg-emerald-50 text-emerald-600 border-emerald-100">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-700 text-xs font-black">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span className="flex-1 leading-relaxed">{success}</span>
              <button type="button" onClick={() => setSuccess('')} className="shrink-0 text-emerald-400 hover:text-emerald-600 transition-colors p-0.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          )}

          {view === 'role' ? (
            <div className="space-y-3">
              <RoleButton 
                icon={<path d="M12 2v20m10-10H2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>} 
                title="Radiologist" 
                sub="Diagnostic Node" 
                onClick={() => { setRole('radiologist'); switchView('signup'); }} 
              />
              <RoleButton 
                icon={<path d="M9 12h6m-3-3v6M4 10V6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>} 
                title="Doctor" 
                sub="Hospital Unit" 
                onClick={() => { setRole('gp'); switchView('signup'); }} 
              />
              <RoleButton 
                icon={<path d="M3 21h18M3 10h18M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>} 
                title="Ministry" 
                sub="National Oversight" 
                onClick={() => { setRole('official'); switchView('signup'); }} 
              />
              <button onClick={() => switchView('login')} className="w-full mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 hover:text-gray-900 transition-all auth-fade underline underline-offset-4 decoration-gray-100">
                {t.alreadyAccount}
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              {view === 'signup' && (
                <div className="space-y-3">
                  <div className="p-2.5 bg-emerald-50/50 rounded-xl flex items-center justify-between border border-emerald-100 auth-fade">
                    <div className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest">Type: {role?.toUpperCase()}</div>
                    <button type="button" onClick={() => switchView('role')} className="text-[9px] font-bold text-emerald-600 hover:underline uppercase tracking-widest">{t.backToRoles}</button>
                  </div>
                  <InputField label={t.nameLabel} type="text" value={fullName} onChange={setFullName} placeholder="Dr. Gasana Jean" />
                  <InputField label={t.licenseLabel} type="text" value={licenseId} onChange={setLicenseId} placeholder="MC/2026/0123" />
                </div>
              )}
              
              <InputField label={t.emailLabel} type="email" value={email} onChange={setEmail} placeholder="clinical@institutional.rw" />
              
              {view !== 'forgot' && (
                <InputField label={t.passwordLabel} type="password" value={password} onChange={setPassword} placeholder="Enter password" />
              )}
              
              {view === 'login' && (
                <div className="flex justify-end auth-fade">
                  <button type="button" onClick={() => switchView('forgot')} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest">{t.forgotPass}</button>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3 bg-gray-900 text-white font-bold uppercase tracking-[0.2em] text-[10px] rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200 auth-fade mt-2 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (view === 'forgot' ? t.forgotSend : t.nextStep)}
              </button>

              {view === 'login' && (
                <>
                  <div className="relative py-3 auth-fade">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                    <div className="relative flex justify-center text-[8px] uppercase font-bold text-gray-300"><span className="bg-white px-4 tracking-[0.3em]">Trusted Access</span></div>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleGoogleAuth} 
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-3 border border-gray-100 bg-transparent text-gray-900 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-gray-50 transition-all auth-fade shadow-sm disabled:opacity-60"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" crossOrigin="anonymous" />
                    {t.googleBtn}
                  </button>
                </>
              )}

              {view === 'forgot' && (
                <button type="button" onClick={() => switchView('login')} className="w-full text-[10px] font-bold text-gray-400 hover:text-gray-900 transition-all uppercase tracking-[0.2em] auth-fade mt-2">
                  {t.forgotBack}
                </button>
              )}

              <div className="text-center pt-6 auth-fade">
                <button type="button" onClick={() => { if (view === 'login') switchView('role'); else switchView('login'); }} className="text-[10px] font-bold text-gray-300 hover:text-gray-900 transition-all uppercase tracking-[0.2em] underline underline-offset-4 decoration-gray-100">
                  {view === 'login' ? t.noAccount : t.alreadyAccount}
                </button>
              </div>
            </form>
          )}
        </div>

        <footer className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.4em] auth-fade text-center lg:text-left">
          {t.rights}
        </footer>
      </div>

      {/* Right Visual Panel */}
      <div className="hidden lg:flex w-[55%] relative p-8 bg-gray-50 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 medical-grid opacity-20"></div>
        
        <div className="w-full h-full rounded-[3rem] overflow-hidden relative shadow-xl border border-white bg-white">
          <img 
            src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover grayscale opacity-[0.099]" 
            alt="Clinical Background"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-white/20"></div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-8 shadow-inner border border-emerald-100">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tighter leading-tight uppercase text-balance">
              {t.insightTitle}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed font-normal max-w-sm mx-auto">
              {t.insightDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
