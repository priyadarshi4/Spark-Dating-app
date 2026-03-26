import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Flame, MessageCircle, User, Bell, Sparkles } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const tabs = [
  { href: '/discover',      icon: Flame,         label: 'Discover' },
  { href: '/matches',       icon: Sparkles,      label: 'Matches'  },
  { href: '/chat',          icon: MessageCircle, label: 'Chat'     },
  { href: '/notifications', icon: Bell,          label: 'Activity' },
  { href: '/profile',       icon: User,          label: 'Profile'  },
];

export default function BottomNav() {
  const router   = useRouter();
  const { unreadCount } = useNotifications();
  const { user } = useAuth();

  const isActive = (href) => router.pathname.startsWith(href);

  return (
    <nav className="tab-nav">
      {tabs.map(({ href, icon: Icon, label }) => {
        const active = isActive(href);
        const hasNotif = href === '/notifications' && unreadCount > 0;
        const hasMsg   = href === '/chat' && false; // wire to unread messages count

        return (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={`tab-item ${active ? 'active' : ''}`}
          >
            <div className="relative">
              {active ? (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 -m-2 rounded-2xl"
                  style={{ background: 'rgba(255,45,85,0.12)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              ) : null}

              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className="relative z-10 transition-all duration-200"
                fill={active && href === '/discover' ? 'currentColor' : 'none'}
              />

              {/* Notification badge */}
              {(hasNotif || hasMsg) && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #FF2D55, #BF5AF2)' }}
                >
                  {hasNotif ? (unreadCount > 9 ? '9+' : unreadCount) : ''}
                </motion.span>
              )}
            </div>

            <span className={`text-[10px] font-medium transition-all duration-200 ${active ? 'opacity-100' : 'opacity-0 h-0'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
