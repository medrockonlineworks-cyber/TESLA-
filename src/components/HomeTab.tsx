import { useState, useEffect } from 'react';
import { DbUser, InvestmentPlan, Announcement, Investment } from '../types';
import { Zap, TrendingUp, Wallet, ShieldCheck, Megaphone, Clock, AlertTriangle, X, ClipboardCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HomeTabProps {
  user: DbUser;
  plans: InvestmentPlan[];
  announcements: Announcement[];
  investments: Investment[];
  onInvest: (planId: string, amount: number, returnAmount: number, durationHours: number) => Promise<void>;
  onDepositSubmit: (amount: number, transactionId: string, screenshotUrl: string, agentAccountId?: string, agentAccountInfo?: string) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setActiveTab: (tab: 'home' | 'invest' | 'wallet' | 'profile') => void;
  currency: 'USD' | 'ETB';
  formatAmount: (usdValue: number, fractionDigits?: number) => string;
  lang: 'en' | 'am';
}

export default function HomeTab({
  user,
  plans,
  announcements,
  investments,
  onInvest,
  onDepositSubmit,
  showToast,
  setActiveTab,
  currency,
  formatAmount,
  lang,
}: HomeTabProps) {
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investing, setInvesting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  // Countdown timer effect
  useEffect(() => {
    if (!selectedPlan) return;
    setCountdown(600); // Reset countdown
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedPlan]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectPlan = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setPaymentProof(null);
    const randomHex = Math.floor(10000000 + Math.random() * 90000000).toString();
    // Match INV-5615ABB7 pattern precisely
    const suffix = Math.random().toString(36).substr(2, 4).toUpperCase();
    setOrderId(`INV-${randomHex.substring(0, 4)}${suffix}`);
  };

  // Derive stats
  const activeInvestments = investments.filter((i) => i.status === 'active');
  const activeInvestmentTotal = activeInvestments.reduce((acc, i) => acc + i.amount, 0);

  // Translation mapping matching the screenshot and Amharic locales
  const t = {
    en: {
      activeTrades: "Active Trades",
      title: "Investment Plans",
      returns: "Returns:",
      investNow: "Invest Now",
      hours: "hours",
      starter: "Starter plan",
      growth: "Growth plan",
      premium: "Premium plan",
      elite: "Elite plan"
    },
    am: {
      activeTrades: "ንቁ እቅዶች",
      title: "የኢንቨስትመንት ዕቅዶች",
      returns: "ተመላሽ ገንዘብ:",
      investNow: "አሁን ኢንቨስት ያድርጉ",
      hours: "ሰዓታት",
      starter: "የጀማሪ እቅድ",
      growth: "የዕድገት እቅድ",
      premium: "የፕሪሚየም እቅድ",
      elite: "የኤሊት እቅድ"
    }
  };

  const getPlanName = (plan: InvestmentPlan) => {
    if (plan.id === 'plan_starter' || plan.name === 'Starter plan') return t[lang].starter;
    if (plan.id === 'plan_growth' || plan.name === 'Growth plan') return t[lang].growth;
    if (plan.id === 'plan_premium' || plan.name === 'Premium plan') return t[lang].premium;
    if (plan.id === 'plan_elite' || plan.name === 'Elite plan') return t[lang].elite;
    return plan.name;
  };

  const displayPrice = (usdValue: number) => {
    if (currency === 'ETB') {
      const etbValue = Math.round(usdValue * 120);
      return `Birr ${etbValue.toLocaleString()}`;
    }
    return `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

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
      showToast(`Successfully invested ${formatAmount(selectedPlan.amount)} in ${selectedPlan.name}!`, 'success');
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
          <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
            Welcome, <span className="text-amber-600 font-extrabold">{user.full_name.split(' ')[0]}</span>
          </h2>
        </div>
      </div>

      {/* 2. Main Account Status Panel */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-400 to-amber-500 border border-amber-300 rounded-3xl p-5 shadow-lg relative overflow-hidden text-slate-950">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-800 font-bold">Balance</span>
            <div className="text-3xl font-extrabold tracking-tight mt-1 text-slate-950 font-mono">
              {formatAmount(user.balance, 2)}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('wallet')}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white font-sans text-xs font-bold tracking-wider rounded-xl transition-all shadow-md cursor-pointer uppercase border border-slate-800"
          >
            + Recharge
          </button>
        </div>

        {/* Stats Subdivision Grid */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-amber-600/20">
          <div className="bg-white/40 p-2.5 rounded-xl border border-white/35">
            <span className="text-[8px] uppercase text-slate-800 font-bold block">Active Stakes</span>
            <span className="text-sm font-bold text-slate-950 font-mono mt-0.5 block">
              {formatAmount(activeInvestmentTotal, 0)}
            </span>
          </div>

          <div className="bg-white/40 p-2.5 rounded-xl border border-white/35">
            <span className="text-[8px] uppercase text-slate-800 font-bold block">Total Profit</span>
            <span className="text-sm font-bold text-emerald-800 font-mono mt-0.5 block flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-800 inline" />
              {formatAmount(user.total_profit, 0)}
            </span>
          </div>

          <div className="bg-white/40 p-2.5 rounded-xl border border-white/35">
            <span className="text-[8px] uppercase text-slate-800 font-bold block">Plan Yields</span>
            <span className="text-sm font-bold text-slate-950 font-mono mt-0.5 block">
              Up to 60%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Latest Announcements Section */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <Megaphone className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Important Updates</h3>
          </div>

          <div className="space-y-2">
            {announcements.slice(0, 1).map((ann) => (
              <div
                key={ann.id}
                className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 relative overflow-hidden"
              >
                <div className="absolute right-2 top-2 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700 text-[8px] font-mono font-bold uppercase">
                  NEW
                </div>
                <h4 className="text-xs font-extrabold text-slate-900 tracking-tight pr-8">{ann.title}</h4>
                <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {ann.message}
                </p>
                <p className="text-[8px] text-slate-400 font-mono mt-2.5 uppercase font-bold">
                  Issued: {new Date(ann.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Active Investment Plans Container (Matching Screenshot styling) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 space-y-4 shadow-sm relative overflow-hidden">
        {/* Active Trades Button Panel */}
        <div className="relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('invest')}
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 font-sans text-xs font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
            <span>{t[lang].activeTrades}</span>
          </button>
        </div>

        {/* Header without local language select */}
        <div className="flex justify-between items-center relative z-10 pt-2">
          <h3 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
            {t[lang].title}
          </h3>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border-2 border-amber-400/80 shadow-[0_4px_20px_rgba(251,188,5,0.08)] hover:shadow-[0_4px_25px_rgba(251,188,5,0.15)] rounded-3xl p-4 flex flex-col justify-between relative group transition-all duration-300 hover:-translate-y-0.5"
            >
              <div>
                {/* 24/48 hours badge */}
                <span className="inline-block border border-emerald-200/60 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                  {plan.duration_hours} {t[lang].hours}
                </span>

                {/* Plan Title */}
                <h4 className="text-[13px] font-extrabold text-slate-900 tracking-tight mt-2.5">
                  {getPlanName(plan)}
                </h4>

                {/* Cost/Stake Amount */}
                <span className="text-sm font-extrabold text-slate-900 mt-2 block font-mono">
                  {displayPrice(plan.amount)}
                </span>

                {/* Returns section */}
                <div className="mt-3">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">
                    {t[lang].returns}
                  </span>
                  <span className="text-emerald-600 font-black text-xs font-mono mt-0.5 block">
                    {displayPrice(plan.return_amount)}
                  </span>
                </div>
              </div>

              {/* Yellow Invest Button */}
              <button
                type="button"
                onClick={() => handleSelectPlan(plan)}
                className="w-full bg-[#fbbc05] hover:bg-[#e2a804] active:bg-[#c99503] text-slate-950 font-black text-[10px] uppercase tracking-wider py-2.5 mt-4 rounded-xl cursor-pointer transition-all duration-200 shadow-md shadow-[#fbbc05]/10"
              >
                {t[lang].investNow}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. CONFIRM INVESTMENT BOTTOM SHEET / MODAL */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto py-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPlan(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title Section */}
              <div className="text-center mt-2">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                  {getPlanName(selectedPlan).toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed px-4">
                  Complete payment, upload proof, then submit for verification.
                </p>
              </div>

              <div className="space-y-3.5 mt-6">
                {/* Yellow Card 1: Order ID & Duration */}
                <div className="bg-[#fffdf0] border border-amber-200/80 rounded-2xl p-4 shadow-[0_2px_12px_rgba(251,188,5,0.03)] flex justify-between items-start">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Order ID</span>
                    <span className="text-slate-900 text-base font-extrabold mt-1 block font-mono">{orderId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Duration</span>
                    <span className="text-slate-900 text-sm font-extrabold mt-1 block">{selectedPlan.duration_hours} hours</span>
                  </div>
                </div>

                {/* Yellow Card 2: Investment amount */}
                <div className="bg-[#fffdf0] border border-amber-200/80 rounded-2xl p-4 shadow-[0_2px_12px_rgba(251,188,5,0.03)] flex justify-between items-center">
                  <span className="text-slate-700 text-xs font-bold uppercase tracking-wider">Investment amount</span>
                  <span className="text-slate-900 font-black text-sm">
                    {displayPrice(selectedPlan.amount)} ({formatAmount(selectedPlan.amount, 0)})
                  </span>
                </div>

                {/* Yellow Card 3: Expected returns */}
                <div className="bg-[#fffdf0] border border-amber-200/80 rounded-2xl p-4 shadow-[0_2px_12px_rgba(251,188,5,0.03)] flex justify-between items-center">
                  <span className="text-slate-700 text-xs font-bold uppercase tracking-wider">Expected returns</span>
                  <span className="text-slate-900 font-black text-sm">
                    {displayPrice(selectedPlan.return_amount)} ({formatAmount(selectedPlan.return_amount, 0)})
                  </span>
                </div>

                {/* Section Title */}
                <h4 className="text-slate-900 text-xs font-bold uppercase tracking-widest mt-4 block">Payment Details</h4>

                {/* Yellow Card 4: CBE Bank details */}
                <div className="bg-[#fffdf0] border border-amber-200/80 rounded-2xl p-4 shadow-[0_2px_12px_rgba(251,188,5,0.03)] space-y-3">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Payment method</span>
                    <span className="text-slate-900 font-extrabold text-xs block mt-0.5">COMMERCIAL BANK OF ETHIOPIA</span>
                  </div>

                  <div className="border-t border-amber-200/40 pt-2">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Holder account name</span>
                    <span className="text-slate-900 font-extrabold text-xs block mt-0.5">Agent - Geleta Babe Gelan</span>
                  </div>

                  <div className="border-t border-amber-200/40 pt-2 flex justify-between items-end">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Payment account</span>
                      <span className="text-slate-900 font-extrabold text-sm block mt-0.5 font-mono">1000756321424</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('1000756321424');
                        showToast('Bank account number copied!', 'success');
                      }}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 border border-amber-500/25 cursor-pointer"
                    >
                      <ClipboardCheck className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>

                  <div className="border-t border-amber-200/40 pt-2.5">
                    <span className="text-slate-900 font-bold text-[10px] block mb-1">Instructions:</span>
                    <ul className="text-[10px] text-slate-600 list-disc list-inside space-y-0.5 font-medium leading-relaxed">
                      <li>Open your Commercial Bank of Ethiopia (CBE) app</li>
                      <li>Transfer the exact Birr amount <strong className="text-slate-900">({(selectedPlan.amount * 120).toLocaleString()} ETB)</strong> to the account above</li>
                      <li>Take a screenshot of the transaction receipt</li>
                      <li>Upload the screenshot below to initiate verification</li>
                    </ul>
                  </div>
                </div>

                {/* Countdown timer */}
                <div className="text-center py-2.5 bg-red-50 border border-red-100 rounded-2xl">
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider block mb-0.5">TIME REMAINING TO COMPLETE PAYMENT</span>
                  <span className="text-red-600 font-extrabold text-2xl font-mono tracking-tight animate-pulse">
                    {formatCountdown(countdown)}
                  </span>
                </div>

                {/* Proof Upload */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                    Upload Payment Proof <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="border-2 border-dashed border-slate-200 hover:border-amber-300 rounded-2xl p-4 bg-slate-50 transition-colors text-center relative overflow-hidden group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPaymentProof(e.target.files[0]);
                          showToast(`Payment proof file selected: ${e.target.files[0].name}`, 'info');
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    
                    {paymentProof ? (
                      <div className="flex flex-col items-center justify-center space-y-1 z-20 relative">
                        <span className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                          ✓
                        </span>
                        <span className="text-xs font-bold text-slate-800 line-clamp-1">{paymentProof.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{(paymentProof.size / 1024 / 1024).toFixed(2)} MB • Ready to submit</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-1.5 text-slate-500 group-hover:text-slate-800 transition-colors">
                        <div className="text-xs font-bold">
                          <span className="text-amber-600 underline">Choose File</span> or drag and drop
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                          JPG, JPEG, PNG screenshot, or PDF up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2 pt-4">
                  <button
                    onClick={async () => {
                      if (!paymentProof) {
                        showToast('Please upload payment proof screenshot first', 'error');
                        return;
                      }
                      setInvesting(true);
                      try {
                        const screenshotMockUrl = paymentProof
                          ? URL.createObjectURL(paymentProof)
                          : 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60';
                        
                        await onDepositSubmit(
                          selectedPlan.amount,
                          orderId,
                          screenshotMockUrl,
                          undefined,
                          `Direct Investment: ${selectedPlan.id}`
                        );
                        
                        showToast('Direct payment proof submitted successfully! Admin will verify and activate your plan.', 'success');
                        setSelectedPlan(null);
                        setPaymentProof(null);
                      } catch (err: any) {
                        showToast(err.message || 'Verification failed.', 'error');
                      } finally {
                        setInvesting(false);
                      }
                    }}
                    disabled={investing || !paymentProof}
                    className={`w-full py-3.5 text-center text-xs uppercase font-extrabold tracking-wider rounded-xl transition-all ${
                      paymentProof
                        ? 'bg-[#fbbc05] text-slate-950 hover:bg-[#e2a804] active:scale-98 cursor-pointer shadow-md'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-80'
                    }`}
                  >
                    {investing ? (
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin mx-auto" />
                    ) : (
                      'Upload payment proof to continue'
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedPlan(null)}
                    className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer uppercase transition-colors text-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
