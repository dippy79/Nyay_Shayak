import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Users, Camera, AlertCircle, User } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

type Tab = {
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  labelEn: string;
  labelHi: string;
};

const BottomNavNew = () => {
  const location = useLocation();
  const { state } = useAppContext();

  const tabs: Tab[] = [
    { path: '/', icon: Home, labelEn: 'Home', labelHi: 'होम' },
    { path: '/lawyers', icon: Users, labelEn: 'Lawyers', labelHi: 'वकील' },
    { path: '/scan', icon: Camera, labelEn: 'Scan', labelHi: 'स्कैन' },
    { path: '/status', icon: AlertCircle, labelEn: 'Status', labelHi: 'स्थिति' },
    { path: '/profile', icon: User, labelEn: 'Profile', labelHi: 'प्रोफाइल' },
  ];

  // अब labelKey सिर्फ 'labelEn' | 'labelHi' है — TypeScript खुश
  const labelKey: 'labelEn' | 'labelHi' = state.language === 'hi'? 'labelHi' : 'labelEn';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-30 safe-bottom"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex justify-around items-center h-20 max-w-6xl mx-auto px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          const label = tab[labelKey]; // अब guaranteed string

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center justify-center py-3 px-4 relative"
              aria-current={isActive? 'page' : undefined}
              aria-label={label}
            >
              <motion.div whileTap={{ scale: 0.9 }} className="relative">
                <Icon
                  size={24}
                  className={isActive? 'text-blue-600' : 'text-gray-600'}
                />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
              <span
                className={`text-xs mt-1 font-semibold transition-colors ${
                  isActive? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavNew;