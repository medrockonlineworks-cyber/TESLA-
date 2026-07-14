import { useState } from 'react';
import { DbUser, InvestmentPlan, Announcement, Investment } from '../types';
import { Zap, TrendingUp, Wallet, ShieldCheck, Megaphone, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HomeTabProps {
  user: DbUser;
  plans: InvestmentPlan[];
  announcements: Announcement[];
  investments: Investment[];
  onInvest: (planId: string, amount: number, returnAmount: number, durationHours: number) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setActiveTab: (tab: 'home' | 'invest' | 'wallet' | 'profile') => void;
}

export default function HomeTab({
  user,
  plans,
  announcements,
  investments,
  onInvest,
  showToast,
  setActiveTab,
}: HomeTabProps) {
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investing, setInvesting] = useState(false);

  // Derive stats
  const activeInvestments = investments.filter((i) => i.status === 'active');
  const activeInvestmentTotal = activeInvestments.reduce((acc, i) => acc + i.amount, 0);

  const handleConfirmInvestment = async () => {
    if (!selectedPlan) return;
    if (user.balance < selectedPlan.amount) {
      showToast('Insufficient wallet balance. Please recharge your wallet.', 'error');
      setSelectedPlan(null);
      // Redirect to wallet tab
      setActiveTab('wallet');
      return;
    }

    setInvesting(true);
    try {
      await onInvest(selectedPlan.id, selectedPlan.amount, selectedPlan.return_amount, selectedPlan.duration_hours);
      showToast(`Successfully invested $${selectedPlan.amount} in ${selectedPlan.name}!`, 'success');
      setSelectedPlan(null);
    } catch (err: any) {
      showToast(err.message || 'Investment failed.', 'error');
    } finally {
      setInvesting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in font-sans">
      {/* 1. Header welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
            Welcome, <span className="text-indigo-600">{user.full_name.split(' ')[0]}</span>
          </h2>
        </div>
      </div>

      {/* 2. Main Account Status Panel */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 border border-indigo-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden text-white">
        {/* Soft emerald neon glow on top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-transparent" />

        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-indigo-100 font-mono">Balance</span>
            <div className="text-3xl font-extrabold tracking-tight mt-1 text-white">
              ${user.balance.toFixed(2)}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('wallet')}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-mono text-[11px] font-bold tracking-wider rounded-lg transition-colors shadow-md shadow-emerald-500/20 cursor-pointer uppercase border border-emerald-400/20"
          >
            + Recharge
          </button>
        </div>

        {/* Stats Subdivision Grid */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-indigo-500/30">
          <div className="bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-500/20">
            <span className="text-[8px] uppercase text-indigo-200 font-mono block">Active Stakes</span>
            <span className="text-sm font-bold text-amber-300 font-mono mt-0.5 block">
              ${activeInvestmentTotal.toFixed(0)}
            </span>
          </div>

          <div className="bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-500/20">
            <span className="text-[8px] uppercase text-indigo-200 font-mono block">Total Profit</span>
            <span className="text-sm font-bold text-emerald-300 font-mono mt-0.5 block flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-300 inline" />
              ${user.total_profit.toFixed(0)}
            </span>
          </div>

          <div className="bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-500/20">
            <span className="text-[8px] uppercase text-indigo-200 font-mono block">Plan Yields</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              Up to 60%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Latest Announcements Section */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <Megaphone className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">Important Updates</h3>
          </div>

          <div className="space-y-2">
            {announcements.slice(0, 1).map((ann) => (
              <div
                key={ann.id}
                className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 relative overflow-hidden"
              >
                <div className="absolute right-2 top-2 p-1 bg-indigo-100 border border-indigo-200/50 rounded-lg text-indigo-700 text-[8px] font-mono">
                  NEW
                </div>
                <h4 className="text-xs font-bold text-indigo-900 tracking-tight pr-8">{ann.title}</h4>
                <p className="text-[11px] text-slate-700 mt-1 line-clamp-2 leading-relaxed">
                  {ann.message}
                </p>
                <p className="text-[8px] text-slate-400 font-mono mt-2 uppercase">
                  Issued: {new Date(ann.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Active Investment Plans Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-indigo-600 animate-pulse" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">Tesla Energy Pools</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono uppercase">24-Hour Contracts</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative group transition-all duration-300 hover:-translate-y-0.5"
            >
              {/* Tesla design elements */}
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_#4f46e5] opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight mt-0.5">{plan.name}</h4>

                {/* Return amount badge */}
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] font-mono font-bold text-emerald-600 mt-2">
                  +{(((plan.return_amount - plan.amount) / plan.amount) * 100).toFixed(0)}% ROI
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Deposit:</span>
                  <span className="text-slate-900 font-bold">${plan.amount}</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono mt-1">
                  <span className="text-slate-500">Payout:</span>
                  <span className="text-emerald-600 font-bold">${plan.return_amount}</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono mt-1">
                  <span className="text-slate-500">Term:</span>
                  <span className="text-slate-700 block font-bold">{plan.duration_hours} Hrs</span>
                </div>

                <button
                  onClick={() => setSelectedPlan(plan)}
                  className="w-full bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:border-indigo-600 text-indigo-600 hover:text-white font-mono font-bold text-xs py-2 mt-4 rounded-xl cursor-pointer transition-all uppercase"
                >
                  STAKE NOW
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. CONFIRM INVESTMENT BOTTOM SHEET / MODAL */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm px-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl p-6 relative pb-10 shadow-2xl"
            >
              {/* Top notch drag handle bar */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

              <h3 className="text-lg font-bold text-slate-900 tracking-tight text-center">Confirm Staking Contract</h3>

              {/* Detailed Contract Box */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 mt-6 space-y-3 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 uppercase">Target Project:</span>
                  <span className="text-slate-900 font-bold">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 uppercase">Staking Amount:</span>
                  <span className="text-indigo-600 font-bold font-mono">${selectedPlan.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 uppercase">Contract Term:</span>
                  <span className="text-slate-900 font-bold">{selectedPlan.duration_hours} Hours</span>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-100 pt-3">
                  <span className="text-slate-500 uppercase">Configured Profit:</span>
                  <span className="text-emerald-600 font-bold">${(selectedPlan.return_amount - selectedPlan.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-100 pt-3">
                  <span className="text-slate-700 uppercase font-bold">Total Payout:</span>
                  <span className="text-emerald-600 font-extrabold font-mono text-base">${selectedPlan.return_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Balance Check warning if insufficient */}
              {user.balance < selectedPlan.amount && (
                <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mt-3 items-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-[10px] text-amber-700">
                    Your balance is insufficient. Click below to redirect to Recharge.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 text-sm font-bold font-mono rounded-xl cursor-pointer uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmInvestment}
                  disabled={investing}
                  className="py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-sm font-bold font-mono rounded-xl cursor-pointer uppercase transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
                >
                  {investing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Accept & Stake'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
