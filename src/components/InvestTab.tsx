import { useState, useEffect } from 'react';
import { Investment } from '../types';
import { Zap, Clock, ShieldCheck, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

interface InvestTabProps {
  investments: Investment[];
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  currency: 'USD' | 'ETB';
  formatAmount: (usdValue: number, fractionDigits?: number) => string;
}

export default function InvestTab({
  investments,
  onRefresh,
  showToast,
  currency,
  formatAmount,
}: InvestTabProps) {
  const [filter, setFilter] = useState<'active' | 'completed'>('active');
  const [, setTicker] = useState(0); // Forces re-render every second for countdown sync

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredInvestments = investments.filter((i) => i.status === filter);

  // Helper to format remaining time
  const getRemainingTime = (endTimeStr: string) => {
    const end = new Date(endTimeStr).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) {
      return { expired: true, text: '00:00:00', percent: 100 };
    }

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    const pad = (num: number) => num.toString().padStart(2, '0');
    
    return {
      expired: false,
      text: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
      percent: Math.max(0, Math.min(100, 100 - (diff / (24 * 3600000)) * 100)), // assuming 24h duration
    };
  };

  const handleManualCheck = async () => {
    await onRefresh();
    showToast('Contract ledger synchronized.', 'info');
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in font-sans">
      {/* Tab Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
            Investment <span className="text-amber-600 font-extrabold">Stakes</span>
          </h2>
        </div>
        <button
          onClick={handleManualCheck}
          className="p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-slate-500 hover:text-amber-600 transition-colors cursor-pointer shadow-sm"
          title="Force-Sync Contracts"
        >
          <Activity className="w-4 h-4 animate-pulse" />
        </button>
      </div>

      {/* Filter Switches */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 grid grid-cols-2">
        <button
          onClick={() => setFilter('active')}
          className={`py-2 px-4 rounded-xl font-sans text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
            filter === 'active'
              ? 'bg-[#fbbc05] text-slate-950 shadow-md'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Contracts ({investments.filter((i) => i.status === 'active').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`py-2 px-4 rounded-xl font-sans text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
            filter === 'completed'
              ? 'bg-[#fbbc05] text-slate-950 shadow-md'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Historic Stakes ({investments.filter((i) => i.status === 'completed').length})
        </button>
      </div>

      {/* Main List */}
      {filteredInvestments.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-sm">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3 animate-pulse" />
          <h4 className="text-sm font-extrabold text-slate-800">No {filter} contracts found</h4>
          <p className="text-[11px] text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
            {filter === 'active'
              ? 'Navigate to the Home tab to lock in a new guaranteed investment plan!'
              : 'Once your active clean energy contracts finish their cycles, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvestments.map((inv) => {
            const timeData = getRemainingTime(inv.end_time);

            return (
              <div
                key={inv.id}
                className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm relative overflow-hidden"
              >
                {/* Glowing status line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[2px] ${
                    inv.status === 'active' ? 'bg-[#fbbc05]' : 'bg-emerald-500'
                  }`}
                />

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                      Staking Contract
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 tracking-tight mt-1">
                      {inv.plan_name || 'Tesla Standard Plan'}
                    </h4>
                  </div>
                  <div
                    className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                      inv.status === 'active'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-700'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700'
                    }`}
                  >
                    {inv.status === 'active' ? (
                      <>
                        <Zap className="w-3 h-3 text-[#fbbc05] animate-spin" />
                        STAKED
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        RELEASED
                      </>
                    )}
                  </div>
                </div>

                {/* Contract Detail Panel */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-3 mt-4">
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-bold block">Capital Input</span>
                    <span className="text-sm font-black text-slate-800 font-mono block mt-0.5">{formatAmount(inv.amount, 2)}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-bold block">
                      {inv.status === 'active' ? 'Expected Earnings' : 'Released Earnings'}
                    </span>
                    <span className="text-sm font-black text-emerald-700 font-mono block mt-0.5">
                      {formatAmount(inv.expected_return, 2)}
                    </span>
                  </div>
                </div>

                {/* COUNTDOWN OR REWARD METRIC */}
                {inv.status === 'active' ? (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 text-[10px] uppercase flex items-center gap-1 font-bold">
                        <Clock className="w-3 h-3 text-amber-500" />
                        Maturing In
                      </span>
                      <span className="text-amber-700 font-mono font-bold tracking-widest bg-amber-500/10 px-2 py-0.5 border border-amber-500/20 rounded-md">
                        {timeData.text}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full border border-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-[#fbbc05] transition-all duration-1000"
                        style={{ width: `${timeData.percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-400 font-mono font-bold">
                      <span>Started: {new Date(inv.start_time).toLocaleTimeString()}</span>
                      <span>Matures: {new Date(inv.end_time).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-700 text-[10px] font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      GUARANTEED SETTLED
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">
                      Released: {new Date(inv.end_time).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
