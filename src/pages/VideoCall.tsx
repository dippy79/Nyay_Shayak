import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, Phone, MessageSquare, Star,
  Clock, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

interface DailyIframeType {
  createFrame: (container: HTMLElement, options: any) => Promise<any>;
}

const VideoCall = () => {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  const { state } = useAppContext();
  const language = state.language;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<any>(null);

  const translations = {
    en: {
      preCall: 'Pre-Call Check',
      startVideoCall: 'Start Video Call',
      cameraCheck: 'Camera Check',
      microphoneCheck: 'Microphone Check',
      callActive: 'Call Active',
      duration: 'Duration',
      endCall: 'End Call',
      rateConsultation: 'Rate this Consultation',
      tellUsMore: 'Tell us more...',
      submit: 'Submit Rating',
      loading: 'Loading call...',
      error: 'Error loading call',
      callEnded: 'Call Ended',
      thankYou: 'Thank you for using Legis',
      goHome: 'Go Home',
    },
    hi: {
      preCall: 'कॉल पूर्व जांच',
      startVideoCall: 'वीडियो कॉल शुरू करें',
      cameraCheck: 'कैमरा जांच',
      microphoneCheck: 'माइक्रोफोन जांच',
      callActive: 'कॉल सक्रिय',
      duration: 'अवधि',
      endCall: 'कॉल समाप्त करें',
      rateConsultation: 'इस परामर्श को रेट करें',
      tellUsMore: 'हमें और बताएं...',
      submit: 'रेटिंग सबमिट करें',
      loading: 'कॉल लोड हो रहा है...',
      error: 'कॉल लोड करने में त्रुटि',
      callEnded: 'कॉल समाप्त हुआ',
      thankYou: 'Legis का उपयोग करने के लिए धन्यवाद',
      goHome: 'होम जाएं',
    }
  };

  const t = translations[language];

  useEffect(() => {
    const initializeCall = async () => {
      if (!consultationId) {
        setError(t.error);
        return;
      }

      try {
        setLoading(true);
        // Create room via API
        const response = await fetch('/api/video/create-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consultation_id: consultationId })
        });

        if (!response.ok) throw new Error('Failed to create room');
        const data = await response.json();

        // Load Daily.co script
        const script = document.createElement('script');
        script.src = 'https://cdn.daily.co/daily-js.js';
        script.onload = async () => {
          const DailyIframe = (window as any).DailyIframe;
          if (containerRef.current && data.room_url) {
            try {
              callFrameRef.current = await DailyIframe.createFrame({
                iframeStyle: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                  borderRadius: '20px'
                }
              });
              await callFrameRef.current.join({ url: data.room_url });
              setCallActive(true);
            } catch (err) {
              console.error('Daily.co error:', err);
              setError(t.error);
            }
          }
        };
        document.body.appendChild(script);
        setLoading(false);
      } catch (err) {
        setError(t.error);
        setLoading(false);
      }
    };

    initializeCall();
  }, [consultationId, t.error]);

  useEffect(() => {
    if (!callActive) return;
    const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [callActive]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    try {
      if (callFrameRef.current) {
        await callFrameRef.current.leave();
      }
      setCallActive(false);
      setShowRating(true);
    } catch (err) {
      console.error('Error ending call:', err);
    }
  };

  const handleSubmitRating = async () => {
    try {
      // Rating submitted - can be logged
      console.log('Rating submitted:', { consultationId, rating, comment });
      navigate('/');
    } catch (err) {
      console.error('Error submitting rating:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-white"
        >
          <Loader2 className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-lg">{t.loading}</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-white"
        >
          <AlertCircle className="mx-auto mb-4" size={48} />
          <p className="text-lg mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100"
          >
            {t.goHome}
          </button>
        </motion.div>
      </div>
    );
  }

  if (showRating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
        >
          <CheckCircle2 className="mx-auto text-green-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-center mb-6">{t.rateConsultation}</h2>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  size={32}
                  className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                />
              </button>
            ))}
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.tellUsMore}
            className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-green-500 mb-6 h-24"
            aria-label="Comment"
          />

          {/* Submit */}
          <button
            onClick={handleSubmitRating}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all"
            aria-label="Submit rating"
          >
            {t.submit}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">{t.thankYou}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Call Container */}
      <div
        ref={containerRef}
        className="w-full h-screen relative rounded-3xl overflow-hidden"
        aria-label="Video call frame"
      />

      {/* Call Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-3xl shadow-2xl p-4 flex gap-4"
      >
        {/* Timer */}
        <div className="flex items-center gap-2 pr-4 border-r border-gray-700 text-white">
          <Clock size={20} />
          <span className="font-mono text-lg">{formatTime(callDuration)}</span>
        </div>

        {/* Controls */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-full transition-all ${
            isMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          aria-pressed={isMuted}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={() => setIsCameraOff(!isCameraOff)}
          className={`p-4 rounded-full transition-all ${
            isCameraOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          aria-pressed={isCameraOff}
          aria-label={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        <button
          onClick={() => {}}
          className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-all"
          aria-label="Open chat"
        >
          <MessageSquare size={20} />
        </button>

        {/* End Call */}
        <button
          onClick={handleEndCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all ml-4"
          aria-label="End call"
        >
          <Phone size={20} />
        </button>
      </motion.div>
    </div>
  );
};

export default VideoCall;
