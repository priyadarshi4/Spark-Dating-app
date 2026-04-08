import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { Eye, EyeOff, Mail, Lock, User, Calendar, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Head from 'next/head';

const Input = ({ icon: Icon, error, ...props }) => (
  <div className="relative">
    {Icon && (
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
        <Icon size={16} />
      </div>
    )}
    <input
      {...props}
      className={`w-full glass rounded-2xl py-3.5 text-white placeholder:text-white/30 text-sm outline-none transition-all duration-200
        focus:border-[rgba(255,45,85,0.5)] focus:shadow-[0_0_0_3px_rgba(255,45,85,0.1)]
        ${Icon ? 'pl-11 pr-4' : 'px-4'}
        ${error ? 'border-red-500/50' : ''}`}
    />
    {error && <p className="mt-1 text-red-400 text-xs pl-1">{error}</p>}
  </div>
);

export default function AuthPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, handleOAuthCallback } = useAuth();

  const [mode,     setMode]     = useState('login'); // 'login' | 'register'
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form,     setForm]     = useState({ name: '', email: '', password: '', age: '', gender: '' });
  const [errors,   setErrors]   = useState({});

  // Handle Google OAuth callback
  useEffect(() => {
    const { token, refresh } = router.query;
    if (token) handleOAuthCallback(token, refresh);
  }, [router.query]);

  useEffect(() => {
    if (router.query.mode) setMode(router.query.mode);
  }, [router.query.mode]);

  useEffect(() => {
    if (isAuthenticated) router.replace('/discover');
  }, [isAuthenticated]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    if (mode === 'register') {
      if (!form.name) e.name = 'Name required';
      if (!form.age || form.age < 18) e.age = 'Must be 18+';
      if (!form.gender) e.gender = 'Select gender';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back! 💖');
        router.push('/discover');
      } else {
        await register({ name: form.name, email: form.email, password: form.password, age: parseInt(form.age), gender: form.gender });
        toast.success('Account created! Welcome to Spark 🎉');
        router.push('/onboarding');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>{mode === 'login' ? 'Sign In' : 'Join Spark'} — Spark</title></Head>

      <div className="min-h-screen relative flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0F0F1A 0%, #1C1C2E 100%)' }}>

        {/* Ambient blobs */}
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full blur-[100px] opacity-20"
          style={{ background: '#FF2D55', transform: 'translate(-40%, -40%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-[100px] opacity-15"
          style={{ background: '#BF5AF2', transform: 'translate(40%, 40%)' }} />

        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-14 left-5 z-10 w-10 h-10 glass rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center pt-20 pb-6"
        >
          <span className="text-5xl">💖</span>
          <h1 className="font-display text-3xl font-bold gradient-text mt-2">
            {mode === 'login' ? 'Welcome back' : 'Join Spark'}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {mode === 'login' ? 'Sign in to find your spark' : 'Start your story today'}
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
          className="relative z-10 mx-4 glass-card p-6"
        >
          {/* Mode toggle */}
          <div className="flex glass rounded-2xl p-1 mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                  mode === m
                    ? 'text-white shadow-lg'
                    : 'text-white/40 hover:text-white/70'
                }`}
                style={mode === m ? { background: 'linear-gradient(135deg, #FF2D55, #BF5AF2)' } : {}}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3.5">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-3.5 overflow-hidden"
                >
                  <Input icon={User} type="text" placeholder="Full name" value={form.name}
                    onChange={set('name')} error={errors.name} />
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input icon={Calendar} type="number" placeholder="Age" value={form.age}
                        onChange={set('age')} error={errors.age} min="18" max="100" />
                    </div>
                    <div className="flex-1">
                      <select
                        value={form.gender} onChange={set('gender')}
                        className="w-full glass rounded-2xl px-4 py-3.5 text-white text-sm outline-none transition-all duration-200 focus:border-[rgba(255,45,85,0.5)] appearance-none"
                        style={{ background: 'var(--glass)' }}
                      >
                        <option value="" style={{ background: '#1C1C2E' }}>Gender</option>
                        <option value="male" style={{ background: '#1C1C2E' }}>Man</option>
                        <option value="female" style={{ background: '#1C1C2E' }}>Woman</option>
                        <option value="nonbinary" style={{ background: '#1C1C2E' }}>Non-binary</option>
                        <option value="other" style={{ background: '#1C1C2E' }}>Other</option>
                      </select>
                      {errors.gender && <p className="mt-1 text-red-400 text-xs pl-1">{errors.gender}</p>}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Input icon={Mail} type="email" placeholder="Email address" value={form.email}
              onChange={set('email')} error={errors.email} autoComplete="email" />

            <div className="relative">
              <Input icon={Lock} type={showPass ? 'text' : 'password'} 
  placeholder={mode === 'register' ? 'Password (min 6 chars)' : 'Password'}
  value={form.password}
  onChange={set('password')} error={errors.password} 
  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-3.5 text-white/30 hover:text-white/60 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {mode === 'login' && (
              <button type="button" onClick={() => router.push('/forgot-password')}
                className="text-right text-xs text-white/40 hover:text-spark-rose transition-colors">
                Forgot password?
              </button>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="btn-spark w-full text-base py-4 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⟳</motion.span>
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'login' ? '✨ Sign In' : '💖 Create Account'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-white/30 text-xs">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Google */}
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`}
            className="btn-glass w-full text-sm py-3.5 flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>
        </motion.div>

        <p className="text-white/20 text-xs text-center px-8 pt-4 pb-8">
          By continuing, you agree to Spark's Terms of Service & Privacy Policy
        </p>
      </div>
    </>
  );
}
