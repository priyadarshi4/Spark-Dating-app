import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../components/layout/AppLayout';
import { userAPI, swipeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, MapPin, Briefcase, GraduationCap, Ruler, Heart, MessageCircle, Flag, X, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function ViewProfilePage() {
  const router        = useRouter();
  const { id }        = router.query;
  const { user }      = useAuth();
  const [profile,     setProfile]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [photoIndex,  setPhotoIndex]  = useState(0);
  const [swiping,     setSwiping]     = useState(false);

  useEffect(() => {
    if (!id) return;
    userAPI.getUserById(id)
      .then(r => setProfile(r.data.data))
      .catch(() => toast.error('Profile not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (action) => {
    setSwiping(true);
    try {
      await swipeAPI.swipe(id, action);
      toast.success(action === 'like' ? '❤️ Liked!' : action === 'superlike' ? '⭐ Super liked!' : '👋 Passed');
      router.back();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSwiping(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--darker)' }}>
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-4xl">💖</motion.div>
    </div>
  );

  if (!profile) return null;

  const photos = profile.photos?.length ? profile.photos : [{ url: '/placeholder.jpg' }];
  const isMatch = user?.matches?.some(m => m._id === id || m === id);

  return (
    <>
      <Head><title>{profile.name} — Spark</title></Head>

      <div className="min-h-screen flex flex-col" style={{ background: 'var(--darker)' }}>
        {/* Photo section */}
        <div className="relative w-full" style={{ height: '65vh', minHeight: 400 }}>
          <img src={photos[photoIndex]?.url} alt={profile.name}
            className="w-full h-full object-cover" />

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A] via-transparent to-transparent" />

          {/* Photo indicators */}
          {photos.length > 1 && (
            <div className="absolute top-16 left-4 right-4 flex gap-1">
              {photos.map((_, i) => (
                <button key={i} onClick={() => setPhotoIndex(i)}
                  className="flex-1 h-1 rounded-full transition-all duration-200"
                  style={{ background: i === photoIndex ? 'white' : 'rgba(255,255,255,0.3)' }} />
              ))}
            </div>
          )}

          {/* Nav buttons */}
          <button onClick={() => router.back()}
            className="absolute top-14 left-4 w-10 h-10 glass rounded-full flex items-center justify-center text-white/70">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => userAPI.reportUser(id).then(() => toast('User reported'))}
            className="absolute top-14 right-4 w-10 h-10 glass rounded-full flex items-center justify-center text-white/50">
            <Flag size={15} />
          </button>

          {/* Online / active */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 glass rounded-full px-3 py-1.5">
            <div className={`w-2 h-2 rounded-full ${profile.isOnline ? 'bg-green-400' : 'bg-white/20'}`} />
            <span className="text-white/70 text-xs">
              {profile.isOnline ? 'Online now' : `Active ${formatDistanceToNow(new Date(profile.lastActive), { addSuffix: true })}`}
            </span>
          </div>
        </div>

        {/* Info section */}
        <div className="flex-1 px-5 pt-4 pb-24 overflow-y-auto">
          {/* Name, age */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="font-display text-3xl font-bold text-white leading-tight">
                {profile.name}
                {profile.age && <span className="font-light ml-2 text-white/60">{profile.age}</span>}
              </h1>
              {profile.gender && <p className="text-white/40 text-sm mt-0.5 capitalize">{profile.gender}{profile.pronouns ? ` · ${profile.pronouns}` : ''}</p>}
            </div>
          </div>

          {/* Quick info chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {profile.occupation       && <span className="glass rounded-full px-3 py-1.5 text-white/60 text-xs flex items-center gap-1.5"><Briefcase size={11} />{profile.occupation}</span>}
            {profile.education        && <span className="glass rounded-full px-3 py-1.5 text-white/60 text-xs flex items-center gap-1.5"><GraduationCap size={11} />{profile.education}</span>}
            {profile.height           && <span className="glass rounded-full px-3 py-1.5 text-white/60 text-xs flex items-center gap-1.5"><Ruler size={11} />{profile.height} cm</span>}
            {profile.relationshipGoal && <span className="glass rounded-full px-3 py-1.5 text-white/60 text-xs flex items-center gap-1.5"><Heart size={11} />{profile.relationshipGoal.replace('_', ' ')}</span>}
            {profile.distance         && <span className="glass rounded-full px-3 py-1.5 text-white/60 text-xs flex items-center gap-1.5"><MapPin size={11} />{Math.round(profile.distance)} km</span>}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="glass-card p-4 mb-4">
              <p className="text-white/70 text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Interests */}
          {profile.interests?.length > 0 && (
            <div className="glass-card p-4 mb-4">
              <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(tag => (
                  <span key={tag} className="interest-tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="fixed bottom-0 left-0 right-0 px-5 py-4 glass border-t border-white/5"
          style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
          {isMatch ? (
            <button onClick={() => router.push(`/chat`)}
              className="btn-spark w-full py-4 text-base flex items-center justify-center gap-2">
              <MessageCircle size={18} /> Message {profile.name}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleAction('pass')} disabled={swiping}
                className="swipe-btn-pass swipe-btn">
                <X size={26} strokeWidth={3} />
              </motion.button>
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleAction('like')} disabled={swiping}
                className="swipe-btn-like swipe-btn">
                <Heart size={30} fill="currentColor" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleAction('superlike')} disabled={swiping}
                className="swipe-btn-superlike swipe-btn">
                <Star size={20} fill="currentColor" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

ViewProfilePage.getLayout = (page) => <AppLayout>{page}</AppLayout>;
