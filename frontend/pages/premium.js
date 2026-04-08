import { useState } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../components/layout/AppLayout';
import { premiumAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Check, Crown, Zap, Star, Eye, RotateCcw, Heart, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const plans = [
  {
    id: 'gold',
    name: 'Gold',
    price: '₹499',
    period: '/month',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FF9500 100%)',
    shadow: '0 8px 32px rgba(255,215,0,0.3)',
    features: [
      { icon: Heart,      text: 'Unlimited Likes'         },
      { icon: Eye,        text: 'See Who Liked You'       },
      { icon: RotateCcw,  text: '5 Rewinds per day'       },
      { icon: Star,       text: '5 Super Likes per day'   },
      { icon: Zap,        text: '1 Boost per month'       },
    ],
    popular: false,
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: '₹899',
    period: '/month',
    gradient: 'linear-gradient(135deg, #BF5AF2 0%, #FF2D55 100%)',
    shadow: '0 8px 32px rgba(191,90,242,0.4)',
    features: [
      { icon: Heart,      text: 'Unlimited Likes'              },
      { icon: Eye,        text: 'See Who Liked You'            },
      { icon: RotateCcw,  text: 'Unlimited Rewinds'           },
      { icon: Star,       text: 'Unlimited Super Likes'        },
      { icon: Zap,        text: '5 Boosts per month'          },
      { icon: Crown,      text: 'Priority in Discovery Feed'  },
      { icon: Eye,        text: 'See Read Receipts'           },
    ],
    popular: true,
  },
];

export default function PremiumPage() {
  const router  = useRouter();
  const { user, refreshUser } = useAuth();
  const [selected, setSelected] = useState('platinum');
  const [loading,  setLoading]  = useState(false);

  const isPremium = user?.premium?.isActive;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data } = await premiumAPI.checkout(selected);
      if (data.url) window.location.href = data.url;
      else {
        // Dev mode: just show success
        toast.success(`Welcome to Spark ${selected.charAt(0).toUpperCase() + selected.slice(1)}! 💎`);
        await refreshUser();
        router.push('/discover');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Go Premium — Spark</title></Head>

      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0F0F1A 0%, #1C1C2E 100%)' }}>
        {/* Ambient blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ background: '#BF5AF2' }} />

        {/* Back */}
        <button onClick={() => router.back()}
          className="absolute top-14 left-5 z-10 w-10 h-10 glass rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <ChevronLeft size={18} />
        </button>

        <div className="px-5 pt-20 pb-10 relative z-10">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="text-5xl mb-3">💎</div>
            <h1 className="font-display text-3xl font-bold text-white">
              Unlock your <span className="gradient-text">full potential</span>
            </h1>
            <p className="text-white/40 text-sm mt-2 leading-relaxed">
              Get more matches, more swipes, and more connections
            </p>
          </motion.div>

          {/* Plan cards */}
          <div className="flex flex-col gap-4 mb-8">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(plan.id)}
                className="relative cursor-pointer"
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full text-white text-xs font-bold"
                    style={{ background: plan.gradient }}>
                    ✨ Most Popular
                  </div>
                )}

                <div
                  className="rounded-2xl p-5 transition-all duration-300"
                  style={{
                    background: selected === plan.id
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.03)',
                    border: selected === plan.id
                      ? '2px solid rgba(191,90,242,0.5)'
                      : '2px solid rgba(255,255,255,0.06)',
                    boxShadow: selected === plan.id ? plan.shadow : 'none',
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{ background: plan.gradient }}>
                        <Crown size={18} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold">{plan.name}</h3>
                        <p className="text-white/40 text-xs">per month</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold text-2xl">{plan.price}</span>
                      <p className="text-white/30 text-xs">{plan.period}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {plan.features.map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <Check size={11} className="text-green-400" />
                        </div>
                        <span className="text-white/70 text-sm">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleUpgrade}
            disabled={loading || isPremium}
            className="btn-spark w-full py-4 text-base disabled:opacity-50"
          >
            {loading ? '⏳ Processing...' : isPremium ? '✅ Already Premium' : `🚀 Get ${selected.charAt(0).toUpperCase() + selected.slice(1)} — ${plans.find(p => p.id === selected)?.price}/mo`}
          </motion.button>

          <p className="text-white/20 text-xs text-center mt-4">
            Cancel anytime • Secure payment • No hidden fees
          </p>
        </div>
      </div>
    </>
  );
}

PremiumPage.getLayout = (page) => <AppLayout>{page}</AppLayout>;
