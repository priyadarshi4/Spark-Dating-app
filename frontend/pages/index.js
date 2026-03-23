import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import Head from 'next/head';

const floatVariants = {
  animate: (i) => ({
    y: [0, -16, 0],
    transition: { duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 },
  }),
};

const profiles = [
  { name: 'Sofia', age: 24, color: '#FF6CAE', emoji: '🌸' },
  { name: 'Alex',  age: 26, color: '#BF5AF2', emoji: '⚡' },
  { name: 'Mia',   age: 22, color: '#FF2D55', emoji: '💖' },
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.replace('/discover');
  }, [isAuthenticated, router]);

  return (
    <>
      <Head>
        <title>Spark — Where Hearts Collide</title>
      </Head>

      <div className="min-h-screen relative overflow-hidden flex flex-col"
        style={{ background: 'linear-gradient(180deg, #0F0F1A 0%, #1C1C2E 50%, #0F0F1A 100%)' }}>

        {/* Ambient glow blobs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-[120px] opacity-20"
          style={{ background: '#FF2D55' }} />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full blur-[120px] opacity-15"
          style={{ background: '#BF5AF2' }} />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full blur-[80px] opacity-10"
          style={{ background: '#FF6CAE' }} />

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex justify-between items-center px-6 pt-14 pb-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-3xl">💖</span>
            <span className="font-display text-2xl font-bold gradient-text">Spark</span>
          </div>
          <button
            onClick={() => router.push('/auth')}
            className="btn-glass text-sm px-5 py-2"
          >
            Sign in
          </button>
        </motion.header>

        {/* Main hero */}
        <div className="relative z-10 flex-1 flex flex-col items-center px-6 pt-8 pb-10">

          {/* Floating profile cards preview */}
          <div className="relative w-full h-72 mb-10">
            {profiles.map((p, i) => (
              <motion.div
                key={p.name}
                custom={i}
                variants={floatVariants}
                animate="animate"
                style={{
                  position: 'absolute',
                  left: `${15 + i * 28}%`,
                  top: i === 1 ? '0%' : '15%',
                  zIndex: i === 1 ? 3 : i,
                  transform: `rotate(${(i - 1) * 8}deg)`,
                }}
              >
                <div className="w-28 h-40 rounded-3xl overflow-hidden border-2"
                  style={{
                    borderColor: p.color + '60',
                    background: `linear-gradient(135deg, ${p.color}20, ${p.color}08)`,
                    backdropFilter: 'blur(12px)',
                    boxShadow: `0 8px 32px ${p.color}30`,
                  }}>
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
                      style={{ background: `${p.color}30` }}>
                      {p.emoji}
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold text-sm">{p.name}</p>
                      <p className="text-white/50 text-xs">{p.age}</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full"
                          style={{ background: j < 2 ? p.color : `${p.color}40` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Central glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-32 h-32 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(circle, #FF2D55 0%, transparent 70%)' }}
              />
            </div>
          </div>

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-center mb-10"
          >
            <h1 className="font-display text-5xl font-bold leading-tight text-white mb-3">
              Where{' '}
              <span className="gradient-text italic">hearts</span>
              <br />
              collide
            </h1>
            <p className="text-white/50 text-lg leading-relaxed max-w-xs mx-auto">
              Real connections. Genuine sparks.<br />
              Find the one who sets your world on fire.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-xs flex flex-col gap-3"
          >
            <button
              onClick={() => router.push('/auth?mode=register')}
              className="btn-spark w-full text-base py-4 flex items-center justify-center gap-2"
            >
              <span className="text-xl">💖</span> Create Your Spark
            </button>
            <button
              onClick={() => router.push(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`)}
              className="btn-glass w-full text-sm py-3.5 flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </motion.div>

          {/* Footer copy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-white/25 text-xs text-center mt-8"
          >
            By signing up, you agree to our Terms & Privacy Policy
          </motion.p>
        </div>
      </div>
    </>
  );
}
