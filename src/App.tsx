/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Gavel, FileText, User, X, Languages,
  CheckCircle2, ArrowRight, RotateCcw, Mic,
  Contrast, Hand, Settings, Activity, Phone,
  MapPin, HelpCircle, Search, Bell, Info, AlertTriangle,
  ChevronRight, PlayCircle, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import LoginScreen from "@/components/Auth/LoginScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { apiFetch } from "@/lib/apiClient";
import FindLawyer from "@/pages/FindLawyer";
import VideoCall from "@/pages/VideoCall";
import PaymentPage from "@/pages/PaymentPage";
import LawyerProfile from "@/pages/LawyerProfile";
import AccessibilityBar from "@/components/AccessibilityBar";



// --- Localization ---
const translations = {
  en: {
    welcome: "Namaste, Amit",
    subtitle: "Your legal assistant is ready to help.",
    scan: "Scan Document",
    status: "Case Status",
    find: "Find Court",
    help: "AI Legal Help",
    recent: "Recent Updates",
    align: "Align the Document within the frame",
    capture: "Capture Document",
    retake: "Retake",
    confirm: "Confirm Data",
    extracted: "Extracted Info",
    verified: "Verified",
    docType: "Document Type",
    date: "Date of Notice",
    authority: "Court/Authority",
    signLang: "Sign Language Support",
    voice: "Voice Guidance",
    contrast: "High Contrast",
    home: "Home",
    profile: "Profile",
    searchPlaceholder: "Search for courts or police stations...",
    caseLookup: "Enter Case Number (e.g., CNR Number)",
    lookup: "Lookup Status"
  },
  hi: {
    welcome: "नमस्ते, अमित",
    subtitle: "आपका कानूनी सहायक मदद के लिए तैयार है।",
    scan: "दस्तावेज़ स्कैन करें",
    status: "केस की स्थिति",
    find: "कोर्ट खोजें",
    help: "AI कानूनी मदद",
    recent: "हाल के अपडेट",
    align: "दस्तावेज़ को फ्रेम के भीतर रखें",
    capture: "दस्तावेज़ कैप्चर करें",
    retake: "फिर से लें",
    confirm: "डेटा पुष्टि करें",
    extracted: "निकाली गई जानकारी",
    verified: "सत्यापित",
    docType: "दस्तावेज़ प्रकार",
    date: "नोटिस की तारीख",
    authority: "कोर्ट/प्राधिकरण",
    signLang: "सांकेतिक भाषा सहायता",
    voice: "आवाज मार्गदर्शन",
    contrast: "उच्च कंट्रास्ट",
    home: "होम",
    profile: "प्रोफाइल",
    searchPlaceholder: "कोर्ट या पुलिस स्टेशन खोजें...",
    caseLookup: "केस नंबर दर्ज करें (जैसे CNR नंबर)",
    lookup: "स्थिति देखें"
  }
};

type Language = 'en' | 'hi';

interface ExtractedInfo {
  documentType: string;
  dateOfNotice: string;
  courtAuthority: string;
  sections: string[];
  summary: string;
  nextSteps: string[];
  urgency: 'High' | 'Medium' | 'Low';
}

// --- Components ---

const SignLanguageOverlay = ({ term, onClose }: { term: string, onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-100 bg-black/90 flex flex-col items-center justify-center p-6"
  >
    <button onClick={onClose} className="absolute top-8 right-8 text-white p-2 bg-white/10 rounded-full">
      <X className="w-8 h-8" />
    </button>
    <div className="w-full max-w-sm aspect-video bg-white/5 rounded-3xl overflow-hidden mb-8 flex items-center justify-center border border-white/10">
      <PlayCircle className="w-20 h-20 text-primary animate-pulse" />
      {/* In a real app, this would be a <video> tag with the GIF/MP4 asset */}
    </div>
    <h3 className="text-white text-3xl font-headline font-bold mb-2">{term}</h3>
    <p className="text-white/60 text-center">Showing Sign Language representation for legal term "{term}"</p>
  </motion.div>
);

const TopBar = ({ title, onLangSwitch }: { title: string, onLangSwitch: () => void }) => (
  <header className="bg-surface border-b border-outline-variant/15 fixed top-0 z-50 flex justify-between items-center w-full px-6 py-4">
    <div className="flex items-center gap-4">
      <Link to="/" className="hover:bg-surface-container p-2 rounded-full transition-colors">
        <X className="text-primary w-6 h-6" />
      </Link>
      <h1 className="font-headline font-extrabold text-primary text-xl tracking-tighter">{title}</h1>
    </div>
    <div className="flex items-center gap-3">
      <button onClick={onLangSwitch} className="hover:bg-surface-container p-2 rounded-full transition-colors flex items-center gap-1">
        <Languages className="text-primary w-6 h-6" />
        <span className="text-[10px] font-bold text-primary uppercase">Lang</span>
      </button>
      <button className="hover:bg-surface-container p-2 rounded-full transition-colors">
        <User className="text-primary w-6 h-6" />
      </button>
    </div>
  </header>
);

const BottomNav = () => {
  const location = useLocation();
  const navItems = [
    { path: "/", icon: <Search className="w-6 h-6" />, label: "Home" },
    { path: "/status", icon: <Gavel className="w-6 h-6" />, label: "Case Status" },
    { path: "/scan", icon: <FileText className="w-6 h-6" />, label: "Documents", active: true },
    { path: "/profile", icon: <User className="w-6 h-6" />, label: "Profile" },
  ];

  return (
    <nav className="bg-surface fixed bottom-0 left-0 w-full z-50 flex justify-around items-center pt-3 pb-6 px-4 border-t border-outline-variant/10 shadow-lg">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "flex flex-col items-center justify-center transition-colors",
            location.pathname === item.path ? "text-primary" : "text-secondary"
          )}
        >
          {item.icon}
          <span className="text-[10px] font-medium mt-1">{item.label}</span>
          {location.pathname === item.path && (
            <motion.div layoutId="nav-dot" className="w-1 h-1 bg-primary rounded-full mt-1" />
          )}
        </Link>
      ))}
    </nav>
  );
};

// --- Pages ---

const Dashboard = ({ lang }: { lang: Language }) => {
  const t = translations[lang];
  const actions = [
    { title: t.scan, icon: <Camera />, color: "bg-primary", path: "/scan" },
    { title: t.status, icon: <Gavel />, color: "bg-tertiary", path: "/status" },
    { title: t.find, icon: <MapPin />, color: "bg-secondary", path: "/find" },
    { title: t.help, icon: <HelpCircle />, color: "bg-primary-container", path: "/help" },
  ];

  return (
    <div className="pt-24 pb-32 px-6 min-h-screen bg-surface">
      <div className="mb-8">
        <h2 className="text-3xl font-headline font-extrabold text-on-surface mb-2">{t.welcome}</h2>
        <p className="text-secondary">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            to={action.path}
            className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col gap-4 border border-outline-variant/10"
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", action.color)}>
              {action.icon}
            </div>
            <span className="font-headline font-bold text-on-surface">{action.title}</span>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-primary/5 p-6 rounded-2xl border border-primary/10">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="text-primary w-5 h-5" />
          <h3 className="font-headline font-bold text-primary">{t.recent}</h3>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4 items-start p-3 bg-white rounded-xl shadow-sm">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
            <div>
              <p className="text-sm font-bold">Case #4521 Status Updated</p>
              <p className="text-xs text-secondary">Next hearing: Oct 30, 2023 • District Court</p>
            </div>
            <ChevronRight className="w-4 h-4 text-outline ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Scanner = ({ lang }: { lang: Language }) => {
  const t = translations[lang];
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null);
  const [showSignLang, setShowSignLang] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    }
    setupCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const captureAndInterpret = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    setIsScanning(true);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
    setCapturedImage(base64Image);

    try {
      const response: any = await apiFetch('/api/interpret-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, mimeType: 'image/jpeg' })
      });

      const data = response as any;
      if (data?.error) throw new Error(data.error);
      setExtractedInfo(data);
    } catch (error) {
      const err = error as any;
      console.error("Interpretation failed:", err);
      alert(err?.message || "Failed to analyze document. Please try again.");
    } finally {
      setIsProcessing(false);
      setIsScanning(false);
    }
  };

  const saveDocument = async () => {
    if (!capturedImage || !extractedInfo) return;
    setIsSaving(true);
    try {
      const response = await apiFetch('/api/save-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedImage, analysis: extractedInfo })
      }) as any;
      // apiFetch may return a raw Response or already-parsed JSON depending on implementation.
      const data = response && typeof response.json === 'function' ? await response.json() : response;
      if (data.success) {
        alert("Document saved successfully to Supabase!");
        setExtractedInfo(null);
        setCapturedImage(null);
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save document.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      <TopBar title="Smart Scanner" onLangSwitch={() => {}} />

      <div className="absolute inset-0 flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover grayscale opacity-60"
        />
        <canvas ref={canvasRef} className="hidden" />

        <div className="relative w-full max-w-md aspect-3/4 px-4">
          <div className="absolute inset-4 border-2 border-primary/40 rounded-xl overflow-hidden shadow-[0_0_0_100vmax_rgba(0,0,0,0.5)]">
            {(isScanning || isProcessing) && (
              <motion.div
                initial={{ top: 0 }}
                animate={{ top: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 w-full h-1 bg-linear-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(26,115,232,0.8)] z-20"
              />
            )}

            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
          </div>
          <p className="absolute top-8 text-white font-headline font-bold text-center w-full drop-shadow-lg px-8">
            {t.align}
          </p>
        </div>
      </div>

      <div className="absolute right-6 top-24 flex flex-col gap-4 z-30">
        <button
          onClick={() => setShowSignLang("Legal Help")}
          className="w-14 h-14 bg-white/80 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-primary/20 hover:scale-105 transition-transform"
        >
          <Hand className="text-primary w-7 h-7" />
        </button>
        <button className="w-14 h-14 bg-white/80 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-primary/20 hover:scale-105 transition-transform">
          <Mic className="text-primary w-7 h-7" />
        </button>
        <button className="w-14 h-14 bg-white/80 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-primary/20 hover:scale-105 transition-transform">
          <Contrast className="text-primary w-7 h-7" />
        </button>
      </div>

      <AnimatePresence>
        {extractedInfo && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-32 w-full px-6 z-30"
          >
            <div className="bg-white/95 backdrop-blur-2xl p-6 rounded-2xl border border-white/40 shadow-2xl space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                <span className="text-primary font-headline font-bold text-xs tracking-widest uppercase">{t.extracted}</span>
                <span className="flex items-center gap-1 text-tertiary text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  {t.verified}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-secondary text-[10px] font-medium uppercase tracking-tighter">{t.docType}</p>
                  <p className="font-headline font-bold text-on-surface text-sm">{extractedInfo.documentType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-secondary text-[10px] font-medium uppercase tracking-tighter">{t.date}</p>
                  <p className="font-headline font-bold text-on-surface text-sm">{extractedInfo.dateOfNotice}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-secondary text-[10px] font-medium uppercase tracking-tighter">{t.authority}</p>
                  <p className="font-headline font-bold text-on-surface text-sm">{extractedInfo.courtAuthority}</p>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-primary uppercase">AI Summary</h4>
                  <button
                    onClick={() => {
                      const keywords = ["Bail", "Summons", "Warrant", "Challan", "Court"];
                      const found = keywords.find(k => extractedInfo.summary.toLowerCase().includes(k.toLowerCase()));
                      setShowSignLang(found || "Legal Document");
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg"
                  >
                    <Hand className="w-3 h-3" />
                    Sign Help
                  </button>
                </div>
                <p className="text-sm text-on-surface leading-relaxed">{extractedInfo.summary}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-secondary uppercase">Next Steps</h4>
                {extractedInfo.nextSteps.map((step, i: number) => (
                  <div key={i} className="flex gap-2 items-start text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 w-full h-32 bg-linear-to-t from-black/80 to-transparent flex items-center justify-center px-8 pb-8 z-40">
        <div className="w-full max-w-md flex items-center justify-between gap-4">
          {!extractedInfo ? (
            <button
              onClick={captureAndInterpret}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-primary text-white font-headline font-bold flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
            >
              {isProcessing ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
              {isProcessing ? "Analyzing..." : t.capture}
            </button>
          ) : (
            <>
              <button
                onClick={() => setExtractedInfo(null)}
                className="flex-1 py-4 px-6 rounded-xl bg-white text-primary font-headline font-bold text-sm shadow-lg flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {t.retake}
              </button>
              <button
                onClick={saveDocument}
                disabled={isSaving}
                className="flex-2 py-4 px-6 rounded-xl bg-linear-to-br from-primary to-primary-container text-white font-headline font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Activity className="w-4 h-4 animate-spin" /> : t.confirm}
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSignLang && (
          <SignLanguageOverlay term={showSignLang} onClose={() => setShowSignLang(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

const CNR_PATTERN = /^[A-Z]{2,6}\d{0,2}-?\d{6}-?\d{4}$/i;

const CaseStatus = ({ lang }: { lang: Language }) => {
  const t = translations[lang];
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    const cnr = query.trim();
    if (!cnr) return;

    if (!CNR_PATTERN.test(cnr)) {
      setError("Invalid CNR format. Example: DLSC01-002315-2024");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiFetch<Record<string, string>>(`/api/case-status/${encodeURIComponent(cnr)}`);
      setResult(data);
    } catch (err) {
      const msg = (err as Error)?.message || "Lookup failed. Please try again.";
      setError(msg);
      console.error("Lookup failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-32 px-6 min-h-screen bg-surface">
      <TopBar title={t.status} onLangSwitch={() => {}} />

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 mb-6">
        <label className="block text-xs font-bold text-secondary uppercase mb-2">{t.caseLookup}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. CNR-DEL-123"
            className="flex-1 bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleLookup}
            disabled={loading}
            className="bg-primary text-white p-3 rounded-xl shadow-lg disabled:opacity-50"
          >
            {loading ? <Activity className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </p>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-headline font-bold text-lg">{result.caseNo}</h3>
                  <p className="text-xs text-secondary">{result.court}</p>
                </div>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                  {result.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-outline-variant/5">
                <div>
                  <p className="text-[10px] text-secondary uppercase font-bold">Next Hearing</p>
                  <p className="text-sm font-bold">{result.nextHearing}</p>
                </div>
                <div>
                  <p className="text-[10px] text-secondary uppercase font-bold">Judge</p>
                  <p className="text-sm font-bold">{result.judge}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[10px] text-secondary uppercase font-bold mb-1">Last Order</p>
                <p className="text-sm leading-relaxed">{result.lastOrder}</p>
              </div>
            </div>

            <button className="w-full py-4 bg-surface-container-lowest border border-primary/20 text-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              <Bell className="w-4 h-4" />
              Notify me of updates
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type ChatMessage = { role: 'user' | 'model'; text: string };

const LegalHelp = ({ lang }: { lang: Language }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Namaste! I am Legis. How can I help you with legal information today? Jurisprudence, Simplified.' },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Exclude welcome message and only send prior user/model turns to the API
      const historyForApi = messages
        .slice(1)
        .map(m => ({ role: m.role, text: m.text }));

      const response = await apiFetch<{ reply?: string; text?: string }>('/api/legal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: historyForApi,
          lang
        })
      });
      const reply = response?.reply ?? response?.text ?? 'No response received.';
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-32 px-6 h-screen flex flex-col bg-surface">
      <TopBar title="AI Legal Help" onLangSwitch={() => {}} />

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] p-4 rounded-2xl text-sm shadow-sm",
              m.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-white text-on-surface rounded-tl-none border border-outline-variant/10"
            )}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-outline-variant/10 shadow-sm">
              <Activity className="w-5 h-5 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-lg border border-outline-variant/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about bail, summons, etc..."
          className="flex-1 border-none bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-primary text-white p-3 rounded-xl shadow-lg disabled:opacity-50"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const FindCourt = ({ lang }: { lang: Language }) => {
  const t = translations[lang];
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const value = await apiFetch<{ results?: unknown[] }>(
          `/api/directory?q=${encodeURIComponent(query)}`
        );
        const list = Array.isArray(value?.results) ? value.results : [];
        setResults(list);
      } catch (err) {
        setResults([]);
        setError((err as Error)?.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="pt-24 pb-32 px-6 min-h-screen bg-surface">
      <TopBar title={t.find} onLangSwitch={() => {}} />
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/10 mb-6 flex items-center gap-3">
        <Search className="text-outline w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="flex-1 border-none bg-transparent focus:ring-0 text-sm"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Activity className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-destructive text-center py-4">{error}</p>
      )}

      {!loading && !error && results.length === 0 && (
        <p className="text-sm text-secondary text-center py-8">No courts found. Try a different search.</p>
      )}

      <div className="space-y-4">
{(Array.isArray(results) ? results : []).map((loc: any, idx) => (
          <div key={loc.id ?? `${loc.name}-${idx}`} className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/10 flex items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                {loc.type === 'Court' || loc.type === 'District' || loc.type === 'High Court'
                  ? <Gavel className="w-5 h-5 text-primary" />
                  : <Phone className="w-5 h-5 text-secondary" />}
              </div>
              <div>
                <h4 className="font-bold text-sm">{loc.name}</h4>
                <p className="text-xs text-secondary">
                  {loc.type} • {loc.city ?? loc.district ?? loc.state ?? loc.address ?? '—'}
                </p>
                {loc.phone && (
                  <p className="text-[10px] text-primary font-bold mt-1">{loc.phone}</p>
                )}
              </div>
            </div>
            <button className="p-2 bg-primary/5 rounded-lg" aria-label="View on map">
              <MapPin className="w-5 h-5 text-primary" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    apiFetch("/api/scraper-status").then((value: any) => setStats(value));
  }, []);

  return (
    <div className="p-8 bg-surface min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-headline font-extrabold text-primary">Admin Dashboard</h1>
            <p className="text-secondary">Nyaya-Sahayak System Control</p>
          </div>
          <div className="flex gap-4">
            <button className="bg-white p-2 rounded-lg border border-outline-variant/20 shadow-sm">
              <Settings className="w-6 h-6 text-secondary" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="text-tertiary w-5 h-5" />
              <h3 className="font-bold">Scraper Health</h3>
            </div>
            <p className="text-4xl font-headline font-extrabold text-tertiary">{stats?.status === 'active' ? 'Healthy' : 'Offline'}</p>
            <p className="text-sm text-secondary mt-2">Last run: {stats?.lastRun ? new Date(stats.lastRun).toLocaleTimeString() : 'Never'}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <Gavel className="text-primary w-5 h-5" />
              <h3 className="font-bold">Cases Scraped</h3>
            </div>
            <p className="text-4xl font-headline font-extrabold text-primary">{stats?.casesProcessed || 0}</p>
            <p className="text-sm text-secondary mt-2">Daily target: 500</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <Phone className="text-secondary w-5 h-5" />
              <h3 className="font-bold">Directory Entries</h3>
            </div>
            <p className="text-4xl font-headline font-extrabold text-on-surface">1,240</p>
            <p className="text-sm text-secondary mt-2">Police & Court contacts</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
            <h3 className="font-headline font-bold">Contact Directory Management</h3>
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold">Add New Entry</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="p-4 text-xs font-bold uppercase text-secondary">Name</th>
                <th className="p-4 text-xs font-bold uppercase text-secondary">Type</th>
                <th className="p-4 text-xs font-bold uppercase text-secondary">Location</th>
                <th className="p-4 text-xs font-bold uppercase text-secondary">Status</th>
                <th className="p-4 text-xs font-bold uppercase text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-outline-variant/5 hover:bg-surface-container-lowest transition-colors">
                  <td className="p-4 font-bold">District Court Delhi</td>
                  <td className="p-4 text-sm">Court</td>
                  <td className="p-4 text-sm">New Delhi</td>
                  <td className="p-4">
                    <span className="bg-tertiary/10 text-tertiary px-2 py-1 rounded-full text-[10px] font-bold uppercase">Verified</span>
                  </td>
                  <td className="p-4">
                    <button className="text-primary text-sm font-bold">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const { state, toggleHighContrast, toggleVoice, setLanguage } = useAppContext();
  const { lang } = { lang: state.language };

  const fontSizeClass = {
    normal: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl'
  }[state.fontSize];

  return (
    <ErrorBoundary fallbackMessage="ऐप लोड नहीं हो पा रहा है। कृपया रिफ्रेश करें।">
      <OfflineBanner />
      <div className={`min-h-screen bg-background text-on-background font-body ${fontSizeClass} ${state.isReducedMotion ? 'motion-reduce' : ''}`}>
        <Routes>

          <Route path="/login" element={<LoginScreen />} />

          <Route
            path="/"
            element={
              <>
                <ErrorBoundary fallbackMessage="ऐप लोड नहीं हो पा रहा है। कृपया रिफ्रेश करें।">
                  <Dashboard lang={lang} />
                </ErrorBoundary>
                <BottomNav />
              </>
            }
          />


          <Route
            path="/scan"
            element={
              <ErrorBoundary fallbackMessage="दस्तावेज़ स्कैनर में समस्या। कृपया दोबारा कोशिश करें।">
                <Scanner lang={lang} />
              </ErrorBoundary>
            }
          />


          <Route
            path="/status"
            element={
              <ErrorBoundary fallbackMessage="केस स्थिति लोड नहीं हो सकी। CNR जांचें और दोबारा कोशिश करें।">
                <>
                  <CaseStatus lang={lang} />
                  <BottomNav />
                </>
              </ErrorBoundary>
            }
          />


          <Route
            path="/find"
            element={
              <>
                <ErrorBoundary fallbackMessage="कोर्ट खोजने में समस्या आई। कृपया पुनः प्रयास करें।">
                  <FindCourt lang={lang} />
                </ErrorBoundary>
                <BottomNav />
              </>
            }
          />

          <Route path="/admin" element={<AdminPanel />} />

          <Route path="/lawyers" element={<FindLawyer />} />

          <Route path="/lawyers/:id" element={<LawyerProfile />} />

          <Route path="/call/:consultationId" element={<VideoCall />} />

          <Route path="/payment/:consultationId" element={<PaymentPage />} />

          <Route
            path="/help"
            element={
              <ErrorBoundary fallbackMessage="AI सहायक अभी उपलब्ध नहीं है। कृपया कुछ देर बाद कोशिश करें।">
                <LegalHelp lang={state.language} />
              </ErrorBoundary>
            }
          />


          <Route
            path="/profile"
            element={
              <div className="pt-20 p-6 text-center">
                <ProfileSettings toggles={{ toggleHighContrast, toggleVoice, setLanguage }} />
              </div>
            }
          />
        </Routes>
      </div>
      <AccessibilityBar />
    </ErrorBoundary>
  );
}

const ProfileSettings = ({ toggles }: any) => {
  const { state } = useAppContext();
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-6">Accessibility</h2>
        <div className="space-y-4">
          <button
            onClick={toggles.toggleHighContrast}
            className="w-full flex items-center justify-between p-4 border rounded-xl"
          >
            <span>High Contrast</span>
            <span className={cn('w-10 h-5 rounded-full relative', state.isHighContrast ? 'bg-primary' : 'bg-gray-200')}>
              <span className={cn('absolute w-4 h-4 rounded-full top-0.5 transition-all', state.isHighContrast ? 'left-5 bg-white' : 'left-0.5 bg-gray-400')} />
            </span>
          </button>
          <button
            onClick={toggles.toggleVoice}
            className="w-full flex items-center justify-between p-4 border rounded-xl"
          >
            <span>Voice Guidance</span>
            <span className={cn('w-10 h-5 rounded-full relative', state.isVoiceEnabled ? 'bg-primary' : 'bg-gray-200')}>
              <span className={cn('absolute w-4 h-4 rounded-full top-0.5 transition-all', state.isVoiceEnabled ? 'left-5 bg-white' : 'left-0.5 bg-gray-400')} />
            </span>
          </button>
          <button
            onClick={() => toggles.setLanguage(state.language === 'en' ? 'hi' : 'en')}
            className="w-full flex items-center justify-between p-4 border rounded-xl"
          >
            <span>{state.language === 'en' ? 'हिन्दी' : 'English'}</span>
            <Languages className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

