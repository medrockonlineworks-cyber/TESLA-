import React, { useState } from 'react';
import { dbService } from '../services/db';
import { DbUser } from '../types';
import { Mail, Lock, User, Key, Zap, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithGooglePopup } from '../services/firebase';

interface AuthScreenProps {
  onAuthSuccess: (user: DbUser) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  lang: 'en' | 'am';
  setLang: (lang: 'en' | 'am') => void;
}

export default function AuthScreen({ onAuthSuccess, showToast, lang, setLang }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const t = {
    en: {
      appName: "TESLA INVESTMENT",
      resetPassword: "Reset Password",
      signIn: "Sign In",
      signUp: "Sign Up",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your name",
      emailAddress: "Email Address",
      emailPlaceholder: "name@example.com",
      password: "Password",
      forgot: "Forgot?",
      passwordPlaceholder: "••••••••",
      confirmPassword: "Confirm Password",
      sendInstructions: "Send Instructions",
      accessPortal: "Access Portal",
      registerNow: "Register Now",
      backToLogin: "Back to Login",
      dontHaveAccount: "Don't have an account?",
      registerHere: "Register Here",
      alreadyHaveAccount: "Already have an account?",
      logInHere: "Log In Here",
      fillMemberDemo: "Fill Member Demo",
      loginAdmin: "Login Admin",
      validEmailErr: "Please enter a valid email address.",
      enterPasswordErr: "Please enter your password.",
      passwordResetSuccess: "Password reset link sent to your email address!",
      resetEmailErr: "Failed to send reset email.",
      welcomeBack: "Welcome back",
      enterFullNameErr: "Please enter your full name.",
      passwordLengthErr: "Password must be at least 6 characters long.",
      passwordMismatchErr: "Passwords do not match.",
      accountCreatedSuccess: "Account created successfully! Enjoy a $30 welcome bonus.",
      unexpectedErr: "An unexpected error occurred.",
      localAdminLogin: "Logged in as Local Demo Administrator!",
      adminLoginSuccess: "Logged in as Administrator!",
      demoCredentialsFilled: "Credentials filled. Click Access Portal."
    },
    am: {
      appName: "ቴስላ ኢንቨስትመንት",
      resetPassword: "የይለፍ ቃል መልስ",
      signIn: "ግባ",
      signUp: "ይመዝገቡ",
      fullName: "ሙሉ ስም",
      fullNamePlaceholder: "ስምዎን ያስገቡ",
      emailAddress: "የኢሜል አድራሻ",
      emailPlaceholder: "name@example.com",
      password: "የይለፍ ቃል",
      forgot: "ረሱት?",
      passwordPlaceholder: "••••••••",
      confirmPassword: "የይለፍ ቃል ያረጋግጡ",
      sendInstructions: "መመሪያዎችን ላክ",
      accessPortal: "ግባ",
      registerNow: "አሁን ይመዝገቡ",
      backToLogin: "ወደ መግቢያ ተመለስ",
      dontHaveAccount: "መለያ የለዎትም?",
      registerHere: "እዚህ ይመዝገቡ",
      alreadyHaveAccount: "ቀድሞውኑ መለያ አለዎት?",
      logInHere: "እዚህ ይግቡ",
      fillMemberDemo: "የሙከራ አባል መግቢያ",
      loginAdmin: "አስተዳዳሪ ግባ",
      validEmailErr: "እባክዎ ትክክለኛ የኢሜይል አድራሻ ያስገቡ።",
      enterPasswordErr: "እባክዎ የይለፍ ቃልዎን ያስገቡ።",
      passwordResetSuccess: "የይለፍ ቃል መልሶ ማግኛ አገናኝ ወደ ኢሜይልዎ ተልኳል!",
      resetEmailErr: "መልሶ ማግኛ ኢሜይል መላክ አልተሳካም።",
      welcomeBack: "እንኳን ደህና መጡ",
      enterFullNameErr: "እባክዎ ሙሉ ስምዎን ያስገቡ።",
      passwordLengthErr: "የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት።",
      passwordMismatchErr: "የይለፍ ቃላት አይዛመዱም።",
      accountCreatedSuccess: "መለያዎ በተሳካ ሁኔታ ተፈጥሯል! የ $30 ጉርሻ አግኝተዋል።",
      unexpectedErr: "ያልተጠበቀ ስህተት ተከስቷል።",
      localAdminLogin: "እንደ አካባቢያዊ አስተዳዳሪ ገብተዋል!",
      adminLoginSuccess: "እንደ አስተዳዳሪ ገብተዋል!",
      demoCredentialsFilled: "የሙከራ መለያ መረጃ ተሞልቷል። ግባ የሚለውን ይጫኑ።"
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast(t[lang].validEmailErr, 'error');
      return;
    }

    if (!isForgot && !password) {
      showToast(t[lang].enterPasswordErr, 'error');
      return;
    }

    setLoading(true);

    try {
      if (isForgot) {
        // Forgot password flow
        const { success, error } = await dbService.forgotPassword(email);
        if (success) {
          showToast(t[lang].passwordResetSuccess, 'success');
          setIsForgot(false);
          setIsLogin(true);
        } else {
          showToast(error || t[lang].resetEmailErr, 'error');
        }
      } else if (isLogin) {
        // Login flow
        const { user, error } = await dbService.signIn(email, password);
        if (error) {
          showToast(error, 'error');
        } else if (user) {
          showToast(`${t[lang].welcomeBack}, ${user.full_name}!`, 'success');
          onAuthSuccess(user);
        }
      } else {
        // Registration flow
        if (!fullName.trim()) {
          showToast(t[lang].enterFullNameErr, 'error');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          showToast(t[lang].passwordLengthErr, 'error');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          showToast(t[lang].passwordMismatchErr, 'error');
          setLoading(false);
          return;
        }

        const { user, error } = await dbService.signUp(fullName, email, password);
        if (error) {
          showToast(error, 'error');
        } else if (user) {
          showToast(t[lang].accountCreatedSuccess, 'success');
          onAuthSuccess(user);
        }
      }
    } catch (err: any) {
      showToast(err.message || t[lang].unexpectedErr, 'error');
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
          showToast(t[lang].localAdminLogin, 'success');
          onAuthSuccess(newUser);
        } else {
          showToast(regError || 'Admin login failed.', 'error');
        }
      } else if (user) {
        showToast(t[lang].adminLoginSuccess, 'success');
        onAuthSuccess(user);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const firebaseUser = await signInWithGooglePopup();
      if (firebaseUser && firebaseUser.email) {
        const fullNameVal = firebaseUser.displayName || firebaseUser.email.split('@')[0];
        const { user, error } = await dbService.signInWithGoogle(
          firebaseUser.uid,
          fullNameVal,
          firebaseUser.email
        );
        if (error) {
          showToast(error, 'error');
        } else if (user) {
          showToast(`${t[lang].welcomeBack}, ${user.full_name}!`, 'success');
          onAuthSuccess(user);
        }
      } else {
        showToast(lang === 'en' ? 'Google authentication failed or canceled.' : 'በGoogle መግባት አልተሳካም ወይም ተሰርዟል::', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || t[lang].unexpectedErr, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-between min-h-screen bg-[#020711] text-white px-6 py-10 relative overflow-hidden font-sans">
      {/* Absolute Tesla Royal Gold Laser Glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#fbbc05]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-[#fbbc05]/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Language Selector at Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <div className="relative animate-fade-in">
          <select
            value={lang}
            onChange={(e) => {
              const val = e.target.value as 'en' | 'am';
              setLang(val);
              showToast(val === 'en' ? 'Language switched to English' : 'ቋንቋ ወደ አማርኛ ተቀይሯል', 'info');
            }}
            className="bg-[#030a16] border border-[#0d2242] text-slate-300 text-[10px] font-bold rounded-lg py-1 px-2.5 outline-none hover:border-[#fbbc05] transition-all cursor-pointer appearance-none pr-6 font-mono"
          >
            <option value="en">EN</option>
            <option value="am">አማ</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-500">
            <svg className="fill-current h-2.5 w-2.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Header section with high-contrast Tesla design */}
      <div className="flex flex-col items-center mt-6 z-10">
        <h1 className="text-3xl font-black tracking-tight text-center text-white">
          {t[lang].appName}
        </h1>
      </div>

      {/* Card Form container */}
      <div className="my-auto py-6 z-10">
        <div className="bg-[#030a16] border border-[#0d2242] p-6 rounded-[24px] shadow-2xl relative">
          {/* Subtle gold line accent on top card */}
          <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-[#fbbc05] to-transparent" />

          <h2 className="text-xl font-extrabold mb-6 text-white text-center">
            {isForgot ? t[lang].resetPassword : isLogin ? t[lang].signIn : t[lang].signUp}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            {/* FULL NAME (Only for sign-up) */}
            {!isLogin && !isForgot && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">{t[lang].fullName}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder={t[lang].fullNamePlaceholder}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#040e21] border border-[#0d2242] focus:border-[#fbbc05] focus:ring-1 focus:ring-[#fbbc05] outline-none text-sm text-white pl-10 pr-4 py-3 rounded-xl transition-all"
                  />
                </div>
              </div>
            )}

            {/* EMAIL ADDRESS */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">{t[lang].emailAddress}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder={t[lang].emailPlaceholder}
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
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">{t[lang].password}</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgot(true);
                        setIsLogin(false);
                      }}
                      className="text-[10px] text-[#fbbc05] hover:underline font-mono"
                    >
                      {t[lang].forgot}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder={t[lang].passwordPlaceholder}
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
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">{t[lang].confirmPassword}</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder={t[lang].passwordPlaceholder}
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
                  {isForgot ? t[lang].sendInstructions : isLogin ? t[lang].accessPortal : t[lang].registerNow}
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
                {t[lang].backToLogin}
              </button>
            ) : isLogin ? (
              <p>
                {t[lang].dontHaveAccount}{' '}
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setIsForgot(false);
                  }}
                  className="text-[#fbbc05] font-bold hover:underline font-mono"
                >
                  {t[lang].registerHere}
                </button>
              </p>
            ) : (
              <p>
                {t[lang].alreadyHaveAccount}{' '}
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setIsForgot(false);
                  }}
                  className="text-[#fbbc05] font-bold hover:underline font-mono"
                >
                  {t[lang].logInHere}
                </button>
              </p>
            )}
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
