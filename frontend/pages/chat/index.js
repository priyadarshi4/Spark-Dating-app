import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../components/layout/AppLayout';
import { matchAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Search } from 'lucide-react';

export default function ChatIndex() {
  const router        = useRouter();
  const { user }      = useAuth();
  const { on }        = useSocket();
  const [matches,     setMatches]  = useState([]);
  const [loading,     setLoading]  = useState(true);
  const [query,       setQuery]    = useState('');

  
  useEffect(() => {
    matchAPI.getMatches()
      .then(r => setMatches(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  // Update last message in list on new socket message
  useEffect(() => {
    const unsub = on('message:new', 'chat-index', (msg) => {
      setMatches(prev => prev.map(m =>
        m._id === msg.matchId
          ? { ...m, lastMessage: { content: msg.content, sender: msg.sender._id, sentAt: msg.createdAt, type: msg.type } }
          : m
      ).sort((a, b) => new Date(b.lastMessage?.sentAt || b.createdAt) - new Date(a.lastMessage?.sentAt || a.createdAt)));
    });
    return unsub;
  }, [on]);

  const filtered = matches.filter(m => {
    const other = m.users?.find(u => u._id !== user?._id);
    return !query || other?.name?.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <>
      <Head><title>Messages — Spark</title></Head>

      <div className="min-h-screen flex flex-col" style={{ background: 'var(--darker)' }}>
        {/* Header */}
        <div className="px-5 pt-14 pb-3 flex-shrink-0">
          <h1 className="font-display text-2xl font-bold text-white mb-4">
            Messages <span className="gradient-text">✨</span>
          </h1>
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full glass rounded-2xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 text-sm outline-none focus:border-[rgba(255,45,85,0.4)] transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-3 pt-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="skeleton w-14 h-14 rounded-full flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="skeleton h-3.5 w-28 rounded-lg" />
                    <div className="skeleton h-3 w-44 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-64 gap-4 text-center"
            >
              <MessageCircle size={48} className="text-white/10" />
              <div>
                <p className="text-white/50 font-medium">No conversations yet</p>
                <p className="text-white/25 text-sm mt-1">Go swipe and make some matches! 💖</p>
              </div>
              <button onClick={() => router.push('/discover')} className="btn-spark px-6 py-2.5 text-sm">
                Start Swiping
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-1 pt-2">
              {filtered.map((match, idx) => {
                const other   = match.users?.find(u => u._id !== user?._id);
                const lastMsg = match.lastMessage;
                const unread  = match.unread?.[user?._id] || 0;
                const time    = lastMsg?.sentAt
                  ? formatDistanceToNow(new Date(lastMsg.sentAt), { addSuffix: false })
                  : '';

                return (
                  <motion.div
                    key={match._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/chat/${match._id}`)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-white/[0.03] active:bg-white/[0.06]"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden"
                        style={{ border: unread > 0 ? '2px solid #FF2D55' : '2px solid transparent' }}>
                        <img
                          src={other?.photos?.[0]?.url || '/placeholder.jpg'}
                          alt={other?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {other?.isOnline && <div className="online-dot" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className={`text-sm truncate ${unread > 0 ? 'text-white font-semibold' : 'text-white/80 font-medium'}`}>
                          {other?.name || 'Unknown'}
                        </h3>
                        <span className="text-white/25 text-[11px] flex-shrink-0 ml-2">{time}</span>
                      </div>
                      <p className={`text-sm truncate ${unread > 0 ? 'text-white/70' : 'text-white/35'}`}>
                        {lastMsg
                          ? `${lastMsg.sender === user?._id ? 'You: ' : ''}${lastMsg.type === 'image' ? '📷 Photo' : lastMsg.content || ''}`
                          : '💌 New match — say hello!'}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {unread > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #FF2D55, #BF5AF2)' }}
                      >
                        {unread > 9 ? '9+' : unread}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

ChatIndex.getLayout = (page) => <AppLayout>{page}</AppLayout>;
