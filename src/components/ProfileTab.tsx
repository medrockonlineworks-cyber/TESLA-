import { DbUser, Investment } from '../types';
import { User, Mail, Calendar, ShieldCheck, LogOut, ArrowRight, TrendingUp, ShieldAlert } from 'lucide-react';

interface ProfileTabProps {
  user: DbUser;
  investments: Investment[];
  onLogout: () => void;
  onOpenAdmin: () => void;
  currency: 'USD' | 'ETB';
  formatAmount: (usdValue: number, fractionDigits?: number) => string;
}

export default function ProfileTab({
  user,
  investments,
  onLogout,
  onOpenAdmin,
  currency,
  formatAmount,
}: ProfileTabProps) {
  const activeStakes = investments.filter((i) => i.status === 'active');
  const completedStakes = investments.filter((i) => i.status === 'completed');

  return (
    <div className="space-y-6 pb-24 animate-fade-in font-sans">
      {/* Tab Title */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
          Tesla <span className="text-amber-600 font-extrabold">Identity</span>
        </h2>
      </div>

      {/* 1. Profile Core Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 font-black text-xl font-mono shrink-0">
          {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'T'}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{user.full_name}</h3>
            {user.is_admin && (
              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase">
                ADMIN
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">{user.email}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono font-bold">
            <Calendar className="w-3 h-3" />
            <span>Registered: {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* 2. Personal Stakes Summary Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 font-mono shadow-sm">
          <span className="text-[8px] text-slate-400 uppercase block font-sans font-bold">Active Contracts</span>
          <span className="text-lg font-black text-amber-600 block mt-1">{activeStakes.length}</span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 font-mono shadow-sm">
          <span className="text-[8px] text-slate-400 uppercase block font-sans font-bold">Settled Contracts</span>
          <span className="text-lg font-black text-emerald-600 block mt-1">{completedStakes.length}</span>
        </div>
      </div>

      {/* 3. Account Settings & Operations */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 space-y-3 shadow-sm">
        <h4 className="text-[10px] uppercase tracking-wider text-slate-400 mb-2 px-1 font-bold">
          System Options
        </h4>

        {/* Admin Dashboard Entry */}
        {user.is_admin && (
          <button
            onClick={onOpenAdmin}
            className="w-full flex items-center justify-between p-3.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-850 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>LAUNCH ADMIN TERMINAL</span>
            </div>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span className="font-bold">Total Staking Capital</span>
          </div>
          <span className="text-slate-800 font-extrabold font-mono">
            {formatAmount(investments.reduce((acc, i) => acc + i.amount, 0), 0)}
          </span>
        </div>
      </div>

      {/* 4. Logout Operations */}
      <button
        onClick={onLogout}
        className="w-full bg-white hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 text-slate-500 font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 uppercase shadow-sm"
      >
        <LogOut className="w-4 h-4" />
        Log Out
      </button>
    </div>
  );
}
