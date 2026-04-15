import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import { RotateCcw, X, Star, Heart, Zap, SlidersHorizontal } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import SwipeCard from '../components/swipe/SwipeCard';
import MatchOverlay from '../components/animations/MatchOverlay';
import FilterSheet from '../components/swipe/FilterSheet';
import { swipeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const CARD_STACK_SIZE = 5;

export default function DiscoverPage() {
  const { user, refreshUser } = useAuth();
  const { on }                = useSocket();

  const [profiles,       setProfiles]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [page,           setPage]           = useState(1);
  const [hasMore,        setHasMore]        = useState(true);
  const [match,          setMatch]          = useState(null);
  const [swipesLeft,     setSwipesLeft]     = useState(50);
  const [filterOpen,     setFilterOpen]     = useState(false);
  const [filters,        setFilters]        = useState({});
  const [lastAction,     setLastAction]     = useState(null);
  const [cardExiting,    setCardExiting]    = useState(null); // 'left' | 'right' | 'up'
  const topCardRef = useRef(null);

  // Load discovery feed
  const loadFeed = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const p = reset ? 1 : page;
      const { data } = await swipeAPI.getFeed({ page: p, limit: 10, ...filters });
      setProfiles(prev => reset ? data.data : [...prev, ...data.data]);
      setHasMore(data.hasMore);
      if (!reset) setPage(p + 1);
    } catch (err) {
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadFeed(true);
  }, [filters]);

  // Auto-load more when stack is low
  useEffect(() => {
    if (profiles.length <= 2 && hasMore && !loading) {
      loadFeed();
    }
  }, [profiles.length]);

  // Listen for match events from socket
  useEffect(() => {
    const unsub = on('match:new', 'discover', (data) => {
      setMatch(data);
    });
    return unsub;
  }, [on]);

  const handleSwipe = useCallback(async (profileId, action) => {
    setProfiles(prev => prev.filter(p => p._id !== profileId));
    setLastAction({ profileId, action });

    try {
      const { data } = await swipeAPI.swipe(profileId, action);
      if (data.swipesRemaining !== undefined && data.swipesRemaining !== Infinity) {
        setSwipesLeft(data.swipesRemaining);
      }
      if (data.match?.matched) {
        const profile = profiles.find(p => p._id === profileId);
        setMatch({ ...data.match, otherUser: profile });
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.response?.data?.upgradeRequired) {
        toast.error('Daily swipe limit reached! Upgrade to Premium for unlimited swipes 💎', { duration: 4000 });
      } else {
        toast.error(msg || 'Swipe failed');
      }
      // Restore profile on failure
      // (in production, could re-add the profile)
    }
  }, [profiles]);

  const handleRewind = async () => {
    if (!lastAction) return toast('Nothing to rewind', { icon: '⏪' });
    try {
      await swipeAPI.rewind();
      toast.success('Rewound last swipe ⏪');
      setLastAction(null);
      loadFeed(true);
    } catch (err) {
      if (err.response?.data?.upgradeRequired) {
        toast.error('Premium required for rewinds 💎');
      }
    }
  };

  // Button-triggered swipes
  const triggerSwipe = (direction) => {
    if (profiles.length === 0) return;
    // The top card's animation is driven by the SwipeCard component's internal controls
    // We emit a custom event the card listens to
    const event = new CustomEvent('spark:swipe', { detail: { direction } });
    window.dispatchEvent(event);
  };

  const topProfile  = profiles[0];
  const nextProfile = profiles[1];

  return (
    <>
      <Head><title>Discover — Spark</title></Head>

      <div className="min-h-screen flex flex-col" style={{ background: 'var(--darker)' }}>
        {/* Header */}
        <header className="relative z-10 flex justify-between items-center px-5 pt-14 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💖</span>
            <span className="font-display text-xl font-bold gradient-text">spark</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Swipes remaining indicator */}
            {swipesLeft <= 10 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="glass rounded-full px-3 py-1 text-xs text-white/60"
              >
                {swipesLeft} left
              </motion.div>
            )}
            <button
              onClick={() => setFilterOpen(true)}
              className="w-10 h-10 glass rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </header>

        {/* Card stack */}
        <div className="relative flex-1 flex flex-col items-center px-4 pb-2">
          <div className="relative w-full max-w-sm h-[68vh] min-h-[450px]">

            {/* Empty state */}
            {!loading && profiles.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center glass-card p-8 text-center gap-4"
              >
                <div className="text-6xl">🌟</div>
                <h3 className="font-display text-2xl font-bold text-white">You've seen everyone!</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Expand your distance or age range to discover more people
                </p>
                <button onClick={() => loadFeed(true)} className="btn-spark px-8 py-3">
                  Refresh Feed
                </button>
                <button onClick={() => setFilterOpen(true)} className="btn-glass px-6 py-2.5 text-sm">
                  Change Filters
                </button>
              </motion.div>
            )}

            {/* Loading skeleton */}
            {loading && profiles.length === 0 && (
              <div className="absolute inset-0 rounded-[24px] skeleton" />
            )}

            {/* Background cards (for depth effect) */}
            {nextProfile && (
              <div
                className="absolute inset-0 rounded-[24px] overflow-hidden"
                style={{ transform: 'scale(0.95) translateY(12px)', zIndex: 1, filter: 'brightness(0.6)' }}
              >
                <img src={nextProfile.photos?.[0]?.url || '/placeholder.jpg'} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0" style={{ background: 'rgba(15,15,26,0.4)' }} />
              </div>
            )}

            {/* Third card hint */}
            {profiles[2] && (
              <div
                className="absolute inset-0 rounded-[24px] overflow-hidden"
                style={{ transform: 'scale(0.90) translateY(24px)', zIndex: 0, filter: 'brightness(0.4)' }}
              >
                <img src={profiles[2].photos?.[0]?.url || '/placeholder.jpg'} className="w-full h-full object-cover" alt="" />
              </div>
            )}

            {/* Top card */}
            {topProfile && (
              <SwipeCard
                key={topProfile._id}
                profile={topProfile}
                onSwipe={handleSwipe}
                isTop={true}
              />
            )}
          </div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 mt-4 mb-2"
          >
            {/* Rewind */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleRewind}
              className="swipe-btn-rewind swipe-btn"
              title="Rewind"
            >
              <RotateCcw size={16} />
            </motion.button>

            {/* Pass / Nope */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => triggerSwipe('left')}
              className="swipe-btn-pass swipe-btn"
              disabled={!topProfile}
              title="Pass"
            >
              <X size={26} strokeWidth={3} />
            </motion.button>

            {/* Like */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => triggerSwipe('right')}
              className="swipe-btn-like swipe-btn"
              disabled={!topProfile}
              title="Like"
            >
              <Heart size={30} fill="currentColor" />
            </motion.button>

            {/* Super Like */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => triggerSwipe('up')}
              className="swipe-btn-superlike swipe-btn"
              disabled={!topProfile}
              title="Super Like"
            >
              <Star size={20} fill="currentColor" />
            </motion.button>

            {/* Boost */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => toast('Boost requires Premium 💎', { icon: '⚡' })}
              className="swipe-btn w-12 h-12 rounded-full border border-yellow-400/40"
              style={{ background: 'rgba(255,215,0,0.08)', color: '#FFD700' }}
              title="Boost"
            >
              <Zap size={16} fill="currentColor" />
            </motion.button>
          </motion.div>
        </div>

        {/* Match overlay */}
        <AnimatePresence>
          {match && (
            <MatchOverlay
              match={match}
              currentUser={user}
              onClose={() => setMatch(null)}
            />
          )}
        </AnimatePresence>

        {/* Filter sheet */}
        <AnimatePresence>
          {filterOpen && (
            <FilterSheet
              filters={filters}
              onApply={(f) => { setFilters(f); setFilterOpen(false); }}
              onClose={() => setFilterOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

DiscoverPage.getLayout = (page) => <AppLayout>{page}</AppLayout>;
