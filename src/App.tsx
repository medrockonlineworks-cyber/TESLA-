import { useState, useEffect, useCallback } from 'react';
import { DbUser, InvestmentPlan, Announcement, Investment, Deposit, Withdrawal, Transaction } from './types';
import { dbService } from './services/db';
import AuthScreen from './components/AuthScreen';
import BottomNav from './components/BottomNav';
import HomeTab from './components/HomeTab';
import InvestTab from './components/InvestTab';
import WalletTab from './components/WalletTab';
import ProfileTab from './components/ProfileTab';
import AdminPanel from './components/AdminPanel';
import AppDownloadModal from './components/AppDownloadModal';
import { ShieldCheck, Sparkles, Smartphone, CheckCircle, AlertTriangle, Info, Moon, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [user, setUser] = useState<DbUser | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'invest' | 'wallet' | 'profile'>('home');
  const [showAdmin, setShowAdmin] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [appReady, setAppReady] = useState(false);

  // Display Currency State & Conversion logic (1 USD = 120 ETB)
  const [currency, setCurrency] = useState<'USD' | 'ETB'>('USD');
  const [lang, setLang] = useState<'en' | 'am'>('en');
  const EXCHANGE_RATE = 120;

  const formatAmount = useCallback((usdValue: number, fractionDigits = 2) => {
    if (currency === 'ETB') {
      const etbValue = usdValue * EXCHANGE_RATE;
      return `${etbValue.toLocaleString(undefined, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
      })} ETB`;
    }
    return `$${usdValue.toLocaleString(undefined, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    })}`;
  }, [currency]);

  // Core Data Stores
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [usersList, setUsersList] = useState<DbUser[]>([]); // Admin only

  // Custom Toast Topper
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto erase toast
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Fetch all user specific and platform data
  const loadPlatformData = useCallback(async (currentUser: DbUser) => {
    try {
      const fetchedPlans = await dbService.getPlans();
      const fetchedAnns = await dbService.getAnnouncements();
      const fetchedInvs = await dbService.getInvestments(currentUser.id);
      const fetchedDeps = await dbService.getDeposits(currentUser.id);
      const fetchedWds = await dbService.getWithdrawals(currentUser.id);
      const fetchedTxs = await dbService.getTransactions(currentUser.id);

      setPlans(fetchedPlans);
      setAnnouncements(fetchedAnns);
      setInvestments(fetchedInvs);
      setDeposits(fetchedDeps);
      setWithdrawals(fetchedWds);
      setTransactions(fetchedTxs);

      // If user is admin, also fetch administrative logs
      if (currentUser.is_admin) {
        const allUsers = await dbService.getUsers();
        const allDeps = await dbService.getDeposits();
        const allWds = await dbService.getWithdrawals();
        const allInvs = await dbService.getInvestments();
        const allTxs = await dbService.getTransactions();

        setUsersList(allUsers);
        setDeposits(allDeps);
        setWithdrawals(allWds);
        setInvestments(allInvs);
        setTransactions(allTxs);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard states:', err);
      showToast('Error syncing blockchain accounts.', 'error');
    }
  }, [showToast]);

  // Periodic automatic completion checker of active investments
  const inspectMaturedInvestments = useCallback(async (currentUserId: string) => {
    try {
      const result = await dbService.checkAndCompleteInvestments(currentUserId);
      if (result.completedCount > 0) {
        showToast(`🎉 Contract Released! Settle payout of $${result.earnings.toFixed(2)} credited to your wallet!`, 'success');
        
        // Refresh User and Lists
        const updatedProfile = await dbService.getCurrentUser(currentUserId);
        if (updatedProfile) {
          setUser(updatedProfile);
          await loadPlatformData(updatedProfile);
        }
      }
    } catch (err) {
      console.error('Ticker inspection error:', err);
    }
  }, [loadPlatformData, showToast]);

  // Initial Boot loader
  useEffect(() => {
    async function bootApp() {
      try {
        const sessionUser = await dbService.getCurrentUser();
        if (sessionUser) {
          setUser(sessionUser);
          await loadPlatformData(sessionUser);
          showToast(`Logged in secure session: ${sessionUser.full_name}`, 'success');
        }
      } catch (err) {
        console.error('App boot error:', err);
      } finally {
        setAppReady(true);
      }
    }
    bootApp();
  }, [loadPlatformData, showToast]);

  // Background ticker clock (Check every 4 seconds for immediate payouts)
  useEffect(() => {
    if (!user) return;
    
    // Initial run
    inspectMaturedInvestments(user.id);

    const interval = setInterval(() => {
      inspectMaturedInvestments(user.id);
    }, 4000);

    return () => clearInterval(interval);
  }, [user, inspectMaturedInvestments]);

  // Handlers for Auth Changes
  const handleAuthSuccess = async (authenticatedUser: DbUser) => {
    setUser(authenticatedUser);
    await loadPlatformData(authenticatedUser);
  };

  const handleLogout = async () => {
    await dbService.signOut();
    setUser(null);
    setShowAdmin(false);
    setActiveTab('home');
    showToast('Secure session terminated.', 'info');
  };

  // Transaction action layers
  const handleInvestInPlan = async (planId: string, amount: number, returnAmount: number, durationHours: number) => {
    if (!user) return;
    await dbService.createInvestment(user.id, planId, amount, returnAmount, durationHours);
    
    // Reload profile and statements
    const updatedProfile = await dbService.getCurrentUser(user.id);
    if (updatedProfile) {
      setUser(updatedProfile);
      await loadPlatformData(updatedProfile);
    }
  };

  const handleDepositSubmit = async (amount: number, transactionId: string, screenshotUrl: string, agentAccountId?: string, agentAccountInfo?: string) => {
    if (!user) return;
    await dbService.createDeposit(user.id, amount, transactionId, screenshotUrl, agentAccountId, agentAccountInfo);
    await loadPlatformData(user);
  };

  const handleWithdrawSubmit = async (amount: number, phone: string) => {
    if (!user) return;
    await dbService.createWithdrawal(user.id, amount, phone);
    
    // Deduct immediate balance locally
    const updatedProfile = await dbService.getCurrentUser(user.id);
    if (updatedProfile) {
      setUser(updatedProfile);
      await loadPlatformData(updatedProfile);
    }
  };

  // Refresh helper for subtabs
  const handleDataRefresh = async () => {
    if (user) {
      await loadPlatformData(user);
    }
  };

  // Download APK handler
  const handleDownloadApp = () => {
    setShowDownloadModal(true);
  };

  // Show Loading Spinner on boot
  if (!appReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-slate-900 font-sans">
        <div className="w-12 h-12 border-4 border-amber-300/30 border-t-[#fbbc05] rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-mono uppercase tracking-widest text-slate-500">Initializing Tesla Secure Core...</h3>
      </div>
    );
  }

  // Not authenticated: Render login portal
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        {/* Simulate phone wrapper on desktop screen, full-bleed on mobile */}
        <div className="w-full max-w-md min-h-screen md:min-h-[850px] md:max-h-[900px] md:border md:border-slate-200 md:rounded-[40px] md:shadow-2xl overflow-y-auto bg-white text-slate-900 relative md:my-6">
          <AuthScreen onAuthSuccess={handleAuthSuccess} showToast={showToast} lang={lang} setLang={setLang} />
          
          {/* Floating Toast notification popup inside the phone view */}
          <div className="absolute top-4 left-4 right-4 z-50 space-y-2 pointer-events-none">
            <AnimatePresence>
              {toasts.map((toast) => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className={`p-3.5 rounded-xl border shadow-lg flex items-start gap-2.5 backdrop-blur-md pointer-events-auto ${
                    toast.type === 'success'
                      ? 'bg-white/95 border-emerald-200 text-emerald-800 shadow-emerald-100'
                      : toast.type === 'error'
                      ? 'bg-white/95 border-red-200 text-red-800 shadow-red-100'
                      : 'bg-white/95 border-amber-200 text-amber-800 shadow-amber-100'
                  }`}
                >
                  {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                  {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                  {toast.type === 'info' && <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                  <p className="text-[11px] font-sans font-medium leading-relaxed">{toast.message}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ACTIVE VIEWPORT
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      {/* Simulate Phone enclosure frame on Desktop */}
      <div className="w-full max-w-md h-screen md:h-[850px] md:border md:border-slate-200 md:rounded-[40px] md:shadow-2xl bg-white relative md:my-6 overflow-hidden flex flex-col text-slate-900">
        
        {/* Top status rail bar mockup (Locked at top of viewport mockup) */}
        <div className="bg-white/95 backdrop-blur-md px-6 py-3 flex items-center justify-between border-b border-slate-100 shrink-0 z-30">
          <div className="flex items-center gap-1.5 text-slate-900">
            <span className="w-2 h-2 rounded-full bg-[#fbbc05] animate-ping shadow-[0_0_6px_#fbbc05]" />
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold">TESLA INVESTMENT LIMITED</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Interactive Currency Selector Pill */}
            <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center gap-0.5">
              <button
                onClick={() => {
                  setCurrency('USD');
                  showToast('Display currency switched to USD ($)', 'info');
                }}
                className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-[#fbbc05] text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                USD
              </button>
              <button
                onClick={() => {
                  setCurrency('ETB');
                  showToast('Display currency switched to ETB (Ethiopian Birr)', 'info');
                }}
                className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  currency === 'ETB'
                    ? 'bg-[#fbbc05] text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ETB
              </button>
            </div>

            {/* Interactive Language Selector Dropdown */}
            <div className="relative">
              <select
                value={lang}
                onChange={(e) => {
                  const val = e.target.value as 'en' | 'am';
                  setLang(val);
                  showToast(val === 'en' ? 'Language switched to English' : 'ቋንቋ ወደ አማርኛ ተቀይሯል', 'info');
                }}
                className="bg-slate-100 border border-slate-200 text-slate-800 rounded-lg py-0.5 pl-2.5 pr-6 text-[8px] font-bold uppercase cursor-pointer outline-none hover:bg-slate-200 transition-colors appearance-none font-mono"
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
        </div>

        {/* Scrollable content container with static overlay tabs */}
        <div className="flex-grow overflow-y-auto relative pb-36">
          {/* Dynamic active tab page renderer with motion fade effect */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
              <HomeTab
                user={user}
                plans={plans}
                announcements={announcements}
                investments={investments}
                onInvest={handleInvestInPlan}
                onDepositSubmit={handleDepositSubmit}
                showToast={showToast}
                setActiveTab={setActiveTab}
                currency={currency}
                formatAmount={formatAmount}
                lang={lang}
              />
            )}
            {activeTab === 'invest' && (
              <InvestTab
                investments={investments}
                onRefresh={handleDataRefresh}
                showToast={showToast}
                currency={currency}
                formatAmount={formatAmount}
                lang={lang}
              />
            )}
            {activeTab === 'wallet' && (
              <WalletTab
                user={user}
                deposits={deposits}
                withdrawals={withdrawals}
                transactions={transactions}
                onDepositSubmit={handleDepositSubmit}
                onWithdrawSubmit={handleWithdrawSubmit}
                showToast={showToast}
                currency={currency}
                formatAmount={formatAmount}
                lang={lang}
                onRefresh={handleDataRefresh}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileTab
                user={user}
                investments={investments}
                onLogout={handleLogout}
                onOpenAdmin={() => setShowAdmin(true)}
                currency={currency}
                formatAmount={formatAmount}
                lang={lang}
              />
            )}
          </AnimatePresence>
        </div>
      </div> {/* CLOSING the flex-grow overflow-y-auto scrolling view container */}

      {/* Simulated device screen absolute notification stack */}
      <div className="absolute top-16 left-4 right-4 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`p-3.5 rounded-xl border shadow-lg flex items-start gap-2.5 backdrop-blur-md pointer-events-auto ${
                toast.type === 'success'
                  ? 'bg-white/95 border-emerald-200 text-emerald-800 shadow-emerald-100'
                  : toast.type === 'error'
                  ? 'bg-white/95 border-red-200 text-red-800 shadow-red-100'
                  : 'bg-white/95 border-amber-200 text-amber-800 shadow-amber-100'
              }`}
            >
              {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
              <p className="text-[11px] font-sans font-medium leading-relaxed">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Static Brand/Community Outreach Actions (Telegram + App Download) - Absolute within phone chassis */}
      <div className="absolute bottom-20 left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-md mx-auto px-6 flex justify-between items-center pointer-events-none">
          {/* Telegram premium glassmorphic pulsing floating launcher button */}
          <motion.a
            href="https://t.me/tesla_investment_et"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={{
              boxShadow: [
                "0 0 4px rgba(34,158,217,0.2)",
                "0 0 12px rgba(34,158,217,0.7)",
                "0 0 4px rgba(34,158,217,0.2)"
              ],
              borderColor: [
                "rgba(34,158,217,0.35)",
                "rgba(34,158,217,0.85)",
                "rgba(34,158,217,0.35)"
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            onClick={() => showToast("Opening Tesla Investment Official Telegram channel...", "info")}
            className="pointer-events-auto w-12 h-12 rounded-full bg-[#229ED9]/15 hover:bg-[#229ED9]/30 backdrop-blur-md flex items-center justify-center text-white border transition-all cursor-pointer shadow-lg"
            id="telegram-link-launcher"
            title="Join Telegram"
          >
            <Send className="w-5 h-5 -translate-x-[0.5px] translate-y-[0.5px] text-[#229ED9]" />
          </motion.a>

          {/* Tesla App Download static floating button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadApp}
            className="pointer-events-auto bg-[#fbbc05] hover:bg-[#e2a804] active:bg-[#c99503] text-slate-950 font-black text-[10.5px] px-4 py-2.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-400/20 border border-amber-300/35 cursor-pointer font-sans"
            id="tesla-apk-downloader"
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0 text-slate-950" />
            <span>Tesla App</span>
          </motion.button>
        </div>
      </div>

        {/* Fixed bottom dashboard menu tabs controller */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdmin={user.is_admin === true}
          onOpenAdmin={() => setShowAdmin(true)}
          lang={lang}
        />

        {/* 4. OVERLAY ADMIN PANEL WINDOW */}
        <AnimatePresence>
          {showAdmin && user.is_admin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-slate-50 z-50 overflow-y-auto"
            >
              <AdminPanel
                onClose={() => {
                  setShowAdmin(false);
                  loadPlatformData(user); // refresh profile variables upon exiting admin panel
                }}
                users={usersList}
                deposits={deposits}
                withdrawals={withdrawals}
                investments={investments}
                plans={plans}
                transactions={transactions}
                onRefreshData={() => loadPlatformData(user)}
                showToast={showToast}
                lang={lang}
              />
            </motion.div>
          )}

          {showDownloadModal && (
            <AppDownloadModal
              isOpen={showDownloadModal}
              onClose={() => setShowDownloadModal(false)}
              showToast={showToast}
              lang={lang}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
