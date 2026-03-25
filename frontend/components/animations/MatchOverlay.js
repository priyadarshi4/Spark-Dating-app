import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MessageCircle, X } from 'lucide-react';
import { useRouter } from 'next/router';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

export default function MatchOverlay({ match, currentUser, onClose }) {
  const router = useRouter();
  const [windowSize, setWindowSize] = useState({ width: 400, height: 800 });
  const [showConfetti, setShowConfetti] = useState(true);

  const otherUser = match?.otherUser;

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!match || !otherUser) return null;

  const handleMessage = () => {
    onClose();
    router.push(`/chat/${match.matchId}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at center, rgba(255,45,85,0.3) 0%, rgba(15,15,26,0.95) 70%)' }}
      >
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            colors={['#FF2D55', '#BF5AF2', '#FF6CAE', '#FFD700', '#FF9500']}
            numberOfPieces={200}
            recycle={false}
          />
        )}

        <div className="relative flex flex-col items-center px-8 text-center max-w-sm w-full">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-0 right-0 w-9 h-9 glass rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          {/* Match text */}
          <motion.div
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="mb-6"
          >
            <p className="text-white/60 text-sm uppercase tracking-widest font-medium mb-2">It's a Match!</p>
            <h1 className="font-display text-5xl font-bold gradient-text">💖</h1>
            <p className="text-white/70 text-sm mt-3 leading-relaxed">
              You and <span className="text-white font-semibold">{otherUser.name}</span> liked each other
            </p>
            {match.sharedInterests?.length > 0 && (
              <p className="text-white/50 text-xs mt-1">
                {match.sharedInterests.length} shared interests ✨
              </p>
            )}
          </motion.div>

          {/* Avatar pair */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="flex items-center gap-0 mb-10"
          >
            {/* Current user */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#FF2D55] shadow-spark">
                <img
                  src={currentUser?.photos?.[0]?.url || '/placeholder.jpg'}
                  alt={currentUser?.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Heart in middle */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
              className="z-10 -mx-4 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, #FF2D55, #BF5AF2)', boxShadow: '0 0 20px rgba(255,45,85,0.6)' }}
            >
              💖
            </motion.div>

            {/* Other user */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#BF5AF2] shadow-violet">
                <img
                  src={otherUser?.photos?.[0]?.url || '/placeholder.jpg'}
                  alt={otherUser?.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </motion.div>

          {/* Compatibility bar */}
          {match.compatibilityScore > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full glass rounded-2xl p-4 mb-6"
            >
              <div className="flex justify-between text-xs text-white/50 mb-2">
                <span>Compatibility</span>
                <span className="gradient-text font-bold">{match.compatibilityScore}%</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${match.compatibilityScore}%` }}
                  transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                  className="h-2 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #FF2D55, #BF5AF2)' }}
                />
              </div>
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full flex flex-col gap-3"
          >
            <button
              onClick={handleMessage}
              className="btn-spark w-full text-base flex items-center justify-center gap-2 py-4"
            >
              <MessageCircle size={18} />
              Send a Message
            </button>
            <button
              onClick={onClose}
              className="btn-glass w-full text-sm py-3"
            >
              Keep Swiping
            </button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
