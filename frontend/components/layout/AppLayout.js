import { motion } from 'framer-motion';
import BottomNav from './BottomNav';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in:      { opacity: 1, y: 0 },
  out:     { opacity: 0, y: -12 },
};

const pageTransition = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1],
  duration: 0.3,
};

export default function AppLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) return <SplashScreen />;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--darker)' }}>
      <motion.main
        variants={pageVariants}
        initial="initial"
        animate="in"
        exit="out"
        transition={pageTransition}
        className="safe-bottom"
      >
        {children}
      </motion.main>
      <BottomNav />
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0F0F1A 0%, #1C1C2E 100%)' }}>
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-6xl mb-4"
      >
        💖
      </motion.div>
      <h1 className="font-display text-3xl font-bold gradient-text">Spark</h1>
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="mt-6 w-8 h-0.5 rounded-full"
        style={{ background: 'linear-gradient(90deg, #FF2D55, #BF5AF2)' }}
      />
    </div>
  );
}
