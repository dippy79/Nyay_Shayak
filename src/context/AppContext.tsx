import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Volume2, Hand, Languages, Contrast } from 'lucide-react';

interface SignLangDict {
  [key: string]: string;
}

interface AppState {
  isHighContrast: boolean;
  isVoiceEnabled: boolean;
  language: 'en' | 'hi';
  signLanguageTerm: string | null;
  voices: SpeechSynthesisVoice[];
}

type AppAction = 
  | { type: 'TOGGLE_HIGH_CONTRAST' }
  | { type: 'TOGGLE_VOICE' }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'hi' }
  | { type: 'SET_SIGN_TERM'; payload: string | null }
  | { type: 'SET_VOICES'; payload: SpeechSynthesisVoice[] };

const signLangDictionary: SignLangDict = {
  'bail': 'जमानत',
  'summons': 'समन',
  'warrant': 'वारंट',
  'challan': 'चालान',
  'court': 'कोर्ट',
  'judge': 'न्यायाधीश',
  'hearing': 'सुनवाई',
  'lawyer': 'वकील',
  'notice': 'नोटिस',
  'case': 'मुकदमा',
  'petition': 'याचिका',
  'order': 'आदेश',
  'appeal': 'अपील',
  'arrest': 'गिरफ्तारी',
  'police': 'पुलिस',
  'district': 'जिला',
  'high court': 'उच्च न्यायालय',
  'supreme court': 'सर्वोच्च न्यायालय',
  'legal aid': 'कानूनी सहायता',
  'affidavit': 'शपथ पत्र',
  'verdict': 'निर्णय',
  'adjourned': 'स्थगित'
};

const initialState: AppState = {
  isHighContrast: false,
  isVoiceEnabled: false,
  language: 'en',
  signLanguageTerm: null,
  voices: []
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'TOGGLE_HIGH_CONTRAST':
      return { ...state, isHighContrast: !state.isHighContrast };
    case 'TOGGLE_VOICE':
      return { ...state, isVoiceEnabled: !state.isVoiceEnabled };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_SIGN_TERM':
      return { ...state, signLanguageTerm: action.payload };
    case 'SET_VOICES':
      return { ...state, voices: action.payload };
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  toggleHighContrast: () => void;
  toggleVoice: () => void;
  setLanguage: (lang: 'en' | 'hi') => void;
  setSignTerm: (term: string | null) => void;
  speakText: (text: string, lang?: 'en' | 'hi') => void;
  detectLegalTerm: (text: string) => string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const toggleHighContrast = useCallback(() => dispatch({ type: 'TOGGLE_HIGH_CONTRAST' }), []);
  const toggleVoice = useCallback(() => dispatch({ type: 'TOGGLE_VOICE' }), []);
  const setLanguage = useCallback((lang: 'en' | 'hi') => dispatch({ type: 'SET_LANGUAGE', payload: lang }), []);
  const setSignTerm = useCallback((term: string | null) => dispatch({ type: 'SET_SIGN_TERM', payload: term }), []);

  useEffect(() => {
    const loadVoices = () => {
      const hiVoices = speechSynthesis.getVoices().filter(v => v.lang.includes('hi-IN'));
      const enVoices = speechSynthesis.getVoices().filter(v => v.lang.includes('en-IN'));
      const voices = [...hiVoices, ...enVoices];
      dispatch({ type: 'SET_VOICES', payload: voices });
    };

    if (speechSynthesis.getVoices().length > 0) {
      loadVoices();
    } else {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speakText = useCallback((text: string, lang: 'en' | 'hi' = state.language) => {
    if (!state.isVoiceEnabled || !('speechSynthesis' in window)) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    const voices = state.voices;
    if (lang === 'hi' && voices.some(v => v.lang.includes('hi-IN'))) {
      utterance.voice = voices.find(v => v.lang.includes('hi-IN')) || voices[0];
    } else {
      utterance.voice = voices.find(v => v.lang.includes('en-IN')) || voices[0];
    }

    speechSynthesis.speak(utterance);
  }, [state.isVoiceEnabled, state.language, state.voices]);

  const detectLegalTerm = useCallback((text: string): string | null => {
    const lowerText = text.toLowerCase();
    for (const [term, hindi] of Object.entries(signLangDictionary)) {
      if (lowerText.includes(term)) {
        return hindi;
      }
    }
    return null;
  }, []);

  const value = {
    state,
    dispatch,
    toggleHighContrast,
    toggleVoice,
    setLanguage,
    setSignTerm,
    speakText,
    detectLegalTerm
  };

  return (
    <AppContext.Provider value={value}>
      <div className={cn(
        'transition-all duration-300',
        state.isHighContrast && 'contrast-[200%] invert brightness-150'
      )}>
        {children}
        {state.signLanguageTerm && (
          <SignLanguageOverlay 
            term={state.signLanguageTerm} 
            onClose={() => setSignTerm(null)}
            lang={state.language}
          />
        )}
      </div>
    </AppContext.Provider>
  );
};

interface SignLanguageOverlayProps {
  term: string;
  onClose: () => void;
  lang: 'en' | 'hi';
}

const SignLanguageOverlay: React.FC<SignLanguageOverlayProps> = ({ term, onClose, lang }) => (
  <div className="fixed inset-0 z-[1000] bg-black/90 flex flex-col items-center justify-center p-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
    <button 
      onClick={onClose} 
      className="absolute top-8 right-8 text-white p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all"
      aria-label="Close sign language"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
    <div className="w-64 h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center mb-8 border-4 border-white/30 shadow-2xl">
      {/* Placeholder for sign language video/GIF - replace with actual asset */}
      <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
        <Hand className="w-16 h-16 text-primary opacity-80" strokeWidth={1} />
      </div>
    </div>
    <h3 className="text-3xl font-bold text-white mb-4 text-center drop-shadow-lg px-4">
      {term}
    </h3>
    <p className="text-white/70 text-lg text-center max-w-md leading-relaxed">
      {lang === 'hi' ? 'कानूनी शब्द के लिए सांकेतिक भाषा प्रदर्शन।' : 'Sign language representation for legal term'}
    </p>
  </div>
);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export default AppContext;

