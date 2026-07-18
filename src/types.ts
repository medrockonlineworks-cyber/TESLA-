export interface DbUser {
  id: string;
  full_name: string;
  email: string;
  balance: number;
  total_profit: number;
  is_admin?: boolean;
  created_at: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  amount: number;
  return_amount: number;
  duration_hours: number;
  status: 'active' | 'inactive';
}

export interface Investment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  expected_return: number;
  start_time: string;
  end_time: string;
  status: 'active' | 'completed';
  plan_name?: string; // Join helper
}

export interface AgentAccount {
  id: string;
  agent_name: string;
  agent_number: string;
  is_active: boolean;
  created_at: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  transaction_id: string;
  screenshot_url: string; // Base64 or mock URL
  agent_account_id?: string; // Link to selected agent account
  agent_account_info?: string; // Display snapshot of agent account
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_name?: string; // Join helper
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  telebirr_number: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_name?: string; // Join helper
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'profit' | 'bonus';
  amount: number;
  description: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export interface OfflinePaymentCode {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  txid: string;
  verification_code: string;
  signature: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'completed' | 'expired';
  used: boolean;
  verified_at?: string;
  admin_id?: string;
}

export interface CodeVerificationLog {
  id: string;
  verification_code: string;
  attempted_by: string;
  user_email: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface OfflineWithdrawalCode {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  verification_code: string;
  signature: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'completed' | 'expired';
  used: boolean;
  verified_at?: string;
  admin_id?: string;
}

export interface WithdrawalVerificationLog {
  id: string;
  verification_code: string;
  attempted_by: string;
  user_email: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

