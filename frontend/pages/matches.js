// pages/matches.js
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../components/layout/AppLayout';
import { swipeAPI, matchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function MatchesPage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const [matches, setMatches]   = useState([]);
  const [likers,  setLikers]    = useState([]);
  const [loading, setLoading]   = useState(true);
  const isPremium = user?.premium?.isActive;

  useEffect(() => {
    Promise.all([
      matchAPI.getMatches().then(r => setMatches(r.data.data)),
      swipeAPI.whoLikedMe().then(r => setLikers(r.data.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const newMatches = matches.filter(m => !m.lastMessage?.content);
  const chats      = matches.filter(m => !!m.lastMessage?.content);

  return (
    <>
      <Head><title>Matches — Spark</title></Head>
      <div className="min-h-screen px-4 pt-14 pb-6" style={{ background: 'var(--darker)' }}>
        <h1 className="font-display text-2xl font-bold text-white mb-5">
          Matches <span className="gradient-text">& Likes</span>
        </h1>

        {/* Who liked you */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider">
              Liked You  <span className="text-white/40">({likers.length})</span>
            </h2>
            {!isPremium && (
              <button onClick={() => router.push('/premium')} className="premium-badge text-xs">
                💎 See All
              </button>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {loading ? [...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-20 h-24 skeleton rounded-2xl" />
            )) : likers.map((liker) => (
              <motion.div key={liker._id} whileTap={{ scale: 0.95 }}
                onClick={() => isPremium ? router.push(`/profile/${liker._id}`) : router.push('/premium')}
                className="flex-shrink-0 relative cursor-pointer">
                <div className="w-20 h-24 rounded-2xl overflow-hidden"
                  style={{ border: '2px solid rgba(255,45,85,0.4)' }}>
                  {liker.isBlurred ? (
                    <div className="w-full h-full glass flex items-center justify-center">
                      <Lock size={20} className="text-white/40" />
                    </div>
                  ) : (
                    <img src={liker.photos?.[0]?.url || '/placeholder.jpg'} className="w-full h-full object-cover" alt="" />
                  )}
                </div>
                {!isPremium && (
                  <div className="absolute inset-0 rounded-2xl" style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.5)' }}>
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                      <Lock size={14} className="text-white/60" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* New matches */}
        {newMatches.length > 0 && (
          <section className="mb-6">
            <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-3">New Matches</h2>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {newMatches.map(match => {
                const other = match.users.find(u => u._id !== user?._id);
                return (
                  <motion.div key={match._id} whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(`/chat/${match._id}`)}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer">
                    <div className="relative w-18 h-18">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#FF2D55] shadow-spark">
                        <img src={other?.photos?.[0]?.url || '/placeholder.jpg'} className="w-full h-full object-cover" alt={other?.name} />
                      </div>
                      {other?.isOnline && <div className="online-dot w-3.5 h-3.5" />}
                    </div>
                    <p className="text-white/80 text-xs font-medium truncate w-16 text-center">{other?.name}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Message threads */}
        <section>
          <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-3">Messages</h2>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-14 h-14 rounded-full flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-3 w-40 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="glass-card p-8 text-center flex flex-col items-center gap-3">
              <span className="text-4xl">💬</span>
              <p className="text-white/50 text-sm">No messages yet. Go match someone! 💖</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {chats.map(match => {
                const other   = match.users.find(u => u._id !== user?._id);
                const unread  = match.unread?.[user?._id] || 0;
                const lastMsg = match.lastMessage;
                return (
                  <motion.div key={match._id} whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/chat/${match._id}`)}
                    className="glass-card flex items-center gap-3 p-3 cursor-pointer">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden">
                        <img src={other?.photos?.[0]?.url || '/placeholder.jpg'} className="w-full h-full object-cover" alt={other?.name} />
                      </div>
                      {other?.isOnline && <div className="online-dot" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h3 className="text-white font-semibold text-sm">{other?.name}</h3>
                        <span className="text-white/30 text-xs flex-shrink-0">
                          {lastMsg?.sentAt ? formatDistanceToNow(new Date(lastMsg.sentAt), { addSuffix: false }) : ''}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${unread > 0 ? 'text-white/80 font-medium' : 'text-white/40'}`}>
                        {lastMsg?.sender === user?._id ? 'You: ' : ''}{lastMsg?.content || '💌 New match!'}
                      </p>
                    </div>
                    {unread > 0 && (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #FF2D55, #BF5AF2)' }}>
                        {unread}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

MatchesPage.getLayout = (page) => <AppLayout>{page}</AppLayout>;
