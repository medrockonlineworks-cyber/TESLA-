import React, { useState, useEffect } from 'react';
import { DbUser, Deposit, Withdrawal, Investment, InvestmentPlan, Transaction, AgentAccount } from '../types';
import { dbService } from '../services/db';
import { Shield, Users, ArrowUpRight, ArrowDownLeft, Megaphone, FileText, Settings, X, Check, Trash, Plus, Eye, Key, Smartphone, ToggleLeft, ToggleRight, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
  users: DbUser[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  investments: Investment[];
  plans: InvestmentPlan[];
  transactions: Transaction[];
  onRefreshData: () => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type AdminSubTab = 'recharges' | 'withdrawals' | 'users' | 'plans' | 'announcements' | 'investments' | 'agents' | 'reports';

export default function AdminPanel({
  onClose,
  users,
  deposits,
  withdrawals,
  investments,
  plans,
  transactions,
  onRefreshData,
  showToast,
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('recharges');
  const [processing, setProcessing] = useState<string | null>(null);

  // New Announcement form state
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnMessage, setNewAnnMessage] = useState('');
  const [publishingAnn, setPublishingAnn] = useState(false);

  // New/Edit Plan form state
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [planAmount, setPlanAmount] = useState('');
  const [planReturnAmount, setPlanReturnAmount] = useState('');
  const [planDuration, setPlanDuration] = useState('24');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  // View receipt modal state
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  // Telebirr Agent Accounts State
  const [agents, setAgents] = useState<AgentAccount[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentNumber, setNewAgentNumber] = useState('');
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const list = await dbService.getAgentAccounts();
      setAgents(list);
    } catch (err) {
      console.error('Failed to load agents', err);
    } finally {
      setLoadingAgents(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // AGENT ACCOUNT ACTION HANDLERS
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentNumber.trim()) {
      showToast('Please fill out all Agent Account details.', 'error');
      return;
    }

    try {
      await dbService.createAgentAccount({
        agent_name: newAgentName.trim(),
        agent_number: newAgentNumber.trim(),
        is_active: true
      });
      showToast('Authorized Telebirr agent account created!', 'success');
      setNewAgentName('');
      setNewAgentNumber('');
      setIsCreatingAgent(false);
      await fetchAgents();
    } catch (err: any) {
      showToast(err.message || 'Failed to create agent account.', 'error');
    }
  };

  const handleToggleAgentStatus = async (agentId: string, currentStatus: boolean) => {
    try {
      await dbService.updateAgentAccount(agentId, { is_active: !currentStatus });
      showToast('Agent account status updated successfully.', 'success');
      await fetchAgents();
    } catch (err: any) {
      showToast(err.message || 'Failed to update agent status.', 'error');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!window.confirm('Are you sure you want to remove this Telebirr agent account?')) return;
    try {
      await dbService.deleteAgentAccount(agentId);
      showToast('Agent account removed successfully.', 'info');
      await fetchAgents();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete agent account.', 'error');
    }
  };

  // ACTIONS
  const handleApproveDeposit = async (depId: string) => {
    setProcessing(depId);
    try {
      await dbService.updateDepositStatus(depId, 'approved');
      showToast('Deposit ticket cleared successfully!', 'success');
      await onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Verification failed.', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectDeposit = async (depId: string) => {
    setProcessing(depId);
    try {
      await dbService.updateDepositStatus(depId, 'rejected');
      showToast('Deposit ticket rejected successfully.', 'info');
      await onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveWithdrawal = async (wdId: string) => {
    setProcessing(wdId);
    try {
      await dbService.updateWithdrawalStatus(wdId, 'approved');
      showToast('Withdrawal payout completed!', 'success');
      await onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectWithdrawal = async (wdId: string) => {
    setProcessing(wdId);
    try {
      await dbService.updateWithdrawalStatus(wdId, 'rejected');
      showToast('Withdrawal request rejected. Funds refunded to user balance.', 'info');
      await onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnMessage.trim()) {
      showToast('Please fill out all announcement fields.', 'error');
      return;
    }

    setPublishingAnn(true);
    try {
      await dbService.createAnnouncement(newAnnTitle.trim(), newAnnMessage.trim());
      showToast('Global announcement broadcasted successfully!', 'success');
      setNewAnnTitle('');
      setNewAnnMessage('');
      await onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to broadcast announcement.', 'error');
    } finally {
      setPublishingAnn(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(planAmount);
    const returnNum = parseFloat(planReturnAmount);
    const durationNum = parseInt(planDuration);

    if (!planName.trim() || isNaN(amountNum) || isNaN(returnNum) || isNaN(durationNum)) {
      showToast('Please enter valid plan credentials.', 'error');
      return;
    }

    try {
      if (isCreatingPlan) {
        await dbService.createPlan({
          name: planName.trim(),
          amount: amountNum,
          return_amount: returnNum,
          duration_hours: durationNum,
          status: 'active'
        });
        showToast('New clean energy investment plan launched!', 'success');
      } else if (editingPlanId) {
        await dbService.updatePlan(editingPlanId, {
          name: planName.trim(),
          amount: amountNum,
          return_amount: returnNum,
          duration_hours: durationNum
        });
        showToast('Staking contract modified successfully.', 'success');
      }

      setPlanName('');
      setPlanAmount('');
      setPlanReturnAmount('');
      setPlanDuration('24');
      setEditingPlanId(null);
      setIsCreatingPlan(false);
      await onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Plan update failed.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white z-50 overflow-y-auto px-4 py-6 font-sans">
      {/* Header section */}
      <div className="max-w-md mx-auto flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#fbbc05]" />
          <h1 className="text-sm font-bold font-mono tracking-wider text-zinc-100 uppercase">Admin Console</h1>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 bg-zinc-950 border border-zinc-800 hover:border-[#fbbc05] rounded-full text-zinc-400 hover:text-zinc-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* Horizontal Navigation List */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none font-mono">
          {[
            { id: 'recharges', label: 'Recharges', icon: ArrowDownLeft },
            { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'plans', label: 'Plans', icon: Settings },
            { id: 'announcements', label: 'Broadcast', icon: Megaphone },
            { id: 'investments', label: 'Stakes', icon: FileText },
            { id: 'agents', label: 'Agents', icon: Smartphone },
            { id: 'reports', label: 'Reports', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id as AdminSubTab);
                  setEditingPlanId(null);
                  setIsCreatingPlan(false);
                }}
                className={`py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#fbbc05] border-[#fbbc05] text-slate-950 shadow-md shadow-[#fbbc05]/10 font-extrabold'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* SUB TAB CONTROLS */}

        {/* 1. RECHARGES MANAGEMENT */}
        {activeSubTab === 'recharges' && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Pending Recharge Clearances</h3>

            {deposits.filter((d) => d.status === 'pending').length === 0 ? (
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 text-center text-zinc-500 text-xs font-mono">
                ✅ No pending recharge tickets in ledger.
              </div>
            ) : (
              <div className="space-y-4">
                {deposits
                  .filter((d) => d.status === 'pending')
                  .map((dep) => (
                    <div
                      key={dep.id}
                      className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-red-500 font-mono font-bold block uppercase">
                            User ID: {dep.user_name || dep.user_id.substring(0, 8)}
                          </span>
                          <span className="text-[8px] text-zinc-500 font-mono">
                            Submitted: {new Date(dep.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold font-mono text-green-500">${dep.amount}</span>
                          <span className="text-[8px] text-zinc-600 font-mono block">USD</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-black/60 border border-zinc-900 p-2.5 rounded-xl text-[10px] font-mono">
                        <div>
                          <span className="text-zinc-500 uppercase block">Telebirr TxID:</span>
                          <span className="text-white font-bold">{dep.transaction_id}</span>
                        </div>
                        
                        {/* Eye-trigger to check screenshot snippet */}
                        {dep.screenshot_url && (
                          <button
                            onClick={() => setViewingReceiptUrl(dep.screenshot_url)}
                            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </div>

                      {/* Control buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => handleRejectDeposit(dep.id)}
                          disabled={processing === dep.id}
                          className="py-2 bg-zinc-950 hover:bg-red-950/20 text-red-500 border border-zinc-800 hover:border-red-900/40 font-mono text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => handleApproveDeposit(dep.id)}
                          disabled={processing === dep.id}
                          className="py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-mono text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-lg shadow-green-600/10"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* 2. WITHDRAWALS MANAGEMENT */}
        {activeSubTab === 'withdrawals' && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Pending Withdrawal Payouts</h3>

            {withdrawals.filter((w) => w.status === 'pending').length === 0 ? (
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 text-center text-zinc-500 text-xs font-mono">
                ✅ No pending withdrawal requests in ledger.
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawals
                  .filter((w) => w.status === 'pending')
                  .map((wd) => (
                    <div
                      key={wd.id}
                      className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-red-500 font-mono font-bold block uppercase">
                            User: {wd.user_name || wd.user_id.substring(0, 8)}
                          </span>
                          <span className="text-[8px] text-zinc-500 font-mono">
                            Requested: {new Date(wd.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold font-mono text-white">${wd.amount}</span>
                          <span className="text-[8px] text-zinc-600 font-mono block">USD</span>
                        </div>
                      </div>

                      <div className="bg-black/60 border border-zinc-900 p-2.5 rounded-xl text-[10px] font-mono">
                        <span className="text-zinc-500 uppercase block">CBE Payout Destination Details:</span>
                        <span className="text-green-500 font-bold block mt-0.5 text-xs">{wd.telebirr_number}</span>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => handleRejectWithdrawal(wd.id)}
                          disabled={processing === wd.id}
                          className="py-2 bg-zinc-950 hover:bg-red-950/20 text-red-500 border border-zinc-800 hover:border-red-900/40 font-mono text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject & Refund
                        </button>
                        <button
                          onClick={() => handleApproveWithdrawal(wd.id)}
                          disabled={processing === wd.id}
                          className="py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-mono text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-lg shadow-green-600/10"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve Payout
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* 3. USERS AUDITING */}
        {activeSubTab === 'users' && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">System Registered Members</h3>

            <div className="space-y-3">
              {users.map((usr) => (
                <div
                  key={usr.id}
                  className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 font-mono text-xs relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">{usr.full_name}</h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{usr.email}</p>
                    </div>
                    <span className="text-[8px] text-zinc-500 uppercase block">
                      ID: {usr.id.substring(0, 8)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-black/40 border border-zinc-900 rounded-xl p-3 mt-3">
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase">Available Cash</span>
                      <span className="text-sm font-bold text-green-500 block mt-0.5">${usr.balance.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase">Settled profits</span>
                      <span className="text-sm font-bold text-white block mt-0.5">${usr.total_profit.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-[8px] text-zinc-600 mt-2.5">
                    <span>Joined: {new Date(usr.created_at).toLocaleDateString()}</span>
                    {usr.is_admin ? <span className="text-red-500 uppercase font-bold">ADMIN ACCOUNT</span> : <span className="text-zinc-500 uppercase font-bold">MEMBER</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. PLANS CUSTOMIZER */}
        {activeSubTab === 'plans' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Configure Energy Pools</h3>
              <button
                onClick={() => {
                  setIsCreatingPlan(true);
                  setEditingPlanId(null);
                  setPlanName('');
                  setPlanAmount('');
                  setPlanReturnAmount('');
                  setPlanDuration('24');
                }}
                className="py-1 px-2.5 bg-red-600 hover:bg-red-700 text-white text-[9px] font-mono font-bold uppercase rounded flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Project
              </button>
            </div>

            {/* Editing / Creating Form Container */}
            {(isCreatingPlan || editingPlanId) && (
              <form onSubmit={handleSavePlan} className="bg-zinc-900 border border-red-600/30 rounded-2xl p-4 space-y-4 relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingPlan(false);
                    setEditingPlanId(null);
                  }}
                  className="absolute top-2 right-2 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  {isCreatingPlan ? '⚡ Create New Tesla Pool' : '🛠️ Modify Staking Plan'}
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[8px] text-zinc-400 uppercase">Project Display Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Model Y Long Range"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      className="w-full bg-black border border-zinc-800 text-white p-2.5 rounded-lg outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] text-zinc-400 uppercase">Capital Amount ($)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 100"
                      value={planAmount}
                      onChange={(e) => setPlanAmount(e.target.value)}
                      className="w-full bg-black border border-zinc-800 text-white p-2.5 rounded-lg outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] text-zinc-400 uppercase">Return Payout ($)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 130"
                      value={planReturnAmount}
                      onChange={(e) => setPlanReturnAmount(e.target.value)}
                      className="w-full bg-black border border-zinc-800 text-white p-2.5 rounded-lg outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="text-[8px] text-zinc-400 uppercase">Cycle Duration (Hours)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 24"
                      value={planDuration}
                      onChange={(e) => setPlanDuration(e.target.value)}
                      className="w-full bg-black border border-zinc-800 text-white p-2.5 rounded-lg outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-mono text-[10px] font-bold uppercase py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Save Contract Specifications
                </button>
              </form>
            )}

            {/* Plans List */}
            <div className="space-y-3">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex justify-between items-center font-mono text-xs"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight font-sans">{p.name}</h4>
                    <span className="text-[8px] text-zinc-500 mt-1 block">
                      Amount: ${p.amount} | Return: ${p.return_amount} | {p.duration_hours} Hrs
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingPlanId(p.id);
                        setIsCreatingPlan(false);
                        setPlanName(p.name);
                        setPlanAmount(p.amount.toString());
                        setPlanReturnAmount(p.return_amount.toString());
                        setPlanDuration(p.duration_hours.toString());
                      }}
                      className="py-1 px-2.5 bg-zinc-900 border border-zinc-800 hover:border-red-600/30 text-zinc-300 hover:text-white text-[9px] rounded-lg cursor-pointer uppercase font-bold"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. BROADCAST/ANNOUNCEMENTS */}
        {activeSubTab === 'announcements' && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Send Global Bulletins</h3>

            <form onSubmit={handlePublishAnnouncement} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-mono">Bulletin Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 🚀 SYSTEM ENHANCEMENTS COMPLETED"
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  className="w-full bg-black border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-xs text-white px-3 py-2.5 rounded-lg transition-all font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-mono">Message Text</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter detailed message description..."
                  value={newAnnMessage}
                  onChange={(e) => setNewAnnMessage(e.target.value)}
                  className="w-full bg-black border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-xs text-white px-3 py-2.5 rounded-lg transition-all font-sans resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={publishingAnn}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-[10px] uppercase py-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-lg"
              >
                {publishingAnn ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Transmit Worldwide Broadcast'
                )}
              </button>
            </form>
          </div>
        )}

        {/* 6. INVESTMENTS AUDIT STATEMENT */}
        {activeSubTab === 'investments' && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Active Investment Pool Ledger</h3>

            <div className="space-y-3">
              {investments.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 font-mono text-xs relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white">{inv.plan_name}</h4>
                      <p className="text-[9px] text-zinc-500 mt-0.5 uppercase">User ID: {inv.user_id.substring(0, 8)}</p>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        inv.status === 'active' ? 'bg-orange-950/40 text-orange-500' : 'bg-green-950/40 text-green-500'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-black/60 border border-zinc-900 p-2.5 rounded-xl mt-3 text-[10px]">
                    <div>
                      <span className="text-zinc-500 uppercase">PRINCIPAL:</span>
                      <span className="text-white font-bold block mt-0.5">${inv.amount}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 uppercase">EXPECTED RET:</span>
                      <span className="text-green-500 font-bold block mt-0.5">${inv.expected_return}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-[8px] text-zinc-600 mt-2.5">
                    <span>Starts: {new Date(inv.start_time).toLocaleTimeString()}</span>
                    <span>Expires: {new Date(inv.end_time).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. AGENTS MANAGEMENT */}
        {activeSubTab === 'agents' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Authorized Agent Accounts</h3>
              <button
                onClick={() => setIsCreatingAgent(!isCreatingAgent)}
                className="py-1 px-2 bg-red-600 hover:bg-red-700 text-white rounded font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                {isCreatingAgent ? 'Cancel' : 'Add Agent'}
              </button>
            </div>

            {isCreatingAgent && (
              <form onSubmit={handleCreateAgent} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="bg-red-950/10 border border-red-950/30 p-2.5 rounded-lg text-[9px] text-zinc-400 font-sans leading-normal">
                  💡 <span className="font-bold text-white uppercase">Pro Tip:</span> Include the word <strong className="text-white">"Awash"</strong> in the Agent Name to register them as an Awash Bank Agent. Otherwise, they will be classified as a Telebirr Agent.
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-mono">Agent/Beneficiary Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Awash Agent - Abel Kebede"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    className="w-full bg-black border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-xs text-white px-3 py-2 rounded-lg transition-all font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-mono">Agent Account/Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +251911000000 or 0911000000"
                    value={newAgentNumber}
                    onChange={(e) => setNewAgentNumber(e.target.value)}
                    className="w-full bg-black border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-xs text-white px-3 py-2 rounded-lg transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-[10px] uppercase py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Create Agent Account
                </button>
              </form>
            )}

            {loadingAgents ? (
              <div className="text-center py-6">
                <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : agents.length === 0 ? (
              <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-2xl p-6 text-center text-xs font-mono text-zinc-500">
                NO AUTHORIZED AGENT ACCOUNTS FOUND. PLATFORM WILL FALL BACK TO SYSTEM DEFAULT.
              </div>
            ) : (
              <div className="space-y-2">
                {agents.map((ag) => (
                  <div key={ag.id} className="bg-zinc-900/40 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between font-mono text-xs">
                    <div>
                      <h4 className="text-white font-bold">{ag.agent_name}</h4>
                      <p className="text-[10px] text-green-500 font-bold mt-1">{ag.agent_number}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAgentStatus(ag.id, ag.is_active)}
                        className={`p-1.5 rounded transition-all cursor-pointer ${
                          ag.is_active 
                            ? 'text-green-500 hover:text-green-400' 
                            : 'text-zinc-500 hover:text-zinc-400'
                        }`}
                        title={ag.is_active ? 'Active (Click to Deactivate)' : 'Inactive (Click to Activate)'}
                      >
                        {ag.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAgent(ag.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete Agent Account"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. REPORTS & ANALYTICS */}
        {activeSubTab === 'reports' && (() => {
          const totalUsers = users.length;
          const totalApprovedDeposits = deposits
            .filter(d => d.status === 'approved')
            .reduce((acc, d) => acc + d.amount, 0);
          const totalApprovedWithdrawals = withdrawals
            .filter(w => w.status === 'approved')
            .reduce((acc, w) => acc + w.amount, 0);
          const activeInvAmt = investments
            .filter(i => i.status === 'active')
            .reduce((acc, i) => acc + i.amount, 0);
          const activeExpectedPayout = investments
            .filter(i => i.status === 'active')
            .reduce((acc, i) => acc + i.expected_return, 0);
          const totalCompletedAmt = investments
            .filter(i => i.status === 'completed')
            .reduce((acc, i) => acc + i.amount, 0);
          const corporateReserve = totalApprovedDeposits - totalApprovedWithdrawals;

          return (
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Corporate Investment Reports</h3>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="bg-zinc-900/40 border border-zinc-800 p-3.5 rounded-2xl">
                  <span className="text-[8px] text-zinc-500 uppercase">ACTIVE TRADERS:</span>
                  <span className="text-base text-white font-bold block mt-1">{totalUsers}</span>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 p-3.5 rounded-2xl">
                  <span className="text-[8px] text-zinc-500 uppercase">RESERVE LIQUIDITY:</span>
                  <span className={`text-base font-bold block mt-1 ${corporateReserve >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${corporateReserve.toFixed(2)}
                  </span>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 p-3.5 rounded-2xl">
                  <span className="text-[8px] text-zinc-500 uppercase">TOTAL DEPOSITED:</span>
                  <span className="text-base text-blue-500 font-bold block mt-1">${totalApprovedDeposits.toFixed(2)}</span>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 p-3.5 rounded-2xl">
                  <span className="text-[8px] text-zinc-500 uppercase">TOTAL WITHDRAWN:</span>
                  <span className="text-base text-red-500 font-bold block mt-1">${totalApprovedWithdrawals.toFixed(2)}</span>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 p-3.5 rounded-2xl col-span-2">
                  <span className="text-[8px] text-zinc-500 uppercase">CAPITAL UNDER MANAGEMENT (STAKED):</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg text-orange-500 font-bold">${activeInvAmt.toFixed(2)}</span>
                    <span className="text-[9px] text-zinc-500 uppercase font-sans">EXPT. RETURN: ${activeExpectedPayout.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Performance Indicator Card */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-3 font-mono">
                <h4 className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  Forex Trading Efficiency Indicator
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2.5 bg-zinc-900/50 rounded-xl font-sans">
                    <span className="text-zinc-500 block">COMPLETED CYCLES:</span>
                    <span className="text-white font-mono font-bold block mt-0.5">{investments.filter(i => i.status === 'completed').length} plans</span>
                  </div>
                  <div className="p-2.5 bg-zinc-900/50 rounded-xl font-sans">
                    <span className="text-zinc-500 block">TOTAL VOLUME TRADED:</span>
                    <span className="text-white font-mono font-bold block mt-0.5">${(totalApprovedDeposits + totalCompletedAmt).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="p-3 bg-red-950/10 border border-red-950/30 rounded-xl text-[10px] text-zinc-400 leading-normal flex gap-2 font-sans">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>
                    Ensure managed agent accounts hold appropriate ETB liquidity matching these figures for rapid physical-to-digital settlements.
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 7. FULL-SCREEN IMAGE RECEIPT MODAL */}
      {viewingReceiptUrl && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col justify-center items-center p-6">
          <button
            onClick={() => setViewingReceiptUrl(null)}
            className="absolute top-6 right-6 p-2 bg-zinc-900 border border-zinc-800 text-white rounded-full cursor-pointer hover:border-red-600"
          >
            <X className="w-5 h-5" />
          </button>
          
          <img
            src={viewingReceiptUrl}
            alt="Submitted Payment Screenshot"
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[80vh] object-contain rounded-xl border border-zinc-800 shadow-2xl"
          />
          <p className="text-xs font-mono text-zinc-400 mt-4 uppercase">Submitted Transaction Screenshot</p>
        </div>
      )}
    </div>
  );
}
