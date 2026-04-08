import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ChevronRight, Camera, MapPin, Heart } from 'lucide-react';

const INTERESTS = [
  '🎵 Music', '✈️ Travel', '💪 Fitness', '🍳 Cooking', '🎨 Art',
  '🎮 Gaming', '📚 Reading', '🎬 Movies', '💃 Dance', '📸 Photography',
  '🧘 Yoga', '🥾 Hiking', '☕ Coffee', '🍷 Wine', '🐶 Dogs',
  '🐱 Cats', '⚽ Sports', '💻 Tech', '👗 Fashion', '🍕 Food',
  '🎭 Theater', '🎸 Guitar', '🌿 Nature', '✍️ Writing', '🎤 Singing',
];


const GOALS = [
  { id: 'relationship', emoji: '💍', label: 'Long-term relationship' },
  { id: 'casual',       emoji: '😊', label: 'Something casual'      },
  { id: 'friendship',   emoji: '🤝', label: 'New friendships'       },
  { id: 'figuring_out', emoji: '🤔', label: 'Still figuring it out' },
  { id: 'marriage',     emoji: '💒', label: 'Marriage'              },
];

const steps = [
  { id: 'goal',      title: 'What are you here for?',      subtitle: "It's good to know from the start"             },
  { id: 'interests', title: 'What are you into?',          subtitle: 'Pick up to 10 things you love'                },
  { id: 'bio',       title: 'Tell your story',             subtitle: 'Give people a reason to swipe right'          },
  { id: 'done',      title: "You're all set! 🎉",          subtitle: 'Your profile is ready — time to find sparks'  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [step,       setStep]       = useState(0);
  const [saving,     setSaving]     = useState(false);
  const [data,       setData]       = useState({
    relationshipGoal: '',
    interests:        [],
    bio:              '',
  });

  const current = steps[step];
  const total   = steps.length;

  const toggleInterest = (tag) => {
    setData(prev => ({
      ...prev,
      interests: prev.interests.includes(tag)
        ? prev.interests.filter(i => i !== tag)
        : prev.interests.length < 10 ? [...prev.interests, tag] : prev.interests,
    }));
  };

  const next = async () => {
    if (step < total - 1) {
      setStep(s => s + 1);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await userAPI.updateProfile(data);
      updateUser(data);
      toast.success("Let's go find your spark! 💖");
      router.push('/discover');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!data.relationshipGoal;
    if (step === 1) return data.interests.length >= 1;
    return true;
  };

  return (
    <>
      <Head><title>Set Up Your Profile — Spark</title></Head>

      <div className="min-h-screen flex flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0F0F1A 0%, #1C1C2E 100%)' }}>

        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-15 pointer-events-none"
          style={{ background: '#BF5AF2', transform: 'translate(30%, -30%)' }} />

        {/* Progress bar */}
        <div className="px-5 pt-14 pb-4 flex-shrink-0">
          <div className="flex gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: i <= step ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #FF2D55, #BF5AF2)' }}
                />
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="font-display text-2xl font-bold text-white leading-tight">
                {current.title}
              </h1>
              <p className="text-white/40 text-sm mt-1">{current.subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step content */}
        <div className="flex-1 px-5 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 0: Goal */}
            {step === 0 && (
              <motion.div
                key="step-goal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-3 pt-2"
              >
                {GOALS.map(goal => (
                  <motion.button
                    key={goal.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setData(d => ({ ...d, relationshipGoal: goal.id }))}
                    className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 text-left"
                    style={{
                      background: data.relationshipGoal === goal.id
                        ? 'rgba(255,45,85,0.12)'
                        : 'rgba(255,255,255,0.04)',
                      border: data.relationshipGoal === goal.id
                        ? '2px solid rgba(255,45,85,0.4)'
                        : '2px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span className="text-2xl">{goal.emoji}</span>
                    <span className={`text-sm font-medium ${
                      data.relationshipGoal === goal.id ? 'text-white' : 'text-white/60'
                    }`}>{goal.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Step 1: Interests */}
            {step === 1 && (
              <motion.div
                key="step-interests"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="pt-2"
              >
                <p className="text-white/30 text-xs mb-3">{data.interests.length}/10 selected</p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(tag => {
                    const sel = data.interests.includes(tag);
                    return (
                      <motion.button
                        key={tag}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => toggleInterest(tag)}
                        className="rounded-full px-4 py-2 text-sm font-medium transition-all duration-200"
                        style={{
                          background: sel ? 'rgba(191,90,242,0.2)' : 'rgba(255,255,255,0.05)',
                          border: sel ? '1.5px solid rgba(191,90,242,0.6)' : '1.5px solid rgba(255,255,255,0.08)',
                          color: sel ? 'rgba(191,90,242,1)' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {tag}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Bio */}
            {step === 2 && (
              <motion.div
                key="step-bio"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="pt-2"
              >
                <textarea
                  value={data.bio}
                  onChange={e => setData(d => ({ ...d, bio: e.target.value.slice(0, 500) }))}
                  placeholder="Write something that captures who you are... Be honest, be fun, be you! ✨"
                  rows={5}
                  className="w-full glass rounded-2xl px-4 py-4 text-white placeholder:text-white/25 text-sm leading-relaxed outline-none resize-none focus:border-[rgba(255,45,85,0.4)] transition-all"
                />
                <div className="flex justify-between mt-2 text-white/25 text-xs">
                  <span>💡 Tip: mention your passions and what makes you unique</span>
                  <span>{data.bio.length}/500</span>
                </div>

                {/* Bio prompts */}
                <p className="text-white/30 text-xs mt-4 mb-2 font-medium">Need inspiration?</p>
                {[
                  "I'm happiest when I'm...",
                  "My perfect Sunday looks like...",
                  "Looking for someone who...",
                ].map(prompt => (
                  <button key={prompt} onClick={() => setData(d => ({ ...d, bio: d.bio + (d.bio ? ' ' : '') + prompt }))}
                    className="glass rounded-xl px-3 py-2 text-xs text-white/40 hover:text-white/60 transition-colors mr-2 mb-2">
                    {prompt}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
              <motion.div
                key="step-done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center pt-12 gap-6 text-center"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-7xl"
                >
                  💖
                </motion.div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-white mb-2">
                    Welcome to Spark, {user?.name?.split(' ')[0]}!
                  </h2>
                  <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                    Your profile is looking great. Now let's find you some amazing connections.
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs text-left">
                  {[
                    { icon: '💫', text: 'Swipe right to like someone' },
                    { icon: '⭐', text: 'Super Like to stand out' },
                    { icon: '💬', text: 'Chat when you match' },
                  ].map(tip => (
                    <div key={tip.text} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                      <span className="text-xl">{tip.icon}</span>
                      <span className="text-white/60 text-sm">{tip.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="px-5 py-6 flex-shrink-0" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
          {step < total - 1 ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={next}
              disabled={!canNext()}
              className="btn-spark w-full py-4 text-base disabled:opacity-40 flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={18} />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={finish}
              disabled={saving}
              className="btn-spark w-full py-4 text-base flex items-center justify-center gap-2"
            >
              {saving ? '⏳ Setting up...' : '🔥 Start Discovering'}
            </motion.button>
          )}
          {step > 0 && step < total - 1 && (
            <button onClick={() => setStep(s => s - 1)} className="w-full text-center text-white/25 text-sm mt-3 hover:text-white/40 transition-colors">
              Back
            </button>
          )}
        </div>
      </div>
    </>
  );
}
