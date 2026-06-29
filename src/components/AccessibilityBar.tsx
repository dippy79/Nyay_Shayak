import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Volume2, VolumeX, Moon, Sun, Eye, EyeOff,
  Type, ChevronUp, X, Languages
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

const AccessibilityBar = () => {
  const { state, toggleHighContrast, toggleVoice, toggleReducedMotion, toggleScreenReader, setFontSize, setLanguage } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  const fontClass = {
    normal: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl'
  }[state.fontSize];

  const fontSizePercentages = {
    normal: '100%',
    large: '125%',
    xlarge: '150%'
  };

  return (
    <div className="fixed bottom-24 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 bg-white rounded-3xl shadow-2xl border-2 border-gray-200 p-6 w-80"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-all"
              aria-label="Close accessibility menu"
            >
              <X size={20} className="text-gray-600" />
            </button>

            <h2 className="font-bold text-lg mb-6 pr-8 text-gray-900">Accessibility</h2>

            {/* Font Size */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Type size={16} />
                Font Size: {fontSizePercentages[state.fontSize]}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFontSize('normal')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    state.fontSize === 'normal'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={state.fontSize === 'normal'}
                  aria-label="Normal font size"
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-4 py-2 rounded-lg text-lg font-semibold transition-all ${
                    state.fontSize === 'large'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={state.fontSize === 'large'}
                  aria-label="Large font size"
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('xlarge')}
                  className={`px-4 py-2 rounded-lg text-xl font-semibold transition-all ${
                    state.fontSize === 'xlarge'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={state.fontSize === 'xlarge'}
                  aria-label="Extra large font size"
                >
                  A
                </button>
              </div>
            </div>

            {/* High Contrast */}
            <div className="mb-6">
              <button
                onClick={toggleHighContrast}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  state.isHighContrast
                    ? 'bg-blue-100 border-2 border-blue-600'
                    : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
                }`}
                aria-pressed={state.isHighContrast}
                aria-label="Toggle high contrast mode"
              >
                <span className="flex items-center gap-2 font-semibold text-gray-900">
                  {state.isHighContrast ? <Sun size={18} /> : <Moon size={18} />}
                  High Contrast
                </span>
                <div
                  className={`w-6 h-6 rounded-full transition-all ${
                    state.isHighContrast ? 'bg-blue-600' : 'bg-gray-400'
                  }`}
                />
              </button>
            </div>

            {/* Voice On/Off */}
            <div className="mb-6">
              <button
                onClick={toggleVoice}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  state.isVoiceEnabled
                    ? 'bg-blue-100 border-2 border-blue-600'
                    : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
                }`}
                aria-pressed={state.isVoiceEnabled}
                aria-label="Toggle voice guidance"
              >
                <span className="flex items-center gap-2 font-semibold text-gray-900">
                  {state.isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  Voice Guidance
                </span>
                <div
                  className={`w-6 h-6 rounded-full transition-all ${
                    state.isVoiceEnabled ? 'bg-blue-600' : 'bg-gray-400'
                  }`}
                />
              </button>
            </div>

            {/* Reduced Motion */}
            <div className="mb-6">
              <button
                onClick={toggleReducedMotion}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  state.isReducedMotion
                    ? 'bg-blue-100 border-2 border-blue-600'
                    : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
                }`}
                aria-pressed={state.isReducedMotion}
                aria-label="Toggle reduced motion"
              >
                <span className="flex items-center gap-2 font-semibold text-gray-900">
                  {state.isReducedMotion ? <Eye size={18} /> : <EyeOff size={18} />}
                  Reduce Motion
                </span>
                <div
                  className={`w-6 h-6 rounded-full transition-all ${
                    state.isReducedMotion ? 'bg-blue-600' : 'bg-gray-400'
                  }`}
                />
              </button>
            </div>

            {/* Screen Reader */}
            <div className="mb-6">
              <button
                onClick={toggleScreenReader}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  state.isScreenReader
                    ? 'bg-blue-100 border-2 border-blue-600'
                    : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
                }`}
                aria-pressed={state.isScreenReader}
                aria-label="Toggle screen reader mode"
              >
                <span className="flex items-center gap-2 font-semibold text-gray-900">
                  <EyeOff size={18} />
                  Screen Reader
                </span>
                <div
                  className={`w-6 h-6 rounded-full transition-all ${
                    state.isScreenReader ? 'bg-blue-600' : 'bg-gray-400'
                  }`}
                />
              </button>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Languages size={16} />
                Language
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    state.language === 'en'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={state.language === 'en'}
                  aria-label="English"
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('hi')}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    state.language === 'hi'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={state.language === 'hi'}
                  aria-label="Hindi"
                >
                  हिंदी
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
        aria-label={isOpen ? 'Close accessibility menu' : 'Open accessibility menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronUp size={24} />
        ) : (
          <Settings size={24} />
        )}
      </motion.button>
    </div>
  );
};

export default AccessibilityBar;
