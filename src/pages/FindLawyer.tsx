import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MapPin, Briefcase, Clock, Award, MessageSquare, Video,
  Search, Filter, X, ChevronRight, Loader2, AlertCircle, Zap
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

interface Lawyer {
  id: string;
  name: string;
  specializations: string[];
  city: string;
  rating: number;
  total_reviews: number;
  experience_years: number;
  consultation_fee_video: number;
  consultation_fee_chat: number;
  is_available: boolean;
  profile_photo_url?: string;
  bio?: string;
}

const specializations = [
  'Criminal Law', 'Family Law', 'Property', 'Labour',
  'Consumer', 'Cyber Law', 'Tax', 'Constitutional'
];

const FindLawyer = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const language = state.language;

  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  const translations = {
    en: {
      findLawyer: 'Find a Lawyer',
      searchPlaceholder: 'Search by name or specialization...',
      filterByCity: 'Filter by city',
      availableNow: 'Available Now',
      specialization: 'Specialization',
      experience: 'Experience',
      years: 'years',
      reviews: 'reviews',
      videoCall: 'Video Call',
      chat: 'Chat',
      connectNow: 'Connect Now',
      schedule: 'Schedule',
      noLawyers: 'No lawyers found. Try adjusting your filters.',
      loading: 'Loading lawyers...',
      error: 'Error loading lawyers',
      rating: 'Rating',
      fee: 'Fee',
    },
    hi: {
      findLawyer: 'वकील खोजें',
      searchPlaceholder: 'नाम या विशेषज्ञता से खोजें...',
      filterByCity: 'शहर के अनुसार फ़िल्टर करें',
      availableNow: 'अभी उपलब्ध',
      specialization: 'विशेषज्ञता',
      experience: 'अनुभव',
      years: 'वर्ष',
      reviews: 'समीक्षाएं',
      videoCall: 'वीडियो कॉल',
      chat: 'चैट',
      connectNow: 'अभी कनेक्ट करें',
      schedule: 'शेड्यूल करें',
      noLawyers: 'कोई वकील नहीं मिला। अपने फ़िल्टर को समायोजित करने का प्रयास करें।',
      loading: 'वकील लोड हो रहे हैं...',
      error: 'वकीलों को लोड करने में त्रुटि',
      rating: 'रेटिंग',
      fee: 'शुल्क',
    }
  };

  const t = translations[language];

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedCity) params.append('city', selectedCity);
        if (selectedSpec) params.append('specialization', selectedSpec);
        if (availableOnly) params.append('available', 'true');

        const response = await fetch(`/api/lawyers?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setLawyers(data.lawyers || []);
        setError('');
      } catch (err) {
        setError(t.error);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchLawyers, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCity, selectedSpec, availableOnly, t.error]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i: number) => (
          <Star
            key={i}
            size={16}
            className={i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
          />
        ))}
        <span className="text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t.findLawyer}</h1>
          <p className="text-gray-600">Professional legal consultation at your fingertips</p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 space-y-4"
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              aria-label="Search lawyers"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setAvailableOnly(!availableOnly)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                availableOnly
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
              aria-pressed={availableOnly}
              aria-label="Filter available now"
            >
              <Zap size={16} className="inline mr-2" />
              {t.availableNow}
            </button>

            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpec(selectedSpec === spec ? '' : spec)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedSpec === spec
                    ? 'bg-amber-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
                aria-pressed={selectedSpec === spec}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* City Filter */}
          <input
            type="text"
            placeholder={t.filterByCity}
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by city"
          />
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"
            role="alert"
          >
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        )}

        {/* Lawyers Grid */}
        <AnimatePresence>
          {!loading && lawyers.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
{lawyers.map((lawyer, idx: number) => (
                <motion.div
                  key={lawyer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all hover:-translate-y-2"
                >
                  {/* Availability Indicator */}
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        lawyer.is_available
                          ? 'bg-green-400 animate-pulse'
                          : 'bg-gray-300'
                      }`}
                      aria-label={lawyer.is_available ? 'Available' : 'Not available'}
                    />
                    <Award size={20} className="text-amber-500" />
                  </div>

                  {/* Lawyer Info */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{lawyer.name}</h3>
                  
                  {/* Rating */}
                  <div className="mb-3">
                    {renderStars(lawyer.rating)}
                    <p className="text-xs text-gray-500 mt-1">
                      {lawyer.total_reviews} {t.reviews}
                    </p>
                  </div>

                  {/* Specializations */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {lawyer.specializations.slice(0, 2).map((spec) => (
                        <span
                          key={spec}
                          className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{lawyer.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{lawyer.experience_years} {t.years}</span>
                    </div>
                  </div>

                  {/* Fees */}
                  <div className="mb-6 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-700">
                      <span className="flex items-center gap-1">
                        <Video size={14} /> {t.videoCall}
                      </span>
                      <span className="font-bold">₹{lawyer.consultation_fee_video}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={14} /> {t.chat}
                      </span>
                      <span className="font-bold">₹{lawyer.consultation_fee_chat}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate(`/payment/${lawyer.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                      aria-label={`Connect with ${lawyer.name}`}
                    >
                      <Zap size={16} />
                      {t.connectNow}
                    </button>
                    <button
                      onClick={() => navigate(`/lawyers/${lawyer.id}`)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                      aria-label={`View ${lawyer.name} profile`}
                    >
                      <ChevronRight size={16} />
                      {t.schedule}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!loading && lawyers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <Briefcase size={48} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">{t.noLawyers}</h3>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCity('');
                setSelectedSpec('');
                setAvailableOnly(false);
              }}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all"
              aria-label="Clear filters"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FindLawyer;
