import React, { useState } from 'react';
import { dbService } from '../services/db';
import { DbUser } from '../types';
import { Mail, Lock, User, Key, Zap, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthScreenProps {
  onAuthSuccess: (user: DbUser) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function AuthScreen({ onAuthSuccess, showToast }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    if (!isForgot && !password) {
      showToast('Please enter your password.', 'error');
      return;
    }

    setLoading(true);

    try {
      if (isForgot) {
        // Forgot password flow
        const { success, error } = await dbService.forgotPassword(email);
        if (success) {
          showToast('Password reset link sent to your email address!', 'success');
          setIsForgot(false);
          setIsLogin(true);
        } else {
          showToast(error || 'Failed to send reset email.', 'error');
        }
      } else if (isLogin) {
        // Login flow
        const { user, error } = await dbService.signIn(email, password);
        if (error) {
          showToast(error, 'error');
        } else if (user) {
          showToast(`Welcome back, ${user.full_name}!`, 'success');
          onAuthSuccess(user);
        }
      } else {
        // Registration flow
        if (!fullName.trim()) {
          showToast('Please enter your full name.', 'error');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          showToast('Password must be at least 6 characters long.', 'error');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          showToast('Passwords do not match.', 'error');
          setLoading(false);
          return;
        }

        const { user, error } = await dbService.signUp(fullName, email, password);
        if (error) {
          showToast(error, 'error');
        } else if (user) {
          showToast('Account created successfully! Enjoy a $30 welcome bonus.', 'success');
          onAuthSuccess(user);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setLoading(true);
    try {
      const { user, error } = await dbService.signIn('admin@tesla.com', 'admin123');
      if (error) {
        // If the admin user doesn't exist yet, we will register them locally
        const { user: newUser, error: regError } = await dbService.signUp('Tesla Administrator', 'admin@tesla.com', 'admin123');
        if (newUser) {
          showToast('Logged in as Local Demo Administrator!', 'success');
          onAuthSuccess(newUser);
        } else {
          showToast(regError || 'Admin login failed.', 'error');
        }
      } else if (user) {
        showToast('Logged in as Administrator!', 'success');
        onAuthSuccess(user);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-between min-h-screen bg-[#020711] text-white px-6 py-10 relative overflow-hidden font-sans">
      {/* Absolute Tesla Royal Gold Laser Glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#fbbc05]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-[#fbbc05]/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header section with high-contrast Tesla design */}
      <div className="flex flex-col items-center mt-6 z-10">
        <h1 className="text-3xl font-black tracking-tight text-center text-white">
          TESLA INVESTMENT
        </h1>
      </div>

      {/* Card Form container */}
      <div className="my-auto py-6 z-10">
        <div className="bg-[#030a16] border border-[#0d2242] p-6 rounded-[24px] shadow-2xl relative">
          {/* Subtle gold line accent on top card */}
          <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-[#fbbc05] to-transparent" />

          <h2 className="text-xl font-extrabold mb-6 text-white text-center">
            {isForgot ? 'Reset Password' : isLogin ? 'Sign In' : 'Sign Up'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            {/* FULL NAME (Only for sign-up) */}
            {!isLogin && !isForgot && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#040e21] border border-[#0d2242] focus:border-[#fbbc05] focus:ring-1 focus:ring-[#fbbc05] outline-none text-sm text-white pl-10 pr-4 py-3 rounded-xl transition-all"
                  />
                </div>
              </div>
            )}

            {/* EMAIL ADDRESS */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#040e21] border border-[#0d2242] focus:border-[#fbbc05] focus:ring-1 focus:ring-[#fbbc05] outline-none text-sm text-white pl-10 pr-4 py-3 rounded-xl transition-all"
                />
              </div>
            </div>

            {/* PASSWORD */}
            {!isForgot && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgot(true);
                        setIsLogin(false);
                      }}
                      className="text-[10px] text-[#fbbc05] hover:underline font-mono"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#040e21] border border-[#0d2242] focus:border-[#fbbc05] focus:ring-1 focus:ring-[#fbbc05] outline-none text-sm text-white pl-10 pr-4 py-3 rounded-xl transition-all"
                  />
                </div>
              </div>
            )}

            {/* CONFIRM PASSWORD (Only for sign up) */}
            {!isLogin && !isForgot && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Confirm Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#040e21] border border-[#0d2242] focus:border-[#fbbc05] focus:ring-1 focus:ring-[#fbbc05] outline-none text-sm text-white pl-10 pr-4 py-3 rounded-xl transition-all"
                  />
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#fbbc05] hover:bg-[#e2a804] active:bg-[#c99503] disabled:opacity-50 text-slate-950 font-black text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all mt-6 shadow-lg shadow-[#fbbc05]/10"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  {isForgot ? 'Send Instructions' : isLogin ? 'Access Portal' : 'Register Now'}
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </form>

          {/* TOGGLE LINKS */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {isForgot ? (
              <button
                onClick={() => {
                  setIsForgot(false);
                  setIsLogin(true);
                }}
                className="text-[#fbbc05] font-bold hover:underline font-mono text-[11px]"
              >
                Back to Login
              </button>
            ) : isLogin ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setIsForgot(false);
                  }}
                  className="text-[#fbbc05] font-bold hover:underline font-mono"
                >
                  Register Here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setIsForgot(false);
                  }}
                  className="text-[#fbbc05] font-bold hover:underline font-mono"
                >
                  Log In Here
                </button>
              </p>
            )}
          </div>
        </div>

        {/* DEMO ACCOUNTS DRAWER */}
        <div className="mt-4 bg-[#0b1a30] border border-[#0d2242] rounded-xl p-4 text-center">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setEmail('user@gmail.com');
                setPassword('user123');
                setIsLogin(true);
                setIsForgot(false);
                showToast('Credentials filled. Click Access Portal.', 'info');
              }}
              className="bg-[#030a16] border border-[#0d2242] text-slate-300 text-[10px] py-1.5 px-2 rounded-lg hover:border-[#fbbc05] hover:text-[#fbbc05] transition-colors cursor-pointer font-mono shadow-sm"
            >
              Fill Member Demo
            </button>
            <button
              onClick={handleDemoAdminLogin}
              className="bg-[#030a16] border border-[#fbbc05]/30 text-[#fbbc05] text-[10px] py-1.5 px-2 rounded-lg hover:border-[#fbbc05] hover:bg-[#fbbc05]/10 transition-all cursor-pointer font-mono flex items-center justify-center gap-1 shadow-sm"
            >
              <Shield className="w-2.5 h-2.5" />
              Login Admin
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center z-10 mt-auto">
        <p className="text-[8px] text-slate-500 font-mono">
          © 2026 Tesla Investment Limited
        </p>
      </div>
    </div>
  );
}
