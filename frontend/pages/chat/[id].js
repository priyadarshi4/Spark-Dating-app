import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import { ChevronLeft, Send, Image as ImageIcon, Smile, MoreVertical, Phone, Video } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4">
      <div className="w-8 h-8 rounded-full glass flex items-center justify-center text-xs">💭</div>
      <div className="bubble-received flex items-center gap-1.5 py-3 px-4">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

function MessageBubble({ msg, isOwn, showAvatar, otherUser }) {
  const time = format(new Date(msg.createdAt), 'HH:mm');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2 px-4 ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mb-1">
          {showAvatar ? (
            <img src={otherUser?.photos?.[0]?.url || '/placeholder.jpg'} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>
      )}

      <div className={`flex flex-col gap-0.5 max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {msg.replyTo && (
          <div className="glass rounded-xl px-3 py-1.5 mb-1 text-xs text-white/40 border-l-2 border-spark-rose/50 max-w-full truncate">
            Replied to message
          </div>
        )}
        {msg.type === 'image' && msg.mediaUrl ? (
          <div className={`rounded-[18px] overflow-hidden ${isOwn ? 'rounded-br-[4px]' : 'rounded-bl-[4px]'}`}>
            <img src={msg.mediaUrl} alt="Image" className="max-w-[200px] max-h-[200px] object-cover" />
          </div>
        ) : (
          <div className={isOwn ? 'bubble-sent' : 'bubble-received'}>
            {msg.isDeleted ? (
              <em className="text-white/40 text-sm">Message deleted</em>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
            )}
          </div>
        )}

        {/* Reactions */}
        {msg.reactions?.length > 0 && (
          <div className="flex gap-0.5 flex-wrap">
            {msg.reactions.map((r, i) => (
              <span key={i} className="text-sm glass rounded-full px-1.5 py-0.5">{r.emoji}</span>
            ))}
          </div>
        )}

        <span className="text-white/25 text-[10px] px-1">{time}</span>
      </div>
    </motion.div>
  );
}

function DateDivider({ date }) {
  const d = new Date(date);
  const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d');
  return (
    <div className="flex items-center gap-3 px-6 my-3">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <span className="text-white/25 text-xs">{label}</span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

export default function ChatRoom() {
  const router   = useRouter();
  const { id: matchId } = router.query;
  const { user } = useAuth();
  const { emit, on, isConnected } = useSocket();

  const [messages,   setMessages]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [input,      setInput]      = useState('');
  const [sending,    setSending]    = useState(false);
  const [match,      setMatch]      = useState(null);
  const [isTyping,   setIsTyping]   = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  const otherUser = match?.users?.find(u => u._id !== user?._id);

  useEffect(() => {
    if (!matchId) return;
    loadMessages();
    loadMatch();
    // Mark as read
    emit('message:read', { matchId });
  }, [matchId]);

  // Socket listeners
  useEffect(() => {
    if (!matchId) return;

    const unsubMsg = on('message:new', `chat-${matchId}`, (msg) => {
      if (msg.matchId === matchId) {
        setMessages(prev => [...prev, msg]);
        emit('message:read', { matchId });
        scrollToBottom();
      }
    });

    const unsubTypingStart = on('typing:start', `chat-${matchId}`, ({ userId }) => {
      if (userId !== user?._id) setIsTyping(true);
    });

    const unsubTypingStop = on('typing:stop', `chat-${matchId}`, ({ userId }) => {
      if (userId !== user?._id) setIsTyping(false);
    });

    return () => {
      unsubMsg?.(); unsubTypingStart?.(); unsubTypingStop?.();
    };
  }, [matchId, user?._id, on, emit]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data } = await chatAPI.getMessages(matchId, { page: 1, limit: 50 });
      setMessages(data.data);
      setTimeout(scrollToBottom, 100);
    } catch {}
    finally { setLoading(false); }
  };

  const loadMatch = async () => {
    try {
      const { data } = await (await import('../../services/api')).matchAPI.getMatch(matchId);
      setMatch(data.data);
    } catch {}
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    emit('typing:start', { matchId });
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => emit('typing:stop', { matchId }), 1500));
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setInput('');
    emit('typing:stop', { matchId });

    // Optimistic update
    const tempMsg = {
      _id: `temp_${Date.now()}`,
      matchId,
      sender: { _id: user._id, name: user.name, photos: user.photos },
      content,
      type: 'text',
      createdAt: new Date().toISOString(),
      readBy: [],
      reactions: [],
      isOptimistic: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    try {
      setSending(true);
      emit('message:send', { matchId, content, type: 'text' }, (response) => {
        if (response?.success) {
          setMessages(prev => prev.map(m => m._id === tempMsg._id ? response.message : m));
        } else {
          setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
          toast.error('Failed to send message');
        }
      });
    } catch (err) {
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const date = format(new Date(msg.createdAt), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <>
      <Head><title>{otherUser?.name || 'Chat'} — Spark</title></Head>

      <div className="flex flex-col h-screen" style={{ background: 'var(--darker)' }}>
        {/* Header */}
        <div className="glass border-b border-white/5 flex items-center gap-3 px-4 pt-14 pb-3 flex-shrink-0">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>

          {otherUser && (
            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => router.push(`/profile/${otherUser._id}`)}>
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <img src={otherUser.photos?.[0]?.url || '/placeholder.jpg'} className="w-full h-full object-cover" alt={otherUser.name} />
                {otherUser.isOnline && <div className="online-dot" />}
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm leading-tight">{otherUser.name}</h2>
                <p className="text-white/40 text-xs">
                  {otherUser.isOnline ? 'Active now' : `Active ${formatDistanceToNow(new Date(otherUser.lastActive), { addSuffix: true })}`}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button className="w-9 h-9 glass rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors">
              <Phone size={15} />
            </button>
            <button className="w-9 h-9 glass rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors">
              <Video size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4" style={{ scrollbarWidth: 'thin' }}>
          {loading ? (
            <div className="flex flex-col gap-3 px-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                  <div className={`skeleton h-10 rounded-2xl ${i % 3 === 0 ? 'w-48' : i % 3 === 1 ? 'w-32' : 'w-56'}`} />
                </div>
              ))}
            </div>
          ) : (
            <>
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center pt-16"
                >
                  <div className="text-5xl">💌</div>
                  <h3 className="text-white font-semibold">Say hello to {otherUser?.name}!</h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    {match?.sharedInterests?.length > 0
                      ? `You both like ${match.sharedInterests.slice(0, 2).join(' and ')} 💫`
                      : 'Break the ice with something fun!'}
                  </p>
                  {/* Ice breaker suggestions */}
                  {['👋 Hey! Your profile really caught my eye', '✨ What are you passionate about?', '🎵 What song is on repeat for you right now?'].map(s => (
                    <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="glass rounded-2xl px-4 py-2.5 text-sm text-white/70 hover:text-white hover:border-[rgba(255,45,85,0.3)] transition-all duration-200 text-left">
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}

              {Object.entries(grouped).map(([date, msgs]) => (
                <div key={date}>
                  <DateDivider date={msgs[0].createdAt} />
                  {msgs.map((msg, i) => {
                    const isOwn      = msg.sender._id === user._id || msg.sender === user._id;
                    const prev       = msgs[i - 1];
                    const showAvatar = !isOwn && (!prev || prev.sender._id !== msg.sender._id || prev.sender !== msg.sender);
                    return (
                      <div key={msg._id} className="mb-1">
                        <MessageBubble msg={msg} isOwn={isOwn} showAvatar={showAvatar} otherUser={otherUser} />
                      </div>
                    );
                  })}
                </div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                  <TypingIndicator />
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="glass border-t border-white/5 px-4 py-3 flex items-end gap-2 flex-shrink-0"
          style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
          <button className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors flex-shrink-0">
            <ImageIcon size={20} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors flex-shrink-0">
            <Smile size={20} />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              className="w-full glass rounded-[20px] px-4 py-2.5 text-white placeholder:text-white/30 text-sm outline-none resize-none transition-all duration-200 focus:border-[rgba(255,45,85,0.4)] max-h-24"
              style={{ lineHeight: '1.5' }}
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30"
            style={{
              background: input.trim() ? 'linear-gradient(135deg, #FF2D55, #BF5AF2)' : 'rgba(255,255,255,0.08)',
              boxShadow: input.trim() ? '0 4px 12px rgba(255,45,85,0.4)' : 'none',
            }}
          >
            <Send size={16} className="text-white" />
          </motion.button>
        </div>
      </div>
    </>
  );
}

ChatRoom.getLayout = (page) => <AppLayout>{page}</AppLayout>;
