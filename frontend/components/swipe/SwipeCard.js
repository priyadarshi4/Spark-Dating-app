import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { MapPin, Briefcase, GraduationCap, Star, Zap, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SWIPE_THRESHOLD = 120;
const ROTATION_FACTOR = 0.08;

export default function SwipeCard({ profile, onSwipe, onExpand, isTop }) {
  const [photoIndex,  setPhotoIndex]  = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isDragging,  setIsDragging]  = useState(false);
  const constraintsRef = useRef(null);
  const controls       = useAnimation();

  const x        = useMotionValue(0);
  const y        = useMotionValue(0);
  const rotate   = useTransform(x, [-300, 0, 300], [-25, 0, 25]);
  const opacity  = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);

  // Overlay label opacities
  const likeOpacity  = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity  = useTransform(x, [-100, 0], [1, 0]);
  const superOpacity = useTransform(y, [-100, 0], [1, 0]);

  const photos = profile.photos?.length > 0 ? profile.photos : [{ url: '/placeholder.jpg' }];

  const triggerSwipe = async (direction) => {
    const targets = {
      right:  { x: 500,  y: 50,   rotate: 20 },
      left:   { x: -500, y: 50,   rotate: -20 },
      up:     { x: 0,    y: -600, rotate: 0 },
    };

    await controls.start({
      ...targets[direction],
      opacity: 0,
      transition: { duration: 0.35, ease: [0.43, 0.13, 0.23, 0.96] },
    });

    const actionMap = { right: 'like', left: 'pass', up: 'superlike' };
    onSwipe(profile._id, actionMap[direction]);
  };

  const handleDragEnd = async (_, info) => {
    setIsDragging(false);
    const { offset, velocity } = info;
    const swipeX = Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > 500;
    const swipeY = offset.y < -SWIPE_THRESHOLD || velocity.y < -500;

    if (swipeY) {
      await triggerSwipe('up');
    } else if (swipeX) {
      await triggerSwipe(offset.x > 0 ? 'right' : 'left');
    } else {
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  const nextPhoto  = (e) => { e.stopPropagation(); setPhotoIndex(i => Math.min(i + 1, photos.length - 1)); };
  const prevPhoto  = (e) => { e.stopPropagation(); setPhotoIndex(i => Math.max(i - 1, 0)); };

  const age  = profile.age || '';
  const dist = profile.distance ? `${Math.round(profile.distance)} km away` : '';

  return (
    <motion.div
      ref={constraintsRef}
      style={{ x, y, rotate, opacity, touchAction: 'none', zIndex: isTop ? 10 : 5 }}
      animate={controls}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: isTop ? 1.02 : 1 }}
      className="profile-card absolute inset-0 select-none"
    >
      {/* ── Photo ────────────────────────────────────────────── */}
      <div className="relative w-full h-full">
        <img
          src={photos[photoIndex]?.url || '/placeholder.jpg'}
          alt={profile.name}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Photo tap zones */}
        <div className="absolute inset-0 flex" onClick={(e) => { if (!isDragging) {} }}>
          <div className="w-1/3 h-full" onClick={prevPhoto} />
          <div className="w-1/3 h-full" onClick={() => setShowDetails(!showDetails)} />
          <div className="w-1/3 h-full" onClick={nextPhoto} />
        </div>

        {/* Photo indicators */}
        {photos.length > 1 && (
          <div className="absolute top-3 left-3 right-3 flex gap-1">
            {photos.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full flex-1 transition-all duration-200"
                style={{ background: i === photoIndex ? '#fff' : 'rgba(255,255,255,0.35)' }}
              />
            ))}
          </div>
        )}

        {/* ── Swipe labels ─────────────────────────────────── */}
        <motion.div className="swipe-label-like" style={{ opacity: likeOpacity }}>
          LIKE 💚
        </motion.div>
        <motion.div className="swipe-label-nope" style={{ opacity: nopeOpacity }}>
          NOPE ❌
        </motion.div>
        <motion.div className="swipe-label-super" style={{ opacity: superOpacity }}>
          SUPER ⭐
        </motion.div>

        {/* Online badge */}
        {profile.isOnline && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 glass rounded-full px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white text-xs font-medium">Online</span>
          </div>
        )}

        {/* Super like indicator */}
        {profile.isSuperLiked && (
          <div className="match-badge flex items-center gap-1">
            <Star size={10} fill="currentColor" /> Super Liked You
          </div>
        )}

        {/* ── Profile Info ──────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {/* Name, age, verified */}
          <div className="flex items-end justify-between mb-2">
            <div>
              <h2 className="text-white font-display text-3xl font-bold leading-tight">
                {profile.name}
                {age ? <span className="font-light ml-2">{age}</span> : null}
              </h2>
              {dist && (
                <div className="flex items-center gap-1 text-white/70 text-sm mt-0.5">
                  <MapPin size={12} />
                  <span>{dist}</span>
                </div>
              )}
            </div>
            {/* Info expand button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
              className="w-9 h-9 glass rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
            >
              <motion.span
                animate={{ rotate: showDetails ? 45 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-lg leading-none"
              >
                ℹ
              </motion.span>
            </button>
          </div>

          {/* Quick info pills */}
          {!showDetails && (
            <div className="flex flex-wrap gap-1.5">
              {profile.occupation && (
                <span className="glass rounded-full px-2.5 py-1 text-white/80 text-xs flex items-center gap-1">
                  <Briefcase size={10} />{profile.occupation}
                </span>
              )}
              {profile.education && (
                <span className="glass rounded-full px-2.5 py-1 text-white/80 text-xs flex items-center gap-1">
                  <GraduationCap size={10} />{profile.education}
                </span>
              )}
              {profile.relationshipGoal && (
                <span className="glass rounded-full px-2.5 py-1 text-white/80 text-xs flex items-center gap-1">
                  <Heart size={10} />{profile.relationshipGoal.replace('_', ' ')}
                </span>
              )}
            </div>
          )}

          {/* Expanded details */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                {profile.bio && (
                  <p className="text-white/80 text-sm leading-relaxed mb-3">{profile.bio}</p>
                )}
                {profile.interests?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.slice(0, 6).map((tag) => (
                      <span key={tag} className="interest-tag text-xs">{tag}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// Programmatic swipe trigger (exposed via ref)
export { SWIPE_THRESHOLD };
