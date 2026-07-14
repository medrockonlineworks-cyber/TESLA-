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
import { ShieldCheck, Sparkles, Smartphone, CheckCircle, AlertTriangle, Info, Moon } from 'lucide-react';
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
  const [appReady, setAppReady] = useState(false);

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

  // Show Loading Spinner on boot
  if (!appReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 font-sans">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400">Initializing Tesla Secure Core...</h3>
      </div>
    );
  }

  // Not authenticated: Render login portal
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        {/* Simulate phone wrapper on desktop screen, full-bleed on mobile */}
        <div className="w-full max-w-md min-h-screen md:min-h-[850px] md:max-h-[900px] md:border md:border-slate-200 md:rounded-[40px] md:shadow-2xl overflow-y-auto bg-slate-50 relative md:my-6">
          <AuthScreen onAuthSuccess={handleAuthSuccess} showToast={showToast} />
          
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
                      ? 'bg-white/95 border-green-200 text-green-800'
                      : toast.type === 'error'
                      ? 'bg-white/95 border-red-200 text-red-800'
                      : 'bg-white/95 border-indigo-200 text-indigo-800'
                  }`}
                >
                  {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />}
                  {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                  {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />}
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
      <div className="w-full max-w-md min-h-screen md:min-h-[850px] md:max-h-[900px] md:border md:border-slate-200 md:rounded-[40px] md:shadow-2xl overflow-y-auto bg-slate-50 relative md:my-6 pb-20">
        
        {/* Top status rail bar mockup */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-6 py-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping shadow-[0_0_6px_#4f46e5]" />
            <span className="text-[10px] font-mono tracking-widest text-slate-800 uppercase font-bold">Tesla Inv Co.</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>SECURED ENGINE</span>
          </div>
        </div>

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
                showToast={showToast}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === 'invest' && (
              <InvestTab
                investments={investments}
                onRefresh={handleDataRefresh}
                showToast={showToast}
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
              />
            )}
            {activeTab === 'profile' && (
              <ProfileTab
                user={user}
                investments={investments}
                onLogout={handleLogout}
                onOpenAdmin={() => setShowAdmin(true)}
              />
            )}
          </AnimatePresence>
        </div>

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
                    ? 'bg-white/95 border-green-200 text-green-800'
                    : toast.type === 'error'
                    ? 'bg-white/95 border-red-200 text-red-800'
                    : 'bg-white/95 border-indigo-200 text-indigo-800'
                }`}
              >
                {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />}
                {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />}
                <p className="text-[11px] font-sans font-medium leading-relaxed">{toast.message}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Fixed bottom dashboard menu tabs controller */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdmin={user.is_admin === true}
          onOpenAdmin={() => setShowAdmin(true)}
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
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
