// pages/settings.js
import { useState } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ChevronLeft, Moon, Sun, Bell, Shield, Trash2, Lock, HelpCircle, FileText, ChevronRight, MapPin } from 'lucide-react';

function SettingRow({ icon: Icon, label, sublabel, action, destructive, toggle, value, onToggle }) {
  return (
    <motion.div whileTap={{ scale: 0.98 }}
      onClick={action}
      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-white/[0.03] ${destructive ? '' : ''}`}>
      <div className="w-9 h-9 glass rounded-xl flex items-center justify-center flex-shrink-0"
        style={destructive ? { background: 'rgba(255,59,48,0.15)' } : {}}>
        <Icon size={16} className={destructive ? 'text-red-400' : 'text-white/50'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${destructive ? 'text-red-400' : 'text-white/80'}`}>{label}</p>
        {sublabel && <p className="text-white/30 text-xs mt-0.5">{sublabel}</p>}
      </div>
      {toggle ? (
        <button
          onClick={e => { e.stopPropagation(); onToggle(); }}
          className="relative w-10 h-6 rounded-full transition-all duration-300 flex-shrink-0"
          style={{ background: value ? 'linear-gradient(135deg, #FF2D55, #BF5AF2)' : 'rgba(255,255,255,0.1)' }}
        >
          <motion.div animate={{ x: value ? 16 : 2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow" />
        </button>
      ) : (
        !destructive && <ChevronRight size={14} className="text-white/20 flex-shrink-0" />
      )}
    </motion.div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <p className="text-white/30 text-xs font-semibold uppercase tracking-wider px-5 mb-1">{title}</p>
      <div className="glass-card mx-4 overflow-hidden divide-y divide-white/[0.04]">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router  = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [showMe,        setShowMe]        = useState(user?.preferences?.showMe ?? true);
  const [deleting,      setDeleting]      = useState(false);

  const toggleShowMe = async () => {
    const val = !showMe;
    setShowMe(val);
    await userAPI.updatePreferences({ showMe: val }).catch(() => setShowMe(!val));
    toast.success(val ? 'Profile visible in discovery' : 'Profile hidden from discovery');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your account? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await userAPI.deleteAccount();
      await logout();
      toast.success('Account deleted');
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Head><title>Settings — Spark</title></Head>
      <div className="min-h-screen pb-8" style={{ background: 'var(--darker)' }}>
        <div className="flex items-center gap-3 px-5 pt-14 pb-5">
          <button onClick={() => router.back()} className="w-9 h-9 glass rounded-full flex items-center justify-center text-white/50 hover:text-white">
            <ChevronLeft size={18} />
          </button>
          <h1 className="font-display text-2xl font-bold text-white">Settings</h1>
        </div>

        <Section title="Appearance">
          <SettingRow icon={isDark ? Moon : Sun} label={isDark ? 'Dark Mode' : 'Light Mode'} sublabel="Switch app theme"
            toggle value={isDark} onToggle={toggleTheme} />
        </Section>

        <Section title="Discovery">
          <SettingRow icon={MapPin} label="Show Me in Discovery" sublabel="Let others discover your profile"
            toggle value={showMe} onToggle={toggleShowMe} />
          <SettingRow icon={Shield} label="Discovery Preferences" sublabel="Age, distance & gender"
            action={() => router.push('/preferences')} />
        </Section>

        <Section title="Notifications">
          <SettingRow icon={Bell} label="Push Notifications" sublabel="Matches, messages & likes"
            toggle value={notifications} onToggle={() => setNotifications(v => !v)} />
        </Section>

        <Section title="Account">
          <SettingRow icon={Lock}    label="Change Password"   action={() => router.push('/forgot-password')} />
          <SettingRow icon={Shield}  label="Privacy & Safety"  action={() => router.push('/privacy')} />
          <SettingRow icon={HelpCircle} label="Help & Support" action={() => router.push('/help')} />
          <SettingRow icon={FileText}   label="Terms & Privacy" action={() => router.push('/terms')} />
        </Section>

        <Section title="Danger Zone">
          <SettingRow icon={Trash2} label="Delete Account" sublabel="Permanently remove your account & data"
            destructive action={handleDeleteAccount} />
        </Section>

        <p className="text-white/15 text-xs text-center mt-4">Spark v1.0.0 — Made with 💖</p>
      </div>
    </>
  );
}


SettingsPage.getLayout = (page) => <AppLayout>{page}</AppLayout>;
