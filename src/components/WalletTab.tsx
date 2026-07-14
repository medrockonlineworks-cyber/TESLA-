import React, { useState, useEffect } from 'react';
import { DbUser, Deposit, Withdrawal, Transaction, AgentAccount } from '../types';
import { Wallet, Copy, Upload, ArrowUpRight, ArrowDownLeft, FileText, CheckCircle, Smartphone, Clock, XCircle, Users } from 'lucide-react';
import { dbService } from '../services/db';

interface WalletTabProps {
  user: DbUser;
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  transactions: Transaction[];
  onDepositSubmit: (amount: number, transactionId: string, screenshotUrl: string, agentAccountId?: string, agentAccountInfo?: string) => Promise<void>;
  onWithdrawSubmit: (amount: number, phone: string) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function WalletTab({
  user,
  deposits,
  withdrawals,
  transactions,
  onDepositSubmit,
  onWithdrawSubmit,
  showToast,
}: WalletTabProps) {
  const [subTab, setSubTab] = useState<'recharge' | 'withdraw' | 'ledger'>('recharge');
  
  // Recharge form
  const [depositAmount, setDepositAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [recharging, setRecharging] = useState(false);

  // Active agents state
  const [agents, setAgents] = useState<AgentAccount[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [telebirrPhone, setTelebirrPhone] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Fallback Telebirr Details
  const TELEBIRR_MERCHANT_NAME = "TESLA INVESTMENT LIMITED (HQ)";
  const TELEBIRR_MERCHANT_NUMBER = "809421";

  // Load active agent accounts
  useEffect(() => {
    async function fetchAgents() {
      try {
        const list = await dbService.getAgentAccounts();
        const activeList = list.filter(a => a.is_active);
        setAgents(activeList);
        if (activeList.length > 0) {
          setSelectedAgentId(activeList[0].id);
        }
      } catch (err) {
        console.error('Error fetching agents:', err);
      }
    }
    fetchAgents();
  }, []);

  // Selected agent object lookup
  const currentAgent = agents.find(a => a.id === selectedAgentId);

  // Handle Copy Number
  const handleCopyMerchantNumber = () => {
    const numToCopy = currentAgent ? currentAgent.agent_number : TELEBIRR_MERCHANT_NUMBER;
    navigator.clipboard.writeText(numToCopy);
    showToast(`Agent number (${numToCopy}) copied to clipboard!`, 'success');
  };

  // Handle File Upload and convert to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size must be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotBase64(reader.result as string);
      showToast('Screenshot loaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Please enter a valid deposit amount.', 'error');
      return;
    }
    if (!transactionId.trim()) {
      showToast('Please enter the Telebirr Transaction ID.', 'error');
      return;
    }
    if (!screenshotBase64) {
      showToast('Please upload a screenshot of your Telebirr payment.', 'error');
      return;
    }

    setRecharging(true);
    try {
      // Find selected agent details
      const agent = agents.find(a => a.id === selectedAgentId);
      const agentId = agent?.id;
      const agentInfo = agent ? `${agent.agent_name} (${agent.agent_number})` : `${TELEBIRR_MERCHANT_NAME} (${TELEBIRR_MERCHANT_NUMBER})`;

      await onDepositSubmit(amountNum, transactionId.trim(), screenshotBase64, agentId, agentInfo);
      showToast('Deposit request submitted! Admins will verify it shortly.', 'success');
      setDepositAmount('');
      setTransactionId('');
      setScreenshotBase64('');
    } catch (err: any) {
      showToast(err.message || 'Deposit submission failed.', 'error');
    } finally {
      setRecharging(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Please enter a valid withdrawal amount.', 'error');
      return;
    }
    if (amountNum > user.balance) {
      showToast('Insufficient wallet balance to perform this withdrawal.', 'error');
      return;
    }
    if (!telebirrPhone.trim() || telebirrPhone.trim().length < 9) {
      showToast('Please enter a valid Telebirr phone number.', 'error');
      return;
    }

    setWithdrawing(true);
    try {
      await onWithdrawSubmit(amountNum, telebirrPhone.trim());
      showToast('Withdrawal request submitted! Funds are locked in escrow.', 'success');
      setWithdrawAmount('');
      setTelebirrPhone('');
    } catch (err: any) {
      showToast(err.message || 'Withdrawal submission failed.', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  // Stats summaries
  const totalDepositsApproved = deposits
    .filter((d) => d.status === 'approved')
    .reduce((acc, d) => acc + d.amount, 0);

  const totalWithdrawalsApproved = withdrawals
    .filter((w) => w.status === 'approved')
    .reduce((acc, w) => acc + w.amount, 0);

  return (
    <div className="space-y-6 pb-24 animate-fade-in font-sans">
      {/* Tab Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
          Tesla <span className="text-indigo-600">Wallet</span>
        </h2>
      </div>

      {/* 1. High contrast visual wallet card */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 border border-indigo-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden text-white">
        <div className="absolute top-2 right-2 p-1 text-white bg-indigo-500/40 border border-indigo-400/20 rounded-lg">
          <Wallet className="w-4 h-4" />
        </div>

        <span className="text-[9px] uppercase tracking-widest text-indigo-100 font-mono">Balance</span>
        <div className="text-3xl font-extrabold tracking-tight text-white font-mono mt-1">
          ${user.balance.toFixed(2)}
        </div>

        {/* Detailed subdivision of funds */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-indigo-500/25 text-xs font-mono">
          <div>
            <span className="text-[8px] text-indigo-200 uppercase block">Inflows</span>
            <span className="text-emerald-300 font-bold block mt-0.5 flex items-center gap-0.5">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              ${totalDepositsApproved.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[8px] text-indigo-200 uppercase block">Outflows</span>
            <span className="text-rose-300 font-bold block mt-0.5 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              ${totalWithdrawalsApproved.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Tri-sub-tabs selection */}
      <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 grid grid-cols-3">
        <button
          onClick={() => setSubTab('recharge')}
          className={`py-2 px-1 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
            subTab === 'recharge' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Recharge
        </button>
        <button
          onClick={() => setSubTab('withdraw')}
          className={`py-2 px-1 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
            subTab === 'withdraw' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Withdraw
        </button>
        <button
          onClick={() => setSubTab('ledger')}
          className={`py-2 px-1 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
            subTab === 'ledger' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Ledger
        </button>
      </div>

      {/* 3. RECHARGE VIEW */}
      {subTab === 'recharge' && (
        <form onSubmit={handleDepositSubmit} className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
            {/* Agent Selector */}
            {agents.length > 0 ? (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-mono block">
                  Authorized Agent
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 p-3 rounded-xl outline-none focus:border-indigo-500 font-sans"
                >
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.agent_name} ({ag.agent_number})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            
            {/* Payment Details Box */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-2.5 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase">Agent Name:</span>
                <span className="text-slate-900 font-bold">
                  {currentAgent ? currentAgent.agent_name : TELEBIRR_MERCHANT_NAME}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-2.5">
                <span className="text-slate-500 uppercase">Agent Account:</span>
                <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 border border-slate-200 rounded">
                  <span className="text-emerald-600 font-bold">
                    {currentAgent ? currentAgent.agent_number : TELEBIRR_MERCHANT_NUMBER}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyMerchantNumber}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Amount Field */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Amount (USD)</label>
              <input
                type="number"
                required
                placeholder="Enter amount (e.g. 50)"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm text-slate-900 px-4 py-3 rounded-xl transition-all font-mono"
              />
            </div>

            {/* TxID Field */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Transaction ID</label>
              <input
                type="text"
                required
                placeholder="Enter Transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm text-slate-900 px-4 py-3 rounded-xl transition-all font-mono"
              />
            </div>

            {/* Image Selector */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Receipt Screenshot</label>
              
              <div className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center relative hover:border-indigo-500/40 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {screenshotBase64 ? (
                  <div className="space-y-2 text-center w-full">
                    <img
                      src={screenshotBase64}
                      alt="receipt snippet"
                      referrerPolicy="no-referrer"
                      className="h-28 mx-auto object-cover rounded-lg border border-slate-200"
                    />
                    <p className="text-[10px] text-emerald-600 font-mono">Ready to upload</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-500">Upload Transaction Receipt</span>
                    <span className="text-[9px] text-slate-400 font-mono mt-1">JPEG/PNG, Max 2MB</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={recharging}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-mono font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-indigo-600/15 uppercase"
          >
            {recharging ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Submit Deposit Ticket'
            )}
          </button>
        </form>
      )}

      {/* 4. WITHDRAW VIEW */}
      {subTab === 'withdraw' && (
        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
            {/* Available to withdraw banner */}
            <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/60 rounded-xl font-mono text-xs text-slate-600">
              <span className="text-slate-500">LIQUID CAPITAL:</span>
              <span className="text-emerald-600 font-bold">${user.balance.toFixed(2)}</span>
            </div>

            {/* Withdrawal Amount */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Amount (USD)</label>
              <input
                type="number"
                required
                max={user.balance}
                placeholder="Enter amount to withdraw"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm text-slate-900 px-4 py-3 rounded-xl transition-all font-mono"
              />
            </div>

            {/* Telebirr phone */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Phone Number</label>
              <input
                type="tel"
                required
                placeholder="e.g. 0912345678"
                value={telebirrPhone}
                onChange={(e) => setTelebirrPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm text-slate-900 px-4 py-3 rounded-xl transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={withdrawing || user.balance === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-mono font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-indigo-600/15 uppercase"
          >
            {withdrawing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Submit Withdrawal Request'
            )}
          </button>
        </form>
      )}

      {/* 5. LEDGER / TRANSACTION HISTORY VIEW */}
      {subTab === 'ledger' && (
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-400 uppercase">No history</h4>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isPositive = tx.amount > 0;
                
                return (
                  <div
                    key={tx.id}
                    className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm relative overflow-hidden"
                  >
                    {/* Tiny visual type bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-[2.5px] ${
                        tx.type === 'deposit'
                          ? 'bg-indigo-500'
                          : tx.type === 'withdrawal'
                          ? 'bg-rose-500'
                          : tx.type === 'profit'
                          ? 'bg-emerald-500'
                          : tx.type === 'bonus'
                          ? 'bg-purple-500'
                          : 'bg-slate-400'
                      }`}
                    />

                    <div className="pl-2.5">
                      <span className="text-[8px] text-slate-400 font-mono uppercase tracking-wider block">
                        {tx.type} • {new Date(tx.created_at).toLocaleDateString()}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 mt-0.5 tracking-tight">{tx.description}</h4>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold font-mono ${
                          isPositive ? 'text-emerald-600' : 'text-slate-500'
                        }`}
                      >
                        {isPositive ? '+' : ''}${tx.amount.toFixed(2)}
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono block uppercase">USD</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Special Verification Log showing user's requests */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h4 className="text-xs font-mono uppercase text-slate-400 px-1">Pending Requests</h4>
            
            {/* Deposits Tickets list */}
            {deposits.length > 0 && (
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-slate-400 uppercase block px-1">Deposits</span>
                {deposits.map((dep) => (
                  <div key={dep.id} className="bg-white border border-slate-200 p-3 rounded-xl flex justify-between items-center font-mono text-[10px] shadow-sm">
                    <div>
                      <span className="text-slate-900 font-bold block">Amt: ${dep.amount}</span>
                      <span className="text-slate-500 block text-[9px] mt-0.5">TxID: {dep.transaction_id}</span>
                      {dep.agent_account_info && (
                        <span className="text-slate-400 block text-[8px] mt-0.5 font-sans">
                          Agent: {dep.agent_account_info}
                        </span>
                      )}
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      dep.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : dep.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {dep.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Withdrawals Tickets list */}
            {withdrawals.length > 0 && (
              <div className="space-y-2 mt-4">
                <span className="text-[9px] font-mono text-slate-400 uppercase block px-1">Withdrawals</span>
                {withdrawals.map((wd) => (
                  <div key={wd.id} className="bg-white border border-slate-200 p-3 rounded-xl flex justify-between items-center font-mono text-[10px] shadow-sm">
                    <div>
                      <span className="text-slate-900 font-bold block">Amt: ${wd.amount}</span>
                      <span className="text-slate-500 block text-[9px] mt-0.5">Tel: {wd.telebirr_number}</span>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      wd.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : wd.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {wd.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
