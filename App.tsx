import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Features from './components/Features';
import Process from './components/Process';
import CTA from './components/CTA';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import IntroSequence from './components/IntroSequence';
import { auth, db } from './components/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore";
import AdminDashboard from "./components/AdminDashboard";
import PendingApproval from "./components/PendingApproval";
import SetPassword from "./components/SetPassword";

const ADMIN_EMAILS = new Set(["leslyndiz6@gmail.com", "l.ndizeye@alustudent.com"]);

type UserProfile = {
  role?: string;
  status?: string;
  roleRequested?: string;
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'auth'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [initialEmail, setInitialEmail] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const path = window.location.pathname;
    if (path === "/set-password") {
      return <SetPassword />;
    }
    
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // reset profile state on logout
      if (!currentUser) {
        setProfile(null);
        return;
      }

      setProfileLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        setProfile(snap.exists() ? (snap.data() as UserProfile) : {});
      } finally {
        setProfileLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const goToAuth = (email: string = "") => {
    setInitialEmail(email);
    setCurrentView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-med-green/20 border-t-med-green rounded-full animate-spin"></div>
    </div>
  );

  if (showIntro) return <IntroSequence onFinish={() => setShowIntro(false)} />;

  //  After login: role-based routing
if (user) {
  const email = (user.email ?? "").toLowerCase();

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-med-green/20 border-t-med-green rounded-full animate-spin"></div>
      </div>
    );
  }

  // 1) Admin by email
  if (ADMIN_EMAILS.has(email)) return <AdminDashboard />;

  const role = profile?.role;
  const status = profile?.status;
  const roleRequested = profile?.roleRequested;

  // 2) Approved radiologist
  if (role === "radiologist" && status === "approved") return <Dashboard />;

  // 3) Pending radiologist request
  if (roleRequested === "radiologist" && status === "pending") return <PendingApproval />;

  // Option B (recommended): force auth page
  return <AuthPage onBack={() => setCurrentView("landing")} initialEmail={email} />;
}

  if (currentView === 'auth') {
    return <AuthPage onBack={() => setCurrentView('landing')} initialEmail={initialEmail} />;
  }

  return (
    <div className="relative min-h-screen w-full bg-white selection:bg-med-emerald/10">
      <Navbar onAuthClick={() => goToAuth()} />
      <main className="max-w-[1600px] mx-auto">
        <Hero onStartClick={() => goToAuth()} />
        <Services onStartClick={() => goToAuth()} />

        <section className="py-24 px-8 bg-gray-50/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative group overflow-hidden rounded-[3rem] aspect-square shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1200"
                  className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0"
                  alt="Clinical Environment"
                />
                <div className="absolute inset-0 bg-med-emerald/10 opacity-40 group-hover:opacity-0 transition-opacity"></div>
              </div>
              <div className="space-y-8">
                <h2 className="text-4xl md:text-6xl font-display font-medium tracking-tight text-gray-900 leading-tight">
                  Built for Sovereign Impact.
                </h2>
                <p className="text-lg text-gray-500 font-normal leading-relaxed max-w-lg">
                  Ubuzima Connect bridges the critical specialist gap in Rwanda's healthcare sector. Our protocol triages patients instantly, optimizing clinical workflows.
                </p>
                <div className="grid grid-cols-2 gap-8 pt-4">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="text-4xl font-display font-bold text-med-emerald">98%</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                      Accuracy Benchmark
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="text-4xl font-display font-bold text-med-emerald">RBC</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                      Certified Protocol
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Features onStartClick={() => goToAuth()} />
        <Process />
        <FAQ />
        <CTA onStartClick={() => goToAuth()} />
      </main>
      <Footer onEmailSubmit={(email) => goToAuth(email)} />
    </div>
  );
};


export default App;