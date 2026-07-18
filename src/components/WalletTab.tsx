import React, { useState, useEffect } from 'react';
import { DbUser, Deposit, Withdrawal, Transaction, AgentAccount } from '../types';
import { Wallet, Copy, Upload, ArrowUpRight, ArrowDownLeft, FileText, Smartphone, Landmark, HelpCircle, Key, Check, RefreshCw } from 'lucide-react';
import { dbService } from '../services/db';

interface WalletTabProps {
  user: DbUser;
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  transactions: Transaction[];
  onDepositSubmit: (amount: number, transactionId: string, screenshotUrl: string, agentAccountId?: string, agentAccountInfo?: string) => Promise<void>;
  onWithdrawSubmit: (amount: number, phone: string) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  currency: 'USD' | 'ETB';
  formatAmount: (usdValue: number, fractionDigits?: number) => string;
  lang: 'en' | 'am';
  onRefresh?: () => Promise<void>;
}

export default function WalletTab({
  user,
  deposits,
  withdrawals,
  transactions,
  onDepositSubmit,
  onWithdrawSubmit,
  showToast,
  currency,
  formatAmount,
  lang,
  onRefresh,
}: WalletTabProps) {
  const [subTab, setSubTab] = useState<'recharge' | 'withdraw' | 'ledger'>('recharge');
  
  // Recharge states
  const [depositMode, setDepositMode] = useState<'agent' | 'offline_code'>('agent');
  const [withdrawMode, setWithdrawMode] = useState<'agent' | 'offline_code'>('agent');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Recharge form
  const [depositAmount, setDepositAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [agentType, setAgentType] = useState<'telebirr' | 'awash'>('telebirr');

  // Active agents state
  const [agents, setAgents] = useState<AgentAccount[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [cbeAccount, setCbeAccount] = useState('');
  const [cbeHolderName, setCbeHolderName] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Fallback Telebirr Details
  const TELEBIRR_MERCHANT_NAME = "TESLA INVESTMENT LIMITED (HQ)";
  const TELEBIRR_MERCHANT_NUMBER = "0926193920";

  // Translation dictionary for Wallet Tab
  const t = {
    en: {
      title: "Tesla",
      subTitle: "Wallet",
      balance: "Balance",
      inflows: "Inflows",
      outflows: "Outflows",
      recharge: "Recharge",
      withdraw: "Withdraw",
      ledger: "Ledger",
      guideTitle: "How Agent Recharge Works",
      guide1: "Choose your preferred agent network: Telebirr Agent or Awash Bank Agent.",
      guide2: "Transfer money to the authorized agent's number listed below.",
      guide3: "Input the exact deposit value in USD (which computes to the equivalent ETB amount automatically).",
      guide4: "Enter your unique transaction reference ID (TxID) and upload a screenshot of your successful transaction receipt.",
      guide5: "Submit your deposit ticket. Our system administrators will verify the payment and credit your balance within 10-15 minutes!",
      selectNetwork: "Select Agent Network",
      telebirrAgent: "Telebirr Agent",
      awashAgent: "Awash Agent",
      authorizedAgent: "Authorized Agent",
      noActiveAgents: "No active agents configured yet.",
      agentName: "Agent Name:",
      agentAccount: "Agent Account / Number:",
      amountUsd: "Amount (USD)",
      amountPlaceholder: "Enter amount (e.g. 50)",
      equivalentEtb: "Equivalent ETB",
      rateText: "Rate: 1 USD = 120 ETB",
      txidLabel: "Transaction ID (TxID)",
      txidPlaceholder: "Enter Transaction ID",
      receiptLabel: "Receipt Screenshot",
      readyUpload: "Ready to upload",
      uploadPrompt: "Upload Transaction Receipt",
      uploadMeta: "JPEG/PNG, Max 2MB",
      submitTicket: "Submit Deposit Ticket",
      submitting: "Submitting...",
      liquidCapital: "CBE LIQUID CAPITAL:",
      withdrawAmountLabel: "Amount (USD)",
      withdrawPlaceholder: "Enter amount to withdraw",
      cbeAccountLabel: "CBE Bank Account Number",
      cbeAccountPlaceholder: "e.g. 1000123456789",
      holderNameLabel: "Account Holder Full Name",
      holderNamePlaceholder: "Name registered on bank account",
      withdrawNotice: "Double check your CBE account details. Withdrawals to incorrect account numbers cannot be reversed once approved by the administrators.",
      submitWithdraw: "Submit Withdrawal Request",
      noHistory: "No history",
      pendingRequests: "Pending Requests",
      depositsLabel: "Deposits",
      withdrawalsLabel: "Withdrawals"
    },
    am: {
      title: "ቴስላ",
      subTitle: "ዋሌት",
      balance: "ቀሪ ሂሳብ",
      inflows: "ገቢዎች",
      outflows: "ወጪዎች",
      recharge: "ገንዘብ አስገባ",
      withdraw: "ገንዘብ አውጣ",
      ledger: "ግብይቶች",
      guideTitle: "የወኪል ተቀማጭ እንዴት ይሰራል?",
      guide1: "የመረጡትን የወኪል አውታር ይምረጡ: ቴሌብር ወኪል ወይም አዋሽ ባንክ ወኪል::",
      guide2: "ከታች ባለው በተፈቀደው የወኪል ቁጥር ላይ ገንዘቡን ያስተላልፉ::",
      guide3: "ትክክለኛውን የተቀማጭ መጠን በUSD ያስገቡ (በራስ-ሰር ተመጣጣኝ የብር መጠን ያሰላል)::",
      guide4: "የግብይት መለያ ቁጥር (TxID) ያስገቡ እና የደረሰኝ ፎቶ ያያይዙ::",
      guide5: "የተቀማጭ ወረቀቱን ያስገቡ:: አስተዳዳሪዎች ክፍያውን አረጋግጠው በ10-15 ደቂቃዎች ውስጥ ወደ ሂሳብዎ ያስገባሉ!",
      selectNetwork: "የወኪል አውታር ይምረጡ",
      telebirrAgent: "ቴሌብር ወኪል",
      awashAgent: "አዋሽ ባንክ ወኪል",
      authorizedAgent: "የተፈቀደ ወኪል",
      noActiveAgents: "ምንም ገባሪ ወኪል አልተገኘም::",
      agentName: "የወኪል ስም:",
      agentAccount: "የወኪል ሂሳብ / ስልክ ቁጥር:",
      amountUsd: "መጠን (በዶላር)",
      amountPlaceholder: "መጠን ያስገቡ (ለምሳሌ 50)",
      equivalentEtb: "ተመጣጣኝ የኢትዮጵያ ብር",
      rateText: "ተመን: 1 USD = 120 ETB",
      txidLabel: "የማስተላለፊያ መለያ (TxID)",
      txidPlaceholder: "የማስተላለፊያ መለያ ቁጥር ያስገቡ",
      receiptLabel: "የደረሰኝ ፎቶ",
      readyUpload: "ለመጫን ዝግጁ ነው",
      uploadPrompt: "የማስተላለፊያ ደረሰኝ ይጫኑ",
      uploadMeta: "JPEG/PNG, ቢበዛ 2MB",
      submitTicket: "የተቀማጭ ወረቀቱን ያስገቡ",
      submitting: "በማስገባት ላይ...",
      liquidCapital: "ያለዎት ተንቀሳቃሽ ካፒታል:",
      withdrawAmountLabel: "መጠን (በዶላር)",
      withdrawPlaceholder: "የሚያወጡትን መጠን ያስገቡ",
      cbeAccountLabel: "CBE ባንክ ሂሳብ ቁጥር",
      cbeAccountPlaceholder: "ለምሳሌ 1000123456789",
      holderNameLabel: "የሂሳብ ባለቤት ሙሉ ስም",
      holderNamePlaceholder: "በባንክ ሂሳቡ ላይ የተመዘገበ ስም",
      withdrawNotice: "የ CBE ሂሳብ ዝርዝሮችን በጥንቃቄ ያረጋግጡ:: አንዴ በአስተዳዳሪ ከተፈቀደ ስህተት የባንክ ሂሳቦች ሊመለሱ አይችሉም::",
      submitWithdraw: "የማውጫ ጥያቄ ያቅርቡ",
      noHistory: "ምንም ታሪክ የለም",
      pendingRequests: "በመጠባበቅ ላይ ያሉ ጥያቄዎች",
      depositsLabel: "ተቀማጭ ገንዘቦች",
      withdrawalsLabel: "ወጪዎች"
    }
  };

  // Load active agent accounts
  useEffect(() => {
    async function fetchAgents() {
      try {
        const list = await dbService.getAgentAccounts();
        const activeList = list.filter(a => a.is_active);
        setAgents(activeList);
      } catch (err) {
        console.error('Error fetching agents:', err);
      }
    }
    fetchAgents();
  }, []);

  const filteredAgents = agents.filter(a => {
    if (agentType === 'awash') {
      return a.agent_name.toLowerCase().includes('awash') || a.id.includes('awash');
    } else {
      return !a.agent_name.toLowerCase().includes('awash') && !a.id.includes('awash');
    }
  });

  // Keep selectedAgentId synchronized with filteredAgents
  useEffect(() => {
    if (filteredAgents.length > 0) {
      const isStillValid = filteredAgents.some(f => f.id === selectedAgentId);
      if (!isStillValid) {
        setSelectedAgentId(filteredAgents[0].id);
      }
    } else {
      setSelectedAgentId('');
    }
  }, [agentType, agents, selectedAgentId]);

  // Selected agent object lookup
  const currentAgent = filteredAgents.find(a => a.id === selectedAgentId) || filteredAgents[0];

  // Handle Copy Number
  const handleCopyMerchantNumber = () => {
    const numToCopy = currentAgent ? currentAgent.agent_number : TELEBIRR_MERCHANT_NUMBER;
    navigator.clipboard.writeText(numToCopy);
    showToast(
      lang === 'en' 
        ? `Agent number (${numToCopy}) copied to clipboard!` 
        : `የወኪሉ ስልክ ቁጥር (${numToCopy}) ወደ ክሊፕቦርድ ተገልብጧል!`, 
      'success'
    );
  };

  // Handle File Upload and convert to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast(lang === 'en' ? 'Image size must be less than 2MB' : 'የፎቶው መጠን ከ2MB በታች መሆን አለበት', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotBase64(reader.result as string);
      showToast(lang === 'en' ? 'Screenshot loaded successfully!' : 'የደረሰኙ ፎቶ በተሳካ ሁኔታ ተጭኗል!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast(lang === 'en' ? 'Please enter a valid deposit amount.' : 'እባክዎ ትክክለኛ የተቀማጭ መጠን ያስገቡ::', 'error');
      return;
    }
    if (!transactionId.trim()) {
      showToast(lang === 'en' ? 'Please enter the transaction reference ID.' : 'እባክዎ የማስተላለፊያ መለያ ቁጥር ያስገቡ::', 'error');
      return;
    }
    if (!screenshotBase64) {
      showToast(lang === 'en' ? 'Please upload a screenshot of your payment receipt.' : 'እባክዎ የክፍያ ደረሰኙን ፎቶ ይጫኑ::', 'error');
      return;
    }

    setRecharging(true);
    try {
      const agent = filteredAgents.find(a => a.id === selectedAgentId) || filteredAgents[0];
      const agentId = agent?.id;
      const agentInfo = agent ? `${agent.agent_name} (${agent.agent_number})` : `${TELEBIRR_MERCHANT_NAME} (${TELEBIRR_MERCHANT_NUMBER})`;

      await onDepositSubmit(amountNum, transactionId.trim(), screenshotBase64, agentId, agentInfo);
      showToast(
        lang === 'en' 
          ? 'Deposit request submitted! Admins will verify it shortly.' 
          : 'የተቀማጭ ጥያቄዎ ገብቷል! አስተዳዳሪዎች በአጭር ጊዜ ውስጥ ያረጋግጡታል::', 
        'success'
      );
      setDepositAmount('');
      setTransactionId('');
      setScreenshotBase64('');
    } catch (err: any) {
      showToast(err.message || 'Deposit submission failed.', 'error');
    } finally {
      setRecharging(false);
    }
  };

  const handleVerifyOfflineCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verificationCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      showToast(lang === 'en' ? 'Please enter your verification code.' : 'እባክዎ የማረጋገጫ ኮድዎን ያስገቡ::', 'error');
      return;
    }

    setVerifyingCode(true);
    try {
      const result = await dbService.verifyOfflineCode(cleanCode, user.id, user.email);
      if (result.success) {
        showToast(
          lang === 'en'
            ? `Verified! Standard Offline Transaction of ${formatAmount(result.amount)} successfully credited to your wallet!`
            : `ተረጋግጧል! ${formatAmount(result.amount)} ከመስመር ውጭ ማስተላለፊያ በኪስ ቦርሳዎ ላይ በተሳካ ሁኔታ ተጭኗል!`,
          'success'
        );
        setVerificationCodeInput('');
        if (onRefresh) {
          await onRefresh();
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Verification failed. Please double check your code.', 'error');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleVerifyOfflineWithdrawalCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verificationCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      showToast(lang === 'en' ? 'Please enter your withdrawal verification code.' : 'እባክዎ የማረጋገጫ ኮድዎን ያስገቡ::', 'error');
      return;
    }

    setVerifyingCode(true);
    try {
      const result = await dbService.verifyOfflineWithdrawalCode(cleanCode, user.id, user.email);
      if (result.success) {
        showToast(
          lang === 'en'
            ? `Verified! Offline Withdrawal of ${formatAmount(result.amount)} successfully processed and deducted from your wallet!`
            : `ተረጋግጧል! ${formatAmount(result.amount)} ከመስመር ውጭ ወጪ ከኪስ ቦርሳዎ ላይ በተሳካ ሁኔታ ተቀናሽ ተደርጓል!`,
          'success'
        );
        setVerificationCodeInput('');
        if (onRefresh) {
          await onRefresh();
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Withdrawal verification failed. Please check your code.', 'error');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast(lang === 'en' ? 'Please enter a valid withdrawal amount.' : 'እባክዎ ትክክለኛ የማውጫ መጠን ያስገቡ::', 'error');
      return;
    }
    if (amountNum > user.balance) {
      showToast(lang === 'en' ? 'Insufficient wallet balance to perform this withdrawal.' : 'ለማውጣት በቂ ቀሪ ሂሳብ የለዎትም::', 'error');
      return;
    }
    if (!cbeAccount.trim() || cbeAccount.trim().length < 10) {
      showToast(lang === 'en' ? 'Please enter a valid CBE Account Number (minimum 10 digits).' : 'እባክዎ ትክክለኛ የ CBE ባንክ ሂሳብ ቁጥር ያስገቡ (ቢያንስ 10 አሃዞች)::', 'error');
      return;
    }
    if (!cbeHolderName.trim()) {
      showToast(lang === 'en' ? "Please enter the CBE account holder's full name." : 'እባክዎ የባንክ ሂሳብ ባለቤቱን ሙሉ ስም ያስገቡ::', 'error');
      return;
    }

    setWithdrawing(true);
    try {
      const formattedCbeInfo = `CBE: ${cbeAccount.trim()} (${cbeHolderName.trim()})`;
      await onWithdrawSubmit(amountNum, formattedCbeInfo);
      showToast(
        lang === 'en' 
          ? 'CBE Withdrawal request submitted! Funds are locked in escrow.' 
          : 'የ CBE ማውጫ ጥያቄዎ በተሳካ ሁኔታ ገብቷል!', 
        'success'
      );
      setWithdrawAmount('');
      setCbeAccount('');
      setCbeHolderName('');
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
        <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
          {t[lang].title} <span className="text-amber-600 font-extrabold">{t[lang].subTitle}</span>
        </h2>
      </div>

      {/* 1. High contrast visual wallet card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden text-white">
        <div className="absolute top-4 right-4 p-1.5 text-[#fbbc05] bg-[#fbbc05]/10 border border-[#fbbc05]/20 rounded-lg">
          <Wallet className="w-4 h-4" />
        </div>

        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-mono">{t[lang].balance}</span>
        <div className="text-3xl font-black tracking-tight text-white font-mono mt-1">
          {formatAmount(user.balance, 2)}
        </div>

        {/* Detailed subdivision of funds */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800 text-xs font-mono">
          <div>
            <span className="text-[8px] text-slate-400 uppercase block">{t[lang].inflows}</span>
            <span className="text-emerald-400 font-bold block mt-0.5 flex items-center gap-0.5">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              {formatAmount(totalDepositsApproved, 2)}
            </span>
          </div>
          <div>
            <span className="text-[8px] text-slate-400 uppercase block">{t[lang].outflows}</span>
            <span className="text-red-400 font-bold block mt-0.5 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
              {formatAmount(totalWithdrawalsApproved, 2)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Tri-sub-tabs selection */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 grid grid-cols-3">
        <button
          onClick={() => setSubTab('recharge')}
          className={`py-2 px-1 rounded-xl font-sans text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
            subTab === 'recharge' ? 'bg-[#fbbc05] text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t[lang].recharge}
        </button>
        <button
          onClick={() => setSubTab('withdraw')}
          className={`py-2 px-1 rounded-xl font-sans text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
            subTab === 'withdraw' ? 'bg-[#fbbc05] text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t[lang].withdraw}
        </button>
        <button
          onClick={() => setSubTab('ledger')}
          className={`py-2 px-1 rounded-xl font-sans text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
            subTab === 'ledger' ? 'bg-[#fbbc05] text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t[lang].ledger}
        </button>
      </div>

      {/* 3. RECHARGE VIEW */}
      {subTab === 'recharge' && (
        <div className="space-y-4">
          {/* Dual Toggle for Deposit Mode */}
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 grid grid-cols-2 gap-1 font-sans">
            <button
              type="button"
              onClick={() => setDepositMode('agent')}
              className={`py-2 px-1 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                depositMode === 'agent' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              {lang === 'en' ? 'Agent Deposit' : 'የወኪል ማስተላለፊያ'}
            </button>
            <button
              type="button"
              onClick={() => setDepositMode('offline_code')}
              className={`py-2 px-1 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                depositMode === 'offline_code' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              {lang === 'en' ? 'Verify Offline' : 'ፈጣን ኮድ ማረጋገጫ'}
            </button>
          </div>

          {depositMode === 'agent' ? (
            <form onSubmit={handleDepositSubmit} className="space-y-4">
              {/* How It Works Guide */}
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-4 space-y-2 text-xs text-slate-600 shadow-sm">
                <div className="flex items-center gap-1.5 font-bold text-amber-700 uppercase tracking-wider text-[10px]">
                  <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t[lang].guideTitle}</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-normal text-[11px] font-sans pl-0.5">
                  <li>{t[lang].guide1}</li>
                  <li>{t[lang].guide2}</li>
                  <li>{t[lang].guide3}</li>
                  <li>{t[lang].guide4}</li>
                  <li>{t[lang].guide5}</li>
                </ol>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-5 space-y-4 shadow-sm">
                {/* Agent Type Segmented Picker */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 block font-bold">
                    {t[lang].selectNetwork}
                  </label>
                  <div className="bg-slate-50 p-1 rounded-xl border border-slate-200 grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setAgentType('telebirr')}
                      className={`py-2 px-1 rounded-lg font-sans text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                        agentType === 'telebirr' ? 'bg-[#fbbc05] text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {t[lang].telebirrAgent}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgentType('awash')}
                      className={`py-2 px-1 rounded-lg font-sans text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                        agentType === 'awash' ? 'bg-[#fbbc05] text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {t[lang].awashAgent}
                    </button>
                  </div>
                </div>

                {/* Agent Selector */}
                {filteredAgents.length > 0 ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 block font-bold">
                      {t[lang].authorizedAgent} ({agentType === 'telebirr' ? 'Telebirr' : 'Awash Bank'})
                    </label>
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs text-slate-800 p-3 rounded-xl outline-none focus:border-[#fbbc05] font-sans shadow-sm cursor-pointer"
                    >
                      {filteredAgents.map((ag) => (
                        <option key={ag.id} value={ag.id} className="bg-white text-slate-800">
                          {ag.agent_name} ({ag.agent_number})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-500 text-center">
                    {t[lang].noActiveAgents}
                  </div>
                )}
                
                {/* Payment Details Box */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 uppercase font-bold text-[10px]">{t[lang].agentName}</span>
                    <span className="text-slate-800 font-extrabold">
                      {currentAgent ? currentAgent.agent_name : (agentType === 'telebirr' ? TELEBIRR_MERCHANT_NAME : 'Tesla Awash Agent')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200/60 pt-2.5">
                    <span className="text-slate-500 uppercase font-bold text-[10px]">{t[lang].agentAccount}</span>
                    <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 border border-slate-200 rounded-lg">
                      <span className="text-emerald-700 font-mono font-extrabold">
                        {currentAgent ? currentAgent.agent_number : (agentType === 'telebirr' ? TELEBIRR_MERCHANT_NUMBER : '0132049581900')}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyMerchantNumber}
                        className="p-1 hover:bg-[#fbbc05]/10 rounded text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Amount Field */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">{t[lang].amountUsd}</label>
                  <input
                    type="number"
                    required
                    placeholder={t[lang].amountPlaceholder}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-[#fbbc05] focus:ring-1 focus:ring-[#fbbc05] outline-none text-sm text-slate-900 px-4 py-3 rounded-xl transition-all font-mono"
                  />
                  {depositAmount && !isNaN(parseFloat(depositAmount)) && (
                    <div className="text-[10px] text-amber-700 font-bold mt-1 px-1">
                      ≈ {(parseFloat(depositAmount) * 120).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB <span className="text-slate-500 font-normal">({t[lang].rateText})</span>
                    </div>
                  )}
                </div>

                {/* TxID Field */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">{t[lang].txidLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder={t[lang].txidPlaceholder}
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-[#fbbc05] focus:ring-1 focus:ring-[#fbbc05] outline-none text-sm text-slate-900 px-4 py-3 rounded-xl transition-all font-mono"
                  />
                </div>

                {/* Image Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">{t[lang].receiptLabel}</label>
                  
                  <div className="border border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col items-center justify-center relative hover:border-[#fbbc05]/60 transition-colors">
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
                        <p className="text-[10px] text-emerald-600 font-bold">{t[lang].readyUpload}</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-xs font-bold text-slate-600">{t[lang].uploadPrompt}</span>
                        <span className="text-[9px] text-slate-400 mt-1">{t[lang].uploadMeta}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={recharging}
                className="w-full bg-[#fbbc05] hover:bg-[#e2a804] active:bg-[#c99503] disabled:opacity-50 text-slate-950 font-bold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md uppercase font-sans"
              >
                {recharging ? (
                  <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  t[lang].submitTicket
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOfflineCode} className="space-y-4">
              {/* Instant Verification Guide */}
              <div className="bg-[#fbbc05]/5 border border-[#fbbc05]/15 rounded-3xl p-4 space-y-2 text-xs text-slate-600 shadow-sm">
                <div className="flex items-center gap-1.5 font-bold text-amber-700 uppercase tracking-wider text-[10px]">
                  <Key className="w-4 h-4 text-[#fbbc05] shrink-0" />
                  <span>{lang === 'en' ? 'Instant Offline Verification' : 'ፈጣን ከመስመር ውጭ ማረጋገጫ'}</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px] font-sans">
                  {lang === 'en'
                    ? 'Enter the 8-digit verification code issued by the system administrators for your transaction. Your payment will be validated cryptographically and credited to your wallet instantly.'
                    : 'በስርዓት አስተዳዳሪዎች የተሰጠዎትን ባለ 8-አሃዝ የማረጋገጫ ኮድ ያስገቡ። ክፍያዎ ወዲያውኑ ተረጋግጦ ቀሪ ሂሳብዎ ላይ ይጨመራል።'}
                </p>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-5 space-y-4 shadow-sm">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                    {lang === 'en' ? 'Verification Code (8-Character)' : 'የማረጋገጫ ኮድ'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ABCD-EFGH"
                    value={verificationCodeInput}
                    onChange={(e) => setVerificationCodeInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-base p-4 rounded-xl outline-none focus:border-[#fbbc05] font-mono tracking-widest text-center text-slate-800 font-extrabold uppercase shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyingCode}
                  className="w-full bg-[#fbbc05] hover:bg-[#e2a804] active:bg-[#c99503] disabled:opacity-50 text-slate-950 font-black text-xs py-4 px-4 rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-amber-400/10 cursor-pointer font-sans transition-all"
                >
                  {verifyingCode ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {lang === 'en' ? 'Verify & Claim Instantly' : 'አረጋግጥ እና ወዲያውኑ ክሊም አድርግ'}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 4. WITHDRAW VIEW */}
      {subTab === 'withdraw' && (
        <div className="space-y-4">
          {/* Dual Toggle for Withdraw Mode */}
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 grid grid-cols-2 gap-1 font-sans">
            <button
              type="button"
              onClick={() => setWithdrawMode('agent')}
              className={`py-2 px-1 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                withdrawMode === 'agent' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              {lang === 'en' ? 'Bank Withdrawal' : 'ባንክ ማውጫ'}
            </button>
            <button
              type="button"
              onClick={() => setWithdrawMode('offline_code')}
              className={`py-2 px-1 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                withdrawMode === 'offline_code' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              {lang === 'en' ? 'Verify Offline' : 'ፈጣን ኮድ ማረጋገጫ'}
            </button>
          </div>

          {withdrawMode === 'agent' ? (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="bg-white border border-slate-100 rounded-3xl p-5 space-y-4 shadow-sm">
                {/* Available to withdraw banner */}
                <div className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs text-slate-600">
                  <span className="text-slate-500 flex items-center gap-1.5 font-bold">
                    <Landmark className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {t[lang].liquidCapital}
                  </span>
                  <span className="text-emerald-700 font-black font-mono">{formatAmount(user.balance, 2)}</span>
                </div>

                {/* Withdrawal Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">{t[lang].withdrawAmountLabel}</label>
                  <input
                    type="number"
                    required
                    max={user.balance}
                    placeholder={t[lang].withdrawPlaceholder}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-[#fbbc05] focus:ring-1 focus:ring-[#fbbc05] outline-none text-sm text-slate-900 px-4 py-3 rounded-xl transition-all font-mono"
                  />
                  {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && (
                    <div className="text-[10px] text-amber-700 font-bold mt-1 px-1">
                      ≈ {(parseFloat(withdrawAmount) * 120).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB <span className="text-slate-500 font-normal">({t[lang].rateText})</span>
                    </div>
                  )}
                </div>

                {/* CBE Account Number */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 block font-bold">
                    {t[lang].cbeAccountLabel}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t[lang].cbeAccountPlaceholder}
                    value={cbeAccount}
                    onChange={(e) => setCbeAccount(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white border border-slate-200 focus:border-[#fbbc05] focus:ring-1 focus:ring-[#fbbc05] outline-none text-sm text-slate-900 px-4 py-3 rounded-xl transition-all font-mono"
                  />
                </div>

                {/* CBE Account Holder Name */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 block font-bold">
                    {t[lang].holderNameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t[lang].holderNamePlaceholder}
                    value={cbeHolderName}
                    onChange={(e) => setCbeHolderName(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-[#fbbc05] focus:ring-1 focus:ring-[#fbbc05] outline-none text-sm text-slate-900 px-4 py-3 rounded-xl transition-all font-sans"
                  />
                </div>

                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-2xl text-[10.5px] leading-normal font-sans">
                  ⚠️ <span className="font-bold">Important Notice:</span> {t[lang].withdrawNotice}
                </div>
              </div>

              <button
                type="submit"
                disabled={withdrawing || user.balance === 0}
                className="w-full bg-[#fbbc05] hover:bg-[#e2a804] active:bg-[#c99503] disabled:opacity-50 text-slate-950 font-bold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md uppercase"
              >
                {withdrawing ? (
                  <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  t[lang].submitWithdraw
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOfflineWithdrawalCode} className="space-y-4">
              {/* Instant Verification Guide */}
              <div className="bg-[#fbbc05]/5 border border-[#fbbc05]/15 rounded-3xl p-4 space-y-2 text-xs text-slate-600 shadow-sm">
                <div className="flex items-center gap-1.5 font-bold text-amber-700 uppercase tracking-wider text-[10px]">
                  <Key className="w-4 h-4 text-[#fbbc05] shrink-0" />
                  <span>{lang === 'en' ? 'Instant Offline Withdrawal' : 'ፈጣን ከመስመር ውጭ ማውጫ'}</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px] font-sans">
                  {lang === 'en'
                    ? 'Enter the 8-digit withdrawal verification code issued by system administrators for your account. This ticket will be validated cryptographically and processed instantly, deducting the amount from your wallet.'
                    : 'በስርዓት አስተዳዳሪዎች የተሰጠዎትን ባለ 8-አሃዝ የማውጫ ኮድ ያስገቡ። ኮዱ ሲረጋገጥ የሚዛመደው መጠን ወዲያውኑ ከኪስ ቦርሳዎ ላይ ተቀናሽ ይደረጋል።'}
                </p>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-5 space-y-4 shadow-sm">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                    {lang === 'en' ? 'Withdrawal Code (8-Character)' : 'የማውጫ ኮድ'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ABCD-EFGH"
                    value={verificationCodeInput}
                    onChange={(e) => setVerificationCodeInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-base p-4 rounded-xl outline-none focus:border-[#fbbc05] font-mono tracking-widest text-center text-slate-800 font-extrabold uppercase shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyingCode}
                  className="w-full bg-[#fbbc05] hover:bg-[#e2a804] active:bg-[#c99503] disabled:opacity-50 text-slate-950 font-black text-xs py-4 px-4 rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-amber-400/10 cursor-pointer font-sans transition-all"
                >
                  {verifyingCode ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {lang === 'en' ? 'Verify & Process Instantly' : 'አረጋግጥ እና ወዲያውኑ ውጣ'}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}


      {/* 5. LEDGER / TRANSACTION HISTORY VIEW */}
      {subTab === 'ledger' && (
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-sm">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-400 uppercase">{t[lang].noHistory}</h4>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isPositive = tx.amount > 0;
                
                const getTranslatedType = () => {
                  if (tx.type === 'deposit') return lang === 'am' ? 'ተቀማጭ' : 'Deposit';
                  if (tx.type === 'withdrawal') return lang === 'am' ? 'ወጪ' : 'Withdrawal';
                  if (tx.type === 'profit') return lang === 'am' ? 'ትርፍ' : 'Profit';
                  if (tx.type === 'bonus') return lang === 'am' ? 'ቦነስ' : 'Bonus';
                  return tx.type;
                };

                const getTranslatedDescription = () => {
                  // Translate common system ledger messages
                  let desc = tx.description;
                  if (lang === 'am') {
                    if (desc.includes('Approved deposit')) {
                      return desc.replace('Approved deposit', 'የጸደቀ ተቀማጭ');
                    }
                    if (desc.includes('Withdrawal request approved')) {
                      return 'የወጪ ጥያቄ ጸድቋል';
                    }
                    if (desc.includes('Staking capital escrow')) {
                      return 'የኮንትራት መዋጮ ማስያዣ';
                    }
                    if (desc.includes('Investment plan contract matured')) {
                      return 'የኢንቨስትመንት ኮንትራት ተጠናቋል';
                    }
                    if (desc.includes('Admin credit adjustment')) {
                      return 'የአስተዳዳሪ ቀሪ ሂሳብ ማስተካከያ';
                    }
                  }
                  return desc;
                };

                return (
                  <div
                    key={tx.id}
                    className="bg-white border border-slate-100 rounded-2xl p-3.5 flex items-center justify-between shadow-sm relative overflow-hidden"
                  >
                    {/* Tiny visual type bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                        tx.type === 'deposit'
                          ? 'bg-[#fbbc05]'
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
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">
                        {getTranslatedType()} • {new Date(tx.created_at).toLocaleDateString()}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 mt-0.5 tracking-tight">{getTranslatedDescription()}</h4>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold font-mono ${
                          isPositive ? 'text-emerald-600' : 'text-slate-500'
                        }`}
                      >
                        {isPositive ? '+' : ''}{formatAmount(tx.amount, 2)}
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono block uppercase">{currency}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Special Verification Log showing user's requests */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <h4 className="text-xs uppercase text-slate-500 px-1 font-extrabold">{t[lang].pendingRequests}</h4>
            
            {/* Deposits Tickets list */}
            {deposits.length > 0 && (
              <div className="space-y-2">
                <span className="text-[9px] text-slate-400 uppercase block px-1 font-bold">{t[lang].depositsLabel}</span>
                {deposits.map((dep) => {
                  const getStatusText = () => {
                    if (dep.status === 'pending') return lang === 'am' ? 'በመጠባበቅ ላይ' : 'Pending';
                    if (dep.status === 'approved') return lang === 'am' ? 'የጸደቀ' : 'Approved';
                    return lang === 'am' ? 'የተሰረዘ' : 'Declined';
                  };

                  return (
                    <div key={dep.id} className="bg-white border border-slate-100 p-3.5 rounded-2xl flex justify-between items-center text-[10px] shadow-sm">
                      <div>
                        <span className="text-slate-800 font-extrabold block">Amt: {formatAmount(dep.amount, 2)}</span>
                        <span className="text-slate-400 block text-[9px] mt-0.5 font-mono">TxID: {dep.transaction_id}</span>
                        {dep.agent_account_info && (
                          <span className="text-slate-500 block text-[8px] mt-0.5 font-sans">
                            {lang === 'am' ? 'ወኪል:' : 'Agent:'} {dep.agent_account_info}
                          </span>
                        )}
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                        dep.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                          : dep.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                      }`}>
                        {getStatusText()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Withdrawals Tickets list */}
            {withdrawals.length > 0 && (
              <div className="space-y-2 mt-4">
                <span className="text-[9px] text-slate-400 uppercase block px-1 font-bold">{t[lang].withdrawalsLabel}</span>
                {withdrawals.map((wd) => {
                  const getStatusText = () => {
                    if (wd.status === 'pending') return lang === 'am' ? 'በመጠባበቅ ላይ' : 'Pending';
                    if (wd.status === 'approved') return lang === 'am' ? 'የጸደቀ' : 'Approved';
                    return lang === 'am' ? 'የተሰረዘ' : 'Declined';
                  };

                  return (
                    <div key={wd.id} className="bg-white border border-slate-100 p-3.5 rounded-2xl flex justify-between items-center text-[10px] shadow-sm">
                      <div>
                        <span className="text-slate-800 font-extrabold block">Amt: {formatAmount(wd.amount, 2)}</span>
                        <span className="text-slate-400 block text-[9px] mt-0.5">
                          {wd.telebirr_number.startsWith('CBE') ? wd.telebirr_number : `Tel: ${wd.telebirr_number}`}
                        </span>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                        wd.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                          : wd.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                      }`}>
                        {getStatusText()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
