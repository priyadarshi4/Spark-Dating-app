import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import { Camera, Edit2, Settings, LogOut, Crown, MapPin, Briefcase, GraduationCap, Ruler, Heart, Check, X, Plus } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { userAPI, mediaAPI } from '../services/api';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const INTERESTS = ['Music', 'Travel', 'Fitness', 'Cooking', 'Art', 'Gaming', 'Reading', 'Movies', 'Dance', 'Photography', 'Yoga', 'Hiking', 'Coffee', 'Wine', 'Dogs', 'Cats', 'Sports', 'Tech', 'Fashion', 'Food'];

function PhotoGrid({ photos, onUpload, onDelete, onSetMain }) {
  const fileRef = useRef(null);
  return (
    <div className="grid grid-cols-3 gap-2">
      {[...Array(9)].map((_, i) => {
        const photo = photos[i];
        return (
          <div key={i} className="relative aspect-square rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {photo ? (
              <>
                <img src={photo.url} className="w-full h-full object-cover" alt="" />
                {photo.isMain && (
                  <div className="absolute top-1 left-1 glass rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white">Main</div>
                )}
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <div className="absolute inset-0 flex items-center justify-center gap-2">
                    {!photo.isMain && (
                      <button onClick={() => onSetMain(photo._id)}
                        className="w-7 h-7 glass rounded-full flex items-center justify-center text-green-400">
                        <Check size={12} />
                      </button>
                    )}
                    <button onClick={() => onDelete(photo._id)}
                      className="w-7 h-7 glass rounded-full flex items-center justify-center text-red-400">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full h-full flex items-center justify-center text-white/20 hover:text-white/40 transition-colors">
                <Plus size={20} />
              </button>
            )}
          </div>
        );
      })}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({
    name: user?.name || '', bio: user?.bio || '',
    occupation: user?.occupation || '', education: user?.education || '',
    height: user?.height || '', relationshipGoal: user?.relationshipGoal || '',
    interests: user?.interests || [],
  });

  if (!user) return null;

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const toggleInterest = (tag) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(tag)
        ? f.interests.filter(i => i !== tag)
        : f.interests.length < 10 ? [...f.interests, tag] : f.interests,
    }));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await userAPI.updateProfile(form);
      updateUser(form);
      setEditing(false);
      toast.success('Profile updated! ✨');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      toast.loading('Uploading photo...');
      await mediaAPI.uploadPhoto(fd);
      await refreshUser();
      toast.dismiss();
      toast.success('Photo added! 📸');
    } catch {
      toast.dismiss();
      toast.error('Upload failed');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await mediaAPI.deletePhoto(photoId);
      await refreshUser();
      toast.success('Photo removed');
    } catch { toast.error('Failed to delete'); }
  };

  const handleSetMain = async (photoId) => {
    try {
      await mediaAPI.setMainPhoto(photoId);
      await refreshUser();
    } catch {}
  };

  const isPremium = user.premium?.isActive;

  return (
    <>
      <Head><title>My Profile — Spark</title></Head>
      <div className="min-h-screen pb-8" style={{ background: 'var(--darker)' }}>

        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-14 pb-4">
          <h1 className="font-display text-2xl font-bold gradient-text">My Profile</h1>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="btn-glass text-sm px-4 py-2">Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={saveProfile} disabled={saving}
                  className="btn-spark text-sm px-5 py-2">
                  {saving ? '...' : '✓ Save'}
                </motion.button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="w-9 h-9 glass rounded-full flex items-center justify-center text-white/60 hover:text-white">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => router.push('/settings')} className="w-9 h-9 glass rounded-full flex items-center justify-center text-white/60 hover:text-white">
                  <Settings size={15} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="px-5 flex flex-col gap-5">
          {/* Premium banner */}
          {!isPremium && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/premium')}
              className="w-full rounded-2xl p-4 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,149,0,0.1))', border: '1px solid rgba(255,215,0,0.3)' }}>
              <Crown size={20} className="text-yellow-400 flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-yellow-400 font-semibold text-sm">Upgrade to Gold</p>
                <p className="text-white/40 text-xs">Unlimited swipes, see who likes you</p>
              </div>
              <span className="text-yellow-400 text-xs font-bold">→</span>
            </motion.button>
          )}

          {/* Profile completeness */}
          {(() => {
            const fields = [user.bio, user.occupation, user.interests?.length, user.photos?.length, user.age, user.gender];
            const filled = fields.filter(Boolean).length;
            const pct    = Math.round((filled / fields.length) * 100);
            return pct < 100 && (
              <div className="glass-card p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white/70 text-sm font-medium">Profile strength</p>
                  <span className="gradient-text text-sm font-bold">{pct}%</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3, duration: 0.8 }}
                    className="h-2 rounded-full" style={{ background: 'linear-gradient(90deg, #FF2D55, #BF5AF2)' }} />
                </div>
              </div>
            );
          })()}

          {/* Photos */}
          <div className="glass-card p-4">
            <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-3">Photos</h2>
            <PhotoGrid photos={user.photos || []} onUpload={handlePhotoUpload} onDelete={handleDeletePhoto} onSetMain={handleSetMain} />
          </div>

          {/* Basic info */}
          <div className="glass-card p-4">
            <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-3">About Me</h2>
            {editing ? (
              <div className="flex flex-col gap-3">
                <input value={form.name} onChange={set('name')} placeholder="Name"
                  className="glass rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[rgba(255,45,85,0.4)]" />
                <textarea value={form.bio} onChange={set('bio')} placeholder="Your bio..." rows={3}
                  className="glass rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[rgba(255,45,85,0.4)] resize-none" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.occupation} onChange={set('occupation')} placeholder="Occupation"
                    className="glass rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[rgba(255,45,85,0.4)]" />
                  <input value={form.education} onChange={set('education')} placeholder="Education"
                    className="glass rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[rgba(255,45,85,0.4)]" />
                  <input value={form.height} onChange={set('height')} placeholder="Height (cm)" type="number"
                    className="glass rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[rgba(255,45,85,0.4)]" />
                  <select value={form.relationshipGoal} onChange={set('relationshipGoal')}
                    className="glass rounded-xl px-3 py-2.5 text-white text-sm outline-none appearance-none"
                    style={{ background: 'var(--glass)' }}>
                    <option value="" style={{ background: '#1C1C2E' }}>Goal</option>
                    {['relationship','casual','friendship','figuring_out','marriage'].map(g => (
                      <option key={g} value={g} style={{ background: '#1C1C2E' }}>{g.replace('_',' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-white text-xl font-bold font-display">{user.name}</h3>
                  <span className="text-white/50">{user.age}</span>
                  {isPremium && <span className="premium-badge"><Crown size={10} />Gold</span>}
                </div>
                {user.bio && <p className="text-white/60 text-sm leading-relaxed">{user.bio}</p>}
                <div className="flex flex-wrap gap-2 mt-1">
                  {user.occupation && <span className="glass rounded-full px-3 py-1 text-white/60 text-xs flex items-center gap-1"><Briefcase size={10} />{user.occupation}</span>}
                  {user.education  && <span className="glass rounded-full px-3 py-1 text-white/60 text-xs flex items-center gap-1"><GraduationCap size={10} />{user.education}</span>}
                  {user.height     && <span className="glass rounded-full px-3 py-1 text-white/60 text-xs flex items-center gap-1"><Ruler size={10} />{user.height} cm</span>}
                  {user.relationshipGoal && <span className="glass rounded-full px-3 py-1 text-white/60 text-xs flex items-center gap-1"><Heart size={10} />{user.relationshipGoal.replace('_',' ')}</span>}
                  {user.location?.city && <span className="glass rounded-full px-3 py-1 text-white/60 text-xs flex items-center gap-1"><MapPin size={10} />{user.location.city}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Interests */}
          <div className="glass-card p-4">
            <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-3">
              Interests {editing && <span className="text-white/30 font-normal normal-case tracking-normal text-xs ml-2">(pick up to 10)</span>}
            </h2>
            <div className="flex flex-wrap gap-2">
              {(editing ? INTERESTS : user.interests || []).map(tag => {
                const selected = form.interests.includes(tag);
                const shown    = !editing && user.interests?.includes(tag);
                if (!editing && !shown) return null;
                return (
                  <motion.button key={tag} whileTap={{ scale: 0.95 }}
                    onClick={() => editing && toggleInterest(tag)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                      (editing ? selected : true)
                        ? 'text-violet-300 border-violet-400/40'
                        : 'text-white/30 border-white/10'
                    } glass`}
                    style={(editing ? selected : true) ? { borderColor: 'rgba(191,90,242,0.4)', color: 'rgba(191,90,242,1)' } : {}}>
                    {tag}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Logout */}
          <button onClick={logout}
            className="w-full glass rounded-2xl px-4 py-3.5 flex items-center justify-center gap-2 text-red-400/70 hover:text-red-400 transition-colors">
            <LogOut size={16} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}

ProfilePage.getLayout = (page) => <AppLayout>{page}</AppLayout>;
