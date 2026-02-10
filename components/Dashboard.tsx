"use client";

import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebaseConfig";
import { gsap } from "gsap";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// --- Types ---
type Tab = "overview" | "diagnostic" | "history" | "evaluation" | "settings";

interface UserProfile {
  fullName: string;
  email: string;
  role: string;
}

interface AnalysisResult {
  result: "Normal" | "TB Detected" | "Pneumonia";
  confidence: number;
  observation: string;
}

interface DiagnosisRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  result: "Normal" | "TB Detected" | "Pneumonia";
  confidence: number;
  observation: string;
  status: "Verified" | "Pending Review" | "Flagged";
}

// --- Icons ---
const Icons = {
  Grid: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Scan: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  X: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Sun: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  History: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 01-18 0 9 9 0 0018 0z" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
};

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <Icons.Grid /> },
  { key: "diagnostic", label: "Diagnostic", icon: <Icons.Scan /> },
  { key: "history", label: "History", icon: <Icons.History /> },
  { key: "evaluation", label: "Performance", icon: <Icons.Chart /> },
  { key: "settings", label: "System", icon: <Icons.Settings /> },
];

// ========== MAIN DASHBOARD ==========
interface DashboardProps {
  onSignOut?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSignOut }) => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isDark, setIsDark] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [diagnosisHistory, setDiagnosisHistory] = useState<DiagnosisRecord[]>([
    { id: "DX-0001", patientId: "PX-9021", patientName: "Jean Uwimana", date: "2026-02-10 09:15", result: "Normal", confidence: 94.2, observation: "No significant abnormalities detected. Lung fields are clear.", status: "Verified" },
    { id: "DX-0002", patientId: "PX-8812", patientName: "Amina Mukiza", date: "2026-02-10 07:30", result: "TB Detected", confidence: 87.5, observation: "Upper lobe opacity with possible cavitation in right lung apex.", status: "Pending Review" },
    { id: "DX-0003", patientId: "PX-7741", patientName: "Eric Habimana", date: "2026-02-09 14:22", result: "Pneumonia", confidence: 91.3, observation: "Bilateral lower lobe consolidation with air bronchograms.", status: "Verified" },
    { id: "DX-0004", patientId: "PX-4412", patientName: "Grace Iradukunda", date: "2026-02-09 10:05", result: "Normal", confidence: 96.1, observation: "Clear lung fields, normal cardiac silhouette.", status: "Verified" },
    { id: "DX-0005", patientId: "PX-3301", patientName: "Patrick Niyonzima", date: "2026-02-08 16:48", result: "TB Detected", confidence: 89.8, observation: "Miliary pattern observed bilaterally. Recommend urgent follow-up.", status: "Flagged" },
    { id: "DX-0006", patientId: "PX-2289", patientName: "Diane Uwase", date: "2026-02-08 11:30", result: "Normal", confidence: 97.3, observation: "No abnormalities. Lungs well-expanded and clear.", status: "Verified" },
    { id: "DX-0007", patientId: "PX-1105", patientName: "Claude Mugisha", date: "2026-02-07 08:12", result: "Pneumonia", confidence: 88.6, observation: "Right middle lobe consolidation consistent with lobar pneumonia.", status: "Verified" },
  ]);

  const addDiagnosisRecord = (record: Omit<DiagnosisRecord, "id" | "date">) => {
    const newRecord: DiagnosisRecord = {
      ...record,
      id: `DX-${String(diagnosisHistory.length + 1).padStart(4, "0")}`,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setDiagnosisHistory((prev) => [newRecord, ...prev]);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile({
              fullName: data.fullName || user.displayName || "Clinician",
              email: data.email || user.email || "",
              role: data.role || "radiologist",
            });
          } else {
            setUserProfile({
              fullName: user.displayName || "Clinician",
              email: user.email || "",
              role: "radiologist",
            });
          }
        } catch {
          setUserProfile({
            fullName: user.displayName || "Clinician",
            email: user.email || "",
            role: "radiologist",
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    gsap.fromTo(
      ".dash-content",
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", clearProps: "transform,opacity" }
    );
  }, [activeTab]);

  const handleSignOut = async () => {
    await signOut(auth);
    onSignOut?.();
  };

  const handleTabSwitch = (tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const initials = userProfile?.fullName
    ? userProfile.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "DR";

  const roleLabel =
    userProfile?.role === "radiologist"
      ? "Radiologist"
      : userProfile?.role === "specialist"
        ? "Specialist"
        : "General Practitioner";

  const themeClass = isDark ? "bg-[#0A0F0D] text-zinc-100" : "bg-[#FAFAFA] text-gray-900";
  const cardClass = isDark ? "bg-[#111916] border-emerald-900/30" : "bg-white border-gray-100";
  const sidebarTheme = isDark ? "bg-[#070B09] border-emerald-900/20" : "bg-white border-gray-100";
  const headerTheme = isDark ? "border-emerald-900/20 bg-[#0A0F0D]/80" : "border-gray-100 bg-white/80";

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${themeClass}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-50 inset-y-0 left-0 w-60 flex flex-col p-6 transition-all duration-500 border-r ${sidebarTheme} transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <div className="w-3.5 h-1 bg-white rounded-full" />
          </div>
          <span className="text-sm font-bold tracking-tight uppercase">Ubuzima Connect</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabSwitch(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                activeTab === tab.key
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm"
                  : isDark
                    ? "text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/5"
                    : "text-gray-400 hover:text-gray-900"
              }`}
            >
              <span
                className={
                  activeTab === tab.key
                    ? "text-emerald-500"
                    : isDark
                      ? "text-zinc-600 group-hover:text-emerald-500"
                      : "text-gray-300 group-hover:text-emerald-500"
                }
              >
                {tab.icon}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className={`mt-auto pt-6 space-y-4 border-t ${isDark ? "border-emerald-900/20" : "border-gray-100"}`}>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/5 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <Icons.Logout />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar flex flex-col">
        {/* Header */}
        <header
          className={`sticky top-0 z-40 px-6 lg:px-10 py-5 flex justify-between items-center border-b backdrop-blur-md transition-colors ${headerTheme}`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-xl transition-all border ${
                isDark ? "border-emerald-900/30 text-zinc-400" : "border-gray-200 text-gray-500"
              }`}
            >
              <Icons.Menu />
            </button>
            <div className="flex flex-col">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-emerald-500 mb-0.5">
                Kigali Clinic
              </h2>
              <p className="text-base font-bold tracking-tight capitalize">
                {activeTab === "evaluation" ? "Performance" : activeTab}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2.5 rounded-xl transition-all border ${
                isDark ? "border-emerald-900/30 bg-emerald-500/5 text-zinc-300" : "border-gray-200 bg-white text-gray-500"
              }`}
              aria-label="Toggle dark mode"
            >
              {isDark ? <Icons.Sun /> : <Icons.Moon />}
            </button>
            <div className={`flex items-center gap-3 pl-4 border-l ${isDark ? "border-emerald-900/30" : "border-gray-200"}`}>
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-emerald-500/20">
                {initials}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold tracking-tight">{userProfile?.fullName || "Loading..."}</p>
                <p className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                  {roleLabel}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-6 lg:p-10 dash-content flex-1">
          {activeTab === "overview" && (
            <OverviewTab
              userName={userProfile?.fullName || "Clinician"}
              isDark={isDark}
              cardClass={cardClass}
              onGoToDiagnostic={() => setActiveTab("diagnostic")}
              onGoToHistory={() => setActiveTab("history")}
              recentRecords={diagnosisHistory.slice(0, 4)}
            />
          )}
          {activeTab === "diagnostic" && (
            <DiagnosticTab isDark={isDark} cardClass={cardClass} onDiagnosisComplete={addDiagnosisRecord} />
          )}
          {activeTab === "history" && (
            <HistoryTab isDark={isDark} cardClass={cardClass} records={diagnosisHistory} />
          )}
          {activeTab === "evaluation" && (
            <EvaluationTab isDark={isDark} cardClass={cardClass} />
          )}
          {activeTab === "settings" && (
            <SettingsTab
              userProfile={userProfile}
              isDark={isDark}
              cardClass={cardClass}
              onSignOut={handleSignOut}
            />
          )}
        </div>
      </main>

      <style>{`
        @keyframes diagnostic-scan {
          0% { transform: translateY(0); opacity: 0.2; }
          50% { transform: translateY(480px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.2; }
        }
        .animate-diagnostic-scan { animation: diagnostic-scan 3s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
      `}</style>
    </div>
  );
};

// ========== OVERVIEW TAB ==========
function OverviewTab({
  userName,
  isDark,
  cardClass,
  onGoToDiagnostic,
  onGoToHistory,
  recentRecords,
}: {
  userName: string;
  isDark: boolean;
  cardClass: string;
  onGoToDiagnostic: () => void;
  onGoToHistory: () => void;
  recentRecords: DiagnosisRecord[];
}) {
  const stats = [
    { label: "Total Scans", value: "0", change: "New", isPos: true },
    { label: "Avg. Inference", value: "0.4s", change: "Optimized", isPos: true },
    { label: "Model Accuracy", value: "96.8%", change: "+0.4%", isPos: true },
    { label: "Flagged Cases", value: "0", change: "None", isPos: true },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 text-balance">
            Welcome back, Dr. {userName.split(" ")[0]}.
          </h1>
          <p className={`text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
            Upload chest X-rays to get AI-powered TB and Pneumonia screening results.
          </p>
        </div>
        <button
          onClick={onGoToDiagnostic}
          className="px-5 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
        >
          New Diagnosis
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className={`p-6 rounded-3xl border transition-all hover:scale-[1.02] ${cardClass}`}>
            <p className={`text-[9px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
              {stat.label}
            </p>
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold tracking-tight">{stat.value}</h2>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                  stat.isPos ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Activity + Reliability */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-8 p-8 rounded-[2rem] border ${cardClass}`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
              Recent Scans
            </h3>
            <button
              onClick={onGoToHistory}
              className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="space-y-5">
            {recentRecords.map((rec) => (
              <ActivityRow key={rec.id}
                id={rec.patientId}
                name={rec.patientName}
                time={rec.date}
                res={rec.result}
                stat={rec.status}
                isDark={isDark}
              />
            ))}
          </div>
        </div>
        <div className={`lg:col-span-4 p-8 rounded-[2rem] border flex flex-col justify-between ${cardClass}`}>
          <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
            Model Reliability
          </h3>
          <div className="py-8 flex justify-center">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke={isDark ? "#1a2f23" : "#ecfdf5"} strokeWidth="3" />
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="3" strokeDasharray="96.8 3.2" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">96.8%</span>
                <span className={`text-[8px] uppercase font-bold ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                  Accuracy
                </span>
              </div>
            </div>
          </div>
          <p className={`text-[11px] text-center leading-relaxed ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
            Trained on NIH ChestX-ray14, VinDr-CXR, and Shenzhen TB datasets.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            step: "1",
            title: "Upload X-Ray",
            desc: "Go to the Diagnostic tab and upload a chest X-ray image. Supports PNG, JPG, and DICOM formats.",
            color: "bg-emerald-50 text-emerald-600",
            darkColor: "bg-emerald-500/10 text-emerald-400",
          },
          {
            step: "2",
            title: "AI Analysis",
            desc: "The AI model screens for Tuberculosis and Pneumonia with confidence scores and clinical observations.",
            color: "bg-blue-50 text-blue-600",
            darkColor: "bg-blue-500/10 text-blue-400",
          },
          {
            step: "3",
            title: "Review & Verify",
            desc: "Review the results, verify the diagnosis, and push confirmed cases to the health information system.",
            color: "bg-amber-50 text-amber-600",
            darkColor: "bg-amber-500/10 text-amber-400",
          },
        ].map((item, i) => (
          <div key={i} className={`p-6 rounded-2xl border ${cardClass}`}>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold mb-4 ${isDark ? item.darkColor : item.color}`}
            >
              {item.step}
            </div>
            <h3 className="text-sm font-bold mb-1">{item.title}</h3>
            <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-500" : "text-gray-400"}`}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== DIAGNOSTIC TAB ==========
function DiagnosticTab({ isDark, cardClass, onDiagnosisComplete }: { isDark: boolean; cardClass: string; onDiagnosisComplete: (record: Omit<DiagnosisRecord, "id" | "date">) => void }) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, or DICOM).");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!uploadedImage) return;
    setIsScanning(true);
    setError("");
    try {
      // Simulated inference -- replace with your deployed model API endpoint
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const mockResults: AnalysisResult[] = [
        {
          result: "Normal",
          confidence: 94.2,
          observation:
            "No significant abnormalities detected. Lung fields are clear with no evidence of consolidation, effusion, or mass lesions. Heart size appears within normal limits.",
        },
        {
          result: "TB Detected",
          confidence: 87.5,
          observation:
            "Upper lobe opacity with possible cavitation noted in the right lung apex. Pattern consistent with pulmonary tuberculosis. Recommend sputum AFB testing.",
        },
        {
          result: "Pneumonia",
          confidence: 91.3,
          observation:
            "Bilateral lower lobe consolidation with air bronchograms visible. Findings consistent with bacterial pneumonia. Recommend clinical correlation.",
        },
      ];
      const selected = mockResults[Math.floor(Math.random() * mockResults.length)];
      setAnalysisResult(selected);
      // Add to history
      const names = ["Jean Uwimana", "Amina Mukiza", "Eric Habimana", "Grace Iradukunda", "Diane Uwase", "Claude Mugisha"];
      onDiagnosisComplete({
        patientId: `PX-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        patientName: names[Math.floor(Math.random() * names.length)],
        result: selected.result,
        confidence: selected.confidence,
        observation: selected.observation,
        status: "Pending Review",
      });
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resultColor =
    analysisResult?.result === "Normal"
      ? "text-emerald-500"
      : "text-red-500";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1">Diagnostic Station</h2>
        <p className={`text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
          Upload a chest X-ray and the AI model will screen for TB and Pneumonia.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Area */}
        <div className="space-y-4">
          <div
            className={`relative border-2 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center justify-center transition-all min-h-[480px] ${
              uploadedImage
                ? "border-emerald-500/30 bg-emerald-500/5"
                : isDark
                  ? "border-zinc-800 hover:border-emerald-500/20"
                  : "border-gray-200 hover:border-emerald-500/20"
            }`}
          >
            {!uploadedImage ? (
              <div className="text-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"} text-emerald-500`}>
                  <Icons.Scan />
                </div>
                <p className="text-sm font-bold mb-1">Upload Chest X-Ray</p>
                <p className={`text-[10px] uppercase tracking-widest mb-4 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                  PNG, JPG, or DICOM (Max 50MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
              </div>
            ) : (
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black shadow-2xl">
                <img
                  src={uploadedImage || "/placeholder.svg"}
                  className={`w-full h-full object-contain transition-all duration-1000 ${isScanning ? "brightness-50" : "brightness-100"}`}
                  alt="Uploaded chest X-ray"
                  crossOrigin="anonymous"
                />
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-emerald-500 absolute top-0 animate-diagnostic-scan shadow-[0_0_15px_#10b981]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-emerald-500 animate-pulse">
                      Analyzing...
                    </span>
                  </div>
                )}
                <button
                  onClick={clearImage}
                  className="absolute top-4 right-4 bg-white/20 p-2 rounded-full text-white hover:bg-white/40 transition-colors"
                  aria-label="Remove image"
                >
                  <Icons.X />
                </button>
              </div>
            )}
          </div>

          {uploadedImage && !isScanning && !analysisResult && (
            <button
              onClick={handleAnalyze}
              className="w-full py-4 bg-emerald-500 text-white font-bold uppercase tracking-widest text-[10px] rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10"
            >
              Run AI Diagnosis
            </button>
          )}
        </div>

        {/* Results Panel */}
        <div
          className={`p-8 lg:p-10 rounded-[2.5rem] border flex flex-col justify-between min-h-[480px] transition-all ${cardClass} ${
            !uploadedImage ? "opacity-30 blur-sm pointer-events-none" : "opacity-100"
          }`}
        >
          <div>
            <span className={`text-[9px] font-bold uppercase tracking-[0.4em] block mb-8 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
              Diagnostic Result
            </span>
            <h2
              className={`text-4xl lg:text-5xl font-bold tracking-tighter mb-6 ${
                isScanning
                  ? isDark ? "animate-pulse text-zinc-700" : "animate-pulse text-gray-200"
                  : analysisResult
                    ? resultColor
                    : isDark ? "text-zinc-700" : "text-gray-200"
              }`}
            >
              {isScanning ? "SCANNING..." : analysisResult?.result.toUpperCase() || "AWAITING SCAN"}
            </h2>

            {!isScanning && analysisResult && (
              <div className="space-y-6">
                <div>
                  <div className={`flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                    <span>Confidence</span>
                    <span>{analysisResult.confidence}%</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-gray-100"}`}>
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${analysisResult.confidence}%` }}
                    />
                  </div>
                </div>
                <div className={`p-5 rounded-2xl border ${isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-gray-50 border-gray-100"}`}>
                  <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                    Clinical Observation
                  </p>
                  <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                    {analysisResult.observation}
                  </p>
                </div>
              </div>
            )}
          </div>

          {!isScanning && analysisResult && (
            <div className="grid grid-cols-2 gap-4 mt-10">
              <button className="py-4 bg-emerald-500 text-white font-bold uppercase tracking-widest text-[10px] rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10">
                Verify & Confirm
              </button>
              <button
                className={`py-4 border font-bold uppercase tracking-widest text-[10px] rounded-2xl transition-all ${
                  isDark
                    ? "border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                    : "border-gray-200 text-gray-400 hover:bg-gray-50"
                }`}
              >
                Flag for Review
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`rounded-xl px-4 py-3 border ${isDark ? "bg-emerald-500/5 border-emerald-900/20" : "bg-emerald-50 border-emerald-100"}`}>
        <p className={`text-xs leading-relaxed ${isDark ? "text-emerald-400/60" : "text-emerald-700"}`}>
          <strong>Note:</strong> This diagnostic tool uses a simulated AI response for demonstration.
          Connect your deployed model API endpoint to enable real-time chest X-ray analysis.
        </p>
      </div>
    </div>
  );
}

// ========== EVALUATION TAB ==========
function EvaluationTab({ isDark, cardClass }: { isDark: boolean; cardClass: string }) {
  const metrics = [
    { label: "Accuracy", value: "96.8%", desc: "Overall correct predictions across all classes" },
    { label: "Precision", value: "95.1%", desc: "Positive predictions that were actually correct" },
    { label: "Recall", value: "94.7%", desc: "Actual positives correctly identified by the model" },
    { label: "F1 Score", value: "94.9%", desc: "Harmonic mean of precision and recall" },
    { label: "AUC-ROC", value: "0.98", desc: "Model's ability to distinguish between classes" },
    { label: "Inference Time", value: "0.4s", desc: "Average time per X-ray prediction" },
  ];

  const confusionMatrix = [
    { actual: "Normal", predicted: { Normal: 1842, TB: 12, Pneumonia: 8 } },
    { actual: "TB", predicted: { Normal: 18, TB: 384, Pneumonia: 6 } },
    { actual: "Pneumonia", predicted: { Normal: 14, TB: 4, Pneumonia: 412 } },
  ];

  const maxVal = 1842;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1">Model Performance</h2>
        <p className={`text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
          Current model evaluation metrics. These are read-only for radiologists. Admins can retrain the model.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className={`p-6 rounded-2xl border ${cardClass}`}>
            <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
              {m.label}
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-emerald-500">{m.value}</h3>
            <p className={`text-[10px] mt-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Confusion Matrix */}
      <div className={`p-8 rounded-[2rem] border ${cardClass}`}>
        <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
          Confusion Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full max-w-lg mx-auto">
            <thead>
              <tr>
                <th className={`text-[9px] font-bold uppercase tracking-widest p-3 text-left ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                  Actual / Predicted
                </th>
                {["Normal", "TB", "Pneumonia"].map((h) => (
                  <th key={h} className={`text-[9px] font-bold uppercase tracking-widest p-3 text-center ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {confusionMatrix.map((row, i) => (
                <tr key={i}>
                  <td className="text-xs font-bold p-3">{row.actual}</td>
                  {(["Normal", "TB", "Pneumonia"] as const).map((col) => {
                    const val = row.predicted[col];
                    const intensity = val / maxVal;
                    const isDiagonal = row.actual === col;
                    return (
                      <td key={col} className="p-2 text-center">
                        <div
                          className={`rounded-xl py-3 px-4 text-sm font-bold ${
                            isDiagonal
                              ? "bg-emerald-500 text-white"
                              : isDark
                                ? "text-zinc-400"
                                : "text-gray-600"
                          }`}
                          style={
                            !isDiagonal
                              ? {
                                  backgroundColor: isDark
                                    ? `rgba(239, 68, 68, ${intensity * 0.3})`
                                    : `rgba(239, 68, 68, ${intensity * 0.15})`,
                                }
                              : undefined
                          }
                        >
                          {val}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`text-[10px] text-center mt-4 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
          Diagonal (green) = correct predictions. Off-diagonal (red shading) = misclassifications.
        </p>
      </div>

      {/* Model Info */}
      <div className={`p-6 rounded-2xl border ${cardClass}`}>
        <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
          Model Information
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className={`text-[10px] uppercase tracking-wider mb-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>Architecture</p>
            <p className="text-sm font-bold">DenseNet-121 (Transfer Learning)</p>
          </div>
          <div>
            <p className={`text-[10px] uppercase tracking-wider mb-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>Training Data</p>
            <p className="text-sm font-bold">NIH 112k + VinDr 18k + Shenzhen 662</p>
          </div>
          <div>
            <p className={`text-[10px] uppercase tracking-wider mb-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>Last Updated</p>
            <p className="text-sm font-bold">February 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== SETTINGS TAB ==========
function SettingsTab({
  userProfile,
  isDark,
  cardClass,
  onSignOut,
}: {
  userProfile: UserProfile | null;
  isDark: boolean;
  cardClass: string;
  onSignOut: () => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1">System Settings</h2>
        <p className={`text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
          Your account details and system information.
        </p>
      </div>

      {/* Profile */}
      <div className={`p-6 rounded-2xl border ${cardClass}`}>
        <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
          Profile
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className={`text-[10px] uppercase tracking-wider mb-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>Full Name</p>
            <p className="text-sm font-bold">{userProfile?.fullName || "---"}</p>
          </div>
          <div>
            <p className={`text-[10px] uppercase tracking-wider mb-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>Email</p>
            <p className="text-sm font-bold">{userProfile?.email || "---"}</p>
          </div>
          <div>
            <p className={`text-[10px] uppercase tracking-wider mb-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>Role</p>
            <p className="text-sm font-bold capitalize">{userProfile?.role || "---"}</p>
          </div>
          <div>
            <p className={`text-[10px] uppercase tracking-wider mb-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>Clinic</p>
            <p className="text-sm font-bold">Kigali Central Clinic</p>
          </div>
        </div>
      </div>

      {/* Active Model */}
      <div className={`p-6 rounded-2xl border ${cardClass}`}>
        <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
          Model
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <p className="text-sm font-bold">DenseNet </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 text-red-500">
          Account Actions
        </h3>
        <button
          onClick={onSignOut}
          className="px-5 py-3 bg-red-500 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-400 transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ========== HISTORY TAB ==========
function HistoryTab({
  isDark,
  cardClass,
  records,
}: {
  isDark: boolean;
  cardClass: string;
  records: DiagnosisRecord[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "Verified" | "Pending Review" | "Flagged">("all");
  const [selectedRecord, setSelectedRecord] = useState<DiagnosisRecord | null>(null);

  const filtered = records.filter((r) => {
    const matchesSearch =
      searchQuery === "" ||
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.result.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    all: records.length,
    Verified: records.filter((r) => r.status === "Verified").length,
    "Pending Review": records.filter((r) => r.status === "Pending Review").length,
    Flagged: records.filter((r) => r.status === "Flagged").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1">Diagnosis History</h2>
        <p className={`text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
          Search and review all past patient diagnoses.
        </p>
      </div>

      {/* Search + Filter Bar */}
      <div className={`p-5 rounded-2xl border ${cardClass}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-zinc-600" : "text-gray-300"}`}>
              <Icons.Search />
            </div>
            <input
              type="text"
              placeholder="Search by patient name, ID, or diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 ${
                isDark
                  ? "bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
              }`}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "Verified", "Pending Review", "Flagged"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  filterStatus === status
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/10"
                    : isDark
                      ? "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                      : "border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300"
                }`}
              >
                {status === "all" ? "All" : status}
                <span className="ml-1.5 opacity-60">{statusCounts[status]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className={`${selectedRecord ? "lg:col-span-7" : "lg:col-span-12"} space-y-3 transition-all`}>
          {filtered.length === 0 ? (
            <div className={`p-12 rounded-2xl border text-center ${cardClass}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-zinc-800" : "bg-gray-100"}`}>
                <Icons.Search />
              </div>
              <p className="text-sm font-bold mb-1">No records found</p>
              <p className={`text-xs ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            filtered.map((record) => (
              <button
                key={record.id}
                onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                className={`w-full text-left p-5 rounded-2xl border transition-all hover:scale-[1.005] ${
                  selectedRecord?.id === record.id
                    ? "border-emerald-500/40 shadow-lg shadow-emerald-500/5 " + (isDark ? "bg-emerald-500/5" : "bg-emerald-50/50")
                    : cardClass
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-[10px] font-bold ${
                        record.result === "Normal"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : record.result === "TB Detected"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {record.patientName.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight">{record.patientName}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                          {record.patientId}
                        </span>
                        <span className={`text-[9px] ${isDark ? "text-zinc-700" : "text-gray-300"}`}>|</span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                          {record.date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                        record.result === "Normal"
                          ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20"
                          : record.result === "TB Detected"
                            ? "bg-red-500/5 text-red-500 border-red-500/20"
                            : "bg-amber-500/5 text-amber-500 border-amber-500/20"
                      }`}
                    >
                      {record.result}
                    </span>
                    <span
                      className={`hidden md:inline-block px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                        record.status === "Verified"
                          ? isDark ? "border-zinc-800 text-zinc-500" : "border-gray-200 text-gray-400"
                          : record.status === "Flagged"
                            ? "border-red-500/20 text-red-500 bg-red-500/5"
                            : "border-amber-500/20 text-amber-500 bg-amber-500/5"
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail Panel */}
        {selectedRecord && (
          <div className={`lg:col-span-5 p-8 rounded-[2rem] border sticky top-28 self-start ${cardClass}`}>
            <div className="flex items-center justify-between mb-6">
              <span className={`text-[9px] font-bold uppercase tracking-[0.4em] ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                Diagnosis Detail
              </span>
              <button
                onClick={() => setSelectedRecord(null)}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-zinc-800 text-zinc-500" : "hover:bg-gray-100 text-gray-400"}`}
              >
                <Icons.X />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold tracking-tight">{selectedRecord.patientName}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                    {selectedRecord.patientId}
                  </span>
                  <span className={`text-[10px] ${isDark ? "text-zinc-700" : "text-gray-300"}`}>|</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                    {selectedRecord.id}
                  </span>
                </div>
              </div>
              <div>
                <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                  AI Result
                </p>
                <p className={`text-2xl font-bold tracking-tight ${
                  selectedRecord.result === "Normal" ? "text-emerald-500" : "text-red-500"
                }`}>
                  {selectedRecord.result}
                </p>
              </div>
              <div>
                <div className={`flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                  <span>Confidence</span>
                  <span>{selectedRecord.confidence}%</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-gray-100"}`}>
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${selectedRecord.confidence}%` }}
                  />
                </div>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-gray-50 border-gray-100"}`}>
                <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
                  Clinical Observation
                </p>
                <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-300" : "text-gray-600"}`}>
                  {selectedRecord.observation}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>Date</p>
                  <p className="text-sm font-bold">{selectedRecord.date}</p>
                </div>
                <div>
                  <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>Status</p>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
                      selectedRecord.status === "Verified"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : selectedRecord.status === "Flagged"
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    }`}
                  >
                    {selectedRecord.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className={`p-5 rounded-2xl border grid grid-cols-2 md:grid-cols-4 gap-4 ${cardClass}`}>
        <div>
          <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>Total Diagnoses</p>
          <p className="text-lg font-bold">{records.length}</p>
        </div>
        <div>
          <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>Normal</p>
          <p className="text-lg font-bold text-emerald-500">{records.filter((r) => r.result === "Normal").length}</p>
        </div>
        <div>
          <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>TB Detected</p>
          <p className="text-lg font-bold text-red-500">{records.filter((r) => r.result === "TB Detected").length}</p>
        </div>
        <div>
          <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-zinc-600" : "text-gray-400"}`}>Pneumonia</p>
          <p className="text-lg font-bold text-amber-500">{records.filter((r) => r.result === "Pneumonia").length}</p>
        </div>
      </div>
    </div>
  );
}

// ========== SUB-COMPONENTS ==========
const ActivityRow = ({ id, name, time, res, stat, isDark }: { id: string; name: string; time: string; res: string; stat: string; isDark: boolean }) => (
  <div className={`flex items-center justify-between py-1 border-b pb-4 last:border-0 ${isDark ? "border-zinc-800" : "border-gray-50"}`}>
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold ${
        res === "Normal" ? "bg-emerald-500/10 text-emerald-500" : res === "TB Detected" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
      }`}>
        {name.split(" ").map((n) => n[0]).join("")}
      </div>
      <div>
        <p className="text-xs font-bold tracking-tight">{name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className={`text-[9px] uppercase tracking-widest ${isDark ? "text-zinc-600" : "text-gray-400"}`}>{id}</p>
          <span className={`text-[9px] ${isDark ? "text-zinc-700" : "text-gray-300"}`}>|</span>
          <p className={`text-[9px] uppercase tracking-widest ${isDark ? "text-zinc-600" : "text-gray-400"}`}>{time}</p>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-6">
      <span
        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
          res === "Normal"
            ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20"
            : "bg-red-500/5 text-red-500 border-red-500/20"
        }`}
      >
        {res}
      </span>
      <span className={`text-[9px] font-bold uppercase tracking-widest hidden md:block ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
        {stat}
      </span>
    </div>
  </div>
);

export default Dashboard;
