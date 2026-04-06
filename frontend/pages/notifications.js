import { motion } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../components/layout/AppLayout';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Heart, MessageCircle, Star, Zap } from 'lucide-react';

const iconMap = {
  match:        { icon: Heart,          color: '#FF2D55', bg: 'rgba(255,45,85,0.15)' },
  message:      { icon: MessageCircle,  color: '#BF5AF2', bg: 'rgba(191,90,242,0.15)' },
  superlike:    { icon: Star,           color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  like:         { icon: Heart,          color: '#FF6CAE', bg: 'rgba(255,108,174,0.15)' },
  boost:        { icon: Zap,            color: '#FFD700', bg: 'rgba(255,215,0,0.15)' },
  system:       { icon: Bell,           color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' },
  profile_view: { icon: Bell,           color: '#6EE7B7', bg: 'rgba(110,231,183,0.15)' },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const handleNotifClick = (notif) => {
    if (notif.relatedMatch)      router.push(`/chat/${notif.relatedMatch}`);
    else if (notif.relatedUser)  router.push(`/profile/${notif.relatedUser._id || notif.relatedUser}`);
  };

  return (
    <>
      <Head><title>Activity — Spark</title></Head>

      <div className="min-h-screen" style={{ background: 'var(--darker)' }}>
        {/* Header */}
        <div className="px-5 pt-14 pb-4 flex justify-between items-center">
          <h1 className="font-display text-2xl font-bold text-white">
            Activity <span className="gradient-text">🔔</span>
          </h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-white/40 hover:text-white/60 transition-colors">
              Mark all read
            </button>
          )}
        </div>

        <div className="px-4 pb-6 flex flex-col gap-1">
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4 text-center"
            >
              <Bell size={48} className="text-white/10" />
              <div>
                <p className="text-white/50 font-medium">No activity yet</p>
                <p className="text-white/25 text-sm mt-1">Swipe to get the party started 🎉</p>
              </div>
            </motion.div>
          ) : (
            notifications.map((notif, idx) => {
              const cfg   = iconMap[notif.type] || iconMap.system;
              const Icon  = cfg.icon;
              const photo = notif.relatedUser?.photos?.[0]?.url;

              return (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNotifClick(notif)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 ${
                    !notif.isRead ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Avatar or icon */}
                  <div className="relative flex-shrink-0">
                    {photo ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: cfg.bg }}>
                        <Icon size={20} style={{ color: cfg.color }} />
                      </div>
                    )}
                    {photo && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: cfg.bg, border: '2px solid var(--darker)' }}>
                        <Icon size={10} style={{ color: cfg.color }} />
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!notif.isRead ? 'text-white' : 'text-white/60'}`}>
                      <span className="font-semibold">{notif.title}</span>
                    </p>
                    <p className="text-white/40 text-xs mt-0.5 truncate">{notif.body}</p>
                    <p className="text-white/20 text-[11px] mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.isRead && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full"
                      style={{ background: 'linear-gradient(135deg, #FF2D55, #BF5AF2)' }} />
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

NotificationsPage.getLayout = (page) => <AppLayout>{page}</AppLayout>;
