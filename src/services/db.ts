import { createClient } from '@supabase/supabase-js';
import { DbUser, InvestmentPlan, Investment, Deposit, Withdrawal, Transaction, Announcement, AgentAccount } from '../types';

// Read credentials safely
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Detect if we can use real Supabase
const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

console.log(
  isSupabaseConfigured
    ? '🔌 Connected to real Supabase database.'
    : '⚙️ Using simulated high-fidelity Local Storage database (VITE_SUPABASE_URL not configured).'
);

// ==========================================
// LOCAL STORAGE DATABASE SIMULATOR (FALLBACK)
// ==========================================

const DEFAULT_PLANS: InvestmentPlan[] = [
  {
    id: 'plan_starter',
    name: 'Starter plan',
    amount: 85, // 85 * 120 = 10,200 ETB
    return_amount: 1500, // 1500 * 120 = 180,000 ETB
    duration_hours: 24,
    status: 'active'
  },
  {
    id: 'plan_growth',
    name: 'Growth plan',
    amount: 166.666667, // 166.67 * 120 ≈ 20,000 ETB
    return_amount: 3000, // 3000 * 120 = 360,000 ETB
    duration_hours: 24,
    status: 'active'
  },
  {
    id: 'plan_premium',
    name: 'Premium plan',
    amount: 250, // 250 * 120 = 30,000 ETB
    return_amount: 4583.333333, // 4583.33 * 120 ≈ 550,000 ETB
    duration_hours: 48,
    status: 'active'
  },
  {
    id: 'plan_elite',
    name: 'Elite plan',
    amount: 333.333333, // 333.33 * 120 ≈ 40,000 ETB
    return_amount: 6000, // 6000 * 120 = 720,000 ETB
    duration_hours: 48,
    status: 'active'
  }
];

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1',
    title: '⚡ Welcome to TESLA INVESTMENT LIMITED',
    message: 'We are thrilled to launch the world\'s most high-yield clean energy investment platform. Invest in Tesla clean projects and receive guaranteed 24-hour returns of up to 60%! Join our sustainable revolution today.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'ann_2',
    title: '📱 Telebirr Deposits & Withdrawals Active',
    message: 'To facilitate immediate and secure local transfers, we have fully integrated Telebirr. Deposits are processed under 15 minutes. To begin, navigate to the Wallet screen, copy our payment details, and submit your transaction ID.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const DEFAULT_AGENTS: AgentAccount[] = [
  {
    id: 'agent_1',
    agent_name: 'Telebirr Authorized Agent',
    agent_number: '0926193920',
    is_active: true,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'agent_awash1',
    agent_name: 'Awash Bank Agent (Kassa Abebe)',
    agent_number: '0132049581900',
    is_active: true,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'agent_awash2',
    agent_name: 'Awash Bank Agent (Abebech B.)',
    agent_number: '0149023485700',
    is_active: true,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  }
];

// Local state helpers
function getStorageItem<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(`tesla_inv_${key}`);
  if (!data) {
    localStorage.setItem(`tesla_inv_${key}`, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(data);
}

function setStorageItem<T>(key: string, value: T): void {
  localStorage.setItem(`tesla_inv_${key}`, JSON.stringify(value));
}

// Initializing simulator tables
const initLocalDb = () => {
  const users = getStorageItem<DbUser[]>('users', []);
  
  // Force reset plans to the new high-yield custom plans from the screenshot
  const storedPlans = localStorage.getItem('tesla_inv_plans');
  if (!storedPlans || storedPlans.includes('plan_model3') || storedPlans.includes('Tesla Model 3')) {
    localStorage.setItem('tesla_inv_plans', JSON.stringify(DEFAULT_PLANS));
  } else {
    getStorageItem<InvestmentPlan[]>('plans', DEFAULT_PLANS);
  }

  getStorageItem<Investment[]>('investments', []);
  getStorageItem<Deposit[]>('deposits', []);
  getStorageItem<Withdrawal[]>('withdrawals', []);
  const transactions = getStorageItem<Transaction[]>('transactions', []);
  getStorageItem<Announcement[]>('announcements', DEFAULT_ANNOUNCEMENTS);

  // Force reset agents to include the new Telebirr agent immediately
  const storedAgents = localStorage.getItem('tesla_inv_agent_accounts');
  if (!storedAgents || !storedAgents.includes('0926193920')) {
    localStorage.setItem('tesla_inv_agent_accounts', JSON.stringify(DEFAULT_AGENTS));
  } else {
    getStorageItem<AgentAccount[]>('agent_accounts', DEFAULT_AGENTS);
  }

  // Migrate existing users/transactions from $10 welcome bonus to $30
  let updatedUsers = false;
  let updatedTxs = false;

  transactions.forEach(tx => {
    if (tx.type === 'bonus' && tx.description === 'Welcome Sign-up Bonus Credit' && tx.amount === 10) {
      tx.amount = 30;
      updatedTxs = true;
    }
  });

  users.forEach(u => {
    if (u.balance === 10) {
      const hasWelcomeBonus = transactions.some(tx => tx.user_id === u.id && tx.type === 'bonus' && tx.description === 'Welcome Sign-up Bonus Credit');
      if (hasWelcomeBonus) {
        u.balance = 30;
        updatedUsers = true;
      }
    }
  });

  if (updatedUsers) {
    setStorageItem('users', users);
  }
  if (updatedTxs) {
    setStorageItem('transactions', transactions);
  }
};

initLocalDb();

export const dbService = {
  // Check backend type
  isRealSupabase(): boolean {
    return isSupabaseConfigured;
  },

  // ==========================================
  // AUTHENTICATION & PROFILE SERVICES
  // ==========================================

  async signUp(fullName: string, email: string, password: string): Promise<{ user: DbUser | null; error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });

        if (error) return { user: null, error: error.message };
        if (!data.user) return { user: null, error: 'Registration succeeded, but no user was returned.' };

        // Create the user profile in Firestore/Postgres via public schema
        const profile: DbUser = {
          id: data.user.id,
          full_name: fullName,
          email,
          balance: 0,
          total_profit: 0,
          is_admin: email.toLowerCase() === 'admin@tesla.com' || email.toLowerCase() === 'admin@gmail.com', // Default admin flags
          created_at: new Date().toISOString()
        };

        const { error: profileError } = await supabase
          .from('users')
          .insert([profile]);

        if (profileError) {
          console.warn('Profile insert returned error (might be normal if trigger handles it):', profileError);
        }

        return { user: profile, error: null };
      } catch (err: any) {
        return { user: null, error: err.message || 'Supabase Auth Error' };
      }
    } else {
      // Local Database Simulator
      const users = getStorageItem<DbUser[]>('users', []);
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { user: null, error: 'Email address already registered' };
      }

      const isFirstUser = users.length === 0;
      const isAdmin = isFirstUser || email.toLowerCase() === 'admin@tesla.com' || email.toLowerCase() === 'admin@gmail.com';

      const newUser: DbUser = {
        id: 'u_' + Math.random().toString(36).substr(2, 9),
        full_name: fullName,
        email: email.toLowerCase(),
        balance: 30, // Generous $30 sign-up bonus to allow immediate plans preview!
        total_profit: 0,
        is_admin: isAdmin,
        created_at: new Date().toISOString()
      };

      users.push(newUser);
      setStorageItem('users', users);
      localStorage.setItem('tesla_inv_session', newUser.id);

      // Create sign up bonus transaction
      const tx: Transaction = {
        id: 'tx_bonus_' + Math.random().toString(36).substr(2, 9),
        user_id: newUser.id,
        type: 'bonus',
        amount: 30,
        description: 'Welcome Sign-up Bonus Credit',
        created_at: new Date().toISOString()
      };
      const txs = getStorageItem<Transaction[]>('transactions', []);
      txs.unshift(tx);
      setStorageItem('transactions', txs);

      return { user: newUser, error: null };
    }
  },

  async signIn(email: string, password: string): Promise<{ user: DbUser | null; error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) return { user: null, error: error.message };
        if (!data.user) return { user: null, error: 'No user returned from login.' };

        // Fetch user profile
        const { data: profile, error: profileErr } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileErr) {
          // If profile table doesn't exist yet, return a safe profile representation
          const fallbackProfile: DbUser = {
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || email.split('@')[0],
            email,
            balance: 0,
            total_profit: 0,
            is_admin: email.toLowerCase() === 'admin@tesla.com' || email.toLowerCase() === 'admin@gmail.com',
            created_at: new Date().toISOString()
          };
          return { user: fallbackProfile, error: null };
        }

        return { user: profile as DbUser, error: null };
      } catch (err: any) {
        return { user: null, error: err.message || 'Login Error' };
      }
    } else {
      // Local Database Simulator
      const users = getStorageItem<DbUser[]>('users', []);
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return { user: null, error: 'Invalid email or password' };
      }
      
      // Simple verification (for simulation, allow any password)
      localStorage.setItem('tesla_inv_session', user.id);
      return { user, error: null };
    }
  },

  async signInWithGoogle(uid: string, fullName: string, email: string): Promise<{ user: DbUser | null; error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch existing user profile
        const { data: profile, error: profileErr } = await supabase
          .from('users')
          .select('*')
          .eq('id', uid)
          .single();

        if (profileErr) {
          // If profile table doesn't exist yet or user not found, create profile
          const isAdmin = email.toLowerCase() === 'admin@tesla.com' || email.toLowerCase() === 'admin@gmail.com';
          const newProfile: DbUser = {
            id: uid,
            full_name: fullName,
            email: email.toLowerCase(),
            balance: 30, // Give them $30 welcome bonus
            total_profit: 0,
            is_admin: isAdmin,
            created_at: new Date().toISOString()
          };

          const { error: insertErr } = await supabase
            .from('users')
            .insert([newProfile]);

          if (insertErr) {
            console.warn('Profile insert returned error:', insertErr);
          }

          // Record bonus transaction
          const tx: Omit<Transaction, 'id'> = {
            user_id: uid,
            type: 'bonus',
            amount: 30,
            description: 'Welcome Sign-up Bonus Credit',
            created_at: new Date().toISOString()
          };
          await supabase.from('transactions').insert([tx]);

          return { user: newProfile, error: null };
        }

        return { user: profile as DbUser, error: null };
      } catch (err: any) {
        return { user: null, error: err.message || 'Google Auth Error' };
      }
    } else {
      // Local Database Simulator
      const users = getStorageItem<DbUser[]>('users', []);
      let user = users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.id === uid);
      
      if (!user) {
        const isFirstUser = users.length === 0;
        const isAdmin = isFirstUser || email.toLowerCase() === 'admin@tesla.com' || email.toLowerCase() === 'admin@gmail.com';

        user = {
          id: uid,
          full_name: fullName,
          email: email.toLowerCase(),
          balance: 30, // Generous $30 sign-up bonus
          total_profit: 0,
          is_admin: isAdmin,
          created_at: new Date().toISOString()
        };

        users.push(user);
        setStorageItem('users', users);

        // Create sign up bonus transaction
        const tx: Transaction = {
          id: 'tx_bonus_' + Math.random().toString(36).substr(2, 9),
          user_id: user.id,
          type: 'bonus',
          amount: 30,
          description: 'Welcome Sign-up Bonus Credit',
          created_at: new Date().toISOString()
        };
        const txs = getStorageItem<Transaction[]>('transactions', []);
        txs.unshift(tx);
        setStorageItem('transactions', txs);
      }

      localStorage.setItem('tesla_inv_session', user.id);
      return { user, error: null };
    }
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('tesla_inv_session');
    }
  },

  async getCurrentUser(id?: string): Promise<DbUser | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          return {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            balance: 0,
            total_profit: 0,
            is_admin: user.email === 'admin@tesla.com' || user.email === 'admin@gmail.com',
            created_at: user.created_at
          };
        }
        return profile as DbUser;
      } catch {
        return null;
      }
    } else {
      // Local Database Simulator
      const sessionUserId = id || localStorage.getItem('tesla_inv_session');
      if (!sessionUserId) return null;

      const users = getStorageItem<DbUser[]>('users', []);
      const user = users.find(u => u.id === sessionUserId);
      return user || null;
    }
  },

  async forgotPassword(email: string): Promise<{ success: boolean; error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      return { success: !error, error: error ? error.message : null };
    } else {
      const users = getStorageItem<DbUser[]>('users', []);
      const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return { success: true, error: null };
      } else {
        return { success: false, error: 'No account registered with this email address' };
      }
    }
  },

  // ==========================================
  // PLANS SERVICES
  // ==========================================

  async getPlans(): Promise<InvestmentPlan[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('investment_plans')
        .select('*')
        .order('amount', { ascending: true });

      if (error) {
        console.warn('Error fetching plans from Supabase, loading fallback:', error);
        return DEFAULT_PLANS;
      }
      return data as InvestmentPlan[];
    } else {
      return getStorageItem<InvestmentPlan[]>('plans', DEFAULT_PLANS);
    }
  },

  async createPlan(plan: Omit<InvestmentPlan, 'id'>): Promise<InvestmentPlan> {
    const newPlan: InvestmentPlan = {
      ...plan,
      id: 'plan_' + Math.random().toString(36).substr(2, 9)
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('investment_plans')
        .insert([newPlan])
        .select()
        .single();
      if (error) throw error;
      return data as InvestmentPlan;
    } else {
      const plans = getStorageItem<InvestmentPlan[]>('plans', DEFAULT_PLANS);
      plans.push(newPlan);
      setStorageItem('plans', plans);
      return newPlan;
    }
  },

  async updatePlan(id: string, updates: Partial<InvestmentPlan>): Promise<InvestmentPlan> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('investment_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as InvestmentPlan;
    } else {
      const plans = getStorageItem<InvestmentPlan[]>('plans', DEFAULT_PLANS);
      const index = plans.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Plan not found');
      
      plans[index] = { ...plans[index], ...updates };
      setStorageItem('plans', plans);
      return plans[index];
    }
  },

  // ==========================================
  // INVESTMENTS SERVICES
  // ==========================================

  async getInvestments(userId?: string): Promise<Investment[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('investments').select(`
        *,
        investment_plans(name)
      `);
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query.order('start_time', { ascending: false });
      if (error) throw error;

      return (data || []).map((inv: any) => ({
        ...inv,
        plan_name: inv.investment_plans?.name || 'Tesla Custom Project'
      })) as Investment[];
    } else {
      const investments = getStorageItem<Investment[]>('investments', []);
      const plans = getStorageItem<InvestmentPlan[]>('plans', DEFAULT_PLANS);
      
      const filtered = userId ? investments.filter(i => i.user_id === userId) : investments;
      
      return filtered.map(inv => {
        const plan = plans.find(p => p.id === inv.plan_id);
        return {
          ...inv,
          plan_name: plan ? plan.name : 'Tesla Standard Plan'
        };
      }).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    }
  },

  async createInvestment(userId: string, planId: string, amount: number, expectedReturn: number, durationHours: number): Promise<Investment> {
    // 1. Get user profile and verify balance
    const user = await this.getCurrentUser(userId);
    if (!user) throw new Error('User profile not found');
    if (user.balance < amount) throw new Error('Insufficient wallet balance to invest in this plan');

    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + 3600000 * durationHours).toISOString();

    const newInvestment: Investment = {
      id: 'inv_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      plan_id: planId,
      amount,
      expected_return: expectedReturn,
      start_time: startTime,
      end_time: endTime,
      status: 'active'
    };

    if (isSupabaseConfigured && supabase) {
      // Deduct balance
      const { error: balanceErr } = await supabase
        .from('users')
        .update({ balance: user.balance - amount })
        .eq('id', userId);
      if (balanceErr) throw balanceErr;

      // Create investment record
      const { data, error } = await supabase
        .from('investments')
        .insert([newInvestment])
        .select()
        .single();
      if (error) throw error;

      // Record transaction log
      const tx: Omit<Transaction, 'id'> = {
        user_id: userId,
        type: 'investment',
        amount: -amount,
        description: `Invested in Tesla Plan (Expected Return: $${expectedReturn})`,
        created_at: startTime
      };
      await supabase.from('transactions').insert([tx]);

      return data as Investment;
    } else {
      // Local Database Simulator
      const users = getStorageItem<DbUser[]>('users', []);
      const uIndex = users.findIndex(u => u.id === userId);
      if (uIndex === -1) throw new Error('User not found');
      
      // Deduct balance locally
      users[uIndex].balance -= amount;
      setStorageItem('users', users);

      // Save investment
      const investments = getStorageItem<Investment[]>('investments', []);
      investments.push(newInvestment);
      setStorageItem('investments', investments);

      // Create transaction log
      const tx: Transaction = {
        id: 'tx_inv_' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        type: 'investment',
        amount: -amount,
        description: `Invested in Tesla Plan (Expected Return: $${expectedReturn})`,
        created_at: startTime
      };
      const txs = getStorageItem<Transaction[]>('transactions', []);
      txs.unshift(tx);
      setStorageItem('transactions', txs);

      return newInvestment;
    }
  },

  // Highly robust periodic inspector of elapsed investments
  async checkAndCompleteInvestments(userId: string): Promise<{ completedCount: number; earnings: number }> {
    const now = new Date();
    let completedCount = 0;
    let earnings = 0;

    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch active investments that have passed end_time
        const { data: activeExpired, error } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .lte('end_time', now.toISOString());

        if (error) throw error;
        if (!activeExpired || activeExpired.length === 0) return { completedCount: 0, earnings: 0 };

        const user = await this.getCurrentUser(userId);
        if (!user) return { completedCount: 0, earnings: 0 };

        let totalReturn = 0;
        let totalProfit = 0;

        for (const inv of activeExpired) {
          // Update individual investment status to completed
          await supabase
            .from('investments')
            .update({ status: 'completed' })
            .eq('id', inv.id);

          totalReturn += inv.expected_return;
          totalProfit += (inv.expected_return - inv.amount);

          // Add transaction log
          const tx: Omit<Transaction, 'id'> = {
            user_id: userId,
            type: 'profit',
            amount: inv.expected_return,
            description: `Earned return from Completed Tesla Investment Plan`,
            created_at: new Date().toISOString()
          };
          await supabase.from('transactions').insert([tx]);

          completedCount++;
        }

        // Update user account statistics
        earnings = totalReturn;
        await supabase
          .from('users')
          .update({
            balance: user.balance + totalReturn,
            total_profit: user.total_profit + totalProfit
          })
          .eq('id', userId);

        return { completedCount, earnings };
      } catch (err) {
        console.error('Error completing investments in Supabase:', err);
        return { completedCount: 0, earnings: 0 };
      }
    } else {
      // Local Database Simulator
      const investments = getStorageItem<Investment[]>('investments', []);
      const users = getStorageItem<DbUser[]>('users', []);
      const txs = getStorageItem<Transaction[]>('transactions', []);

      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) return { completedCount: 0, earnings: 0 };

      let updated = false;

      investments.forEach(inv => {
        if (inv.user_id === userId && inv.status === 'active' && new Date(inv.end_time) <= now) {
          inv.status = 'completed';
          
          const profitGained = inv.expected_return - inv.amount;
          users[userIndex].balance += inv.expected_return;
          users[userIndex].total_profit += profitGained;
          
          earnings += inv.expected_return;
          completedCount++;
          updated = true;

          // Transaction log
          const tx: Transaction = {
            id: 'tx_profit_' + Math.random().toString(36).substr(2, 9),
            user_id: userId,
            type: 'profit',
            amount: inv.expected_return,
            description: `Earned return from Completed Tesla Investment Plan`,
            created_at: new Date().toISOString()
          };
          txs.unshift(tx);
        }
      });

      if (updated) {
        setStorageItem('investments', investments);
        setStorageItem('users', users);
        setStorageItem('transactions', txs);
      }

      return { completedCount, earnings };
    }
  },

  // ==========================================
  // DEPOSITS (RECHARGE) SERVICES
  // ==========================================

  async getDeposits(userId?: string): Promise<Deposit[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('deposits').select(`
        *,
        users(full_name)
      `);
      
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      return (data || []).map((dep: any) => ({
        ...dep,
        user_name: dep.users?.full_name || 'Tesla Investor'
      })) as Deposit[];
    } else {
      const deposits = getStorageItem<Deposit[]>('deposits', []);
      const users = getStorageItem<DbUser[]>('users', []);
      
      const filtered = userId ? deposits.filter(d => d.user_id === userId) : deposits;

      return filtered.map(dep => {
        const u = users.find(usr => usr.id === dep.user_id);
        return {
          ...dep,
          user_name: u ? u.full_name : 'Tesla Investor'
        };
      }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async createDeposit(userId: string, amount: number, transactionId: string, screenshotUrl: string, agentAccountId?: string, agentAccountInfo?: string): Promise<Deposit> {
    const newDeposit: Deposit = {
      id: 'dep_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      amount,
      transaction_id: transactionId,
      screenshot_url: screenshotUrl,
      agent_account_id: agentAccountId,
      agent_account_info: agentAccountInfo,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('deposits')
        .insert([newDeposit])
        .select()
        .single();
      if (error) throw error;
      return data as Deposit;
    } else {
      const deposits = getStorageItem<Deposit[]>('deposits', []);
      deposits.unshift(newDeposit);
      setStorageItem('deposits', deposits);
      return newDeposit;
    }
  },

  async updateDepositStatus(id: string, status: 'approved' | 'rejected'): Promise<Deposit> {
    if (isSupabaseConfigured && supabase) {
      // 1. Fetch deposit first to know amount & user
      const { data: dep, error: getErr } = await supabase
        .from('deposits')
        .select('*')
        .eq('id', id)
        .single();
      if (getErr) throw getErr;

      if (dep.status !== 'pending') {
        throw new Error('This deposit request has already been processed');
      }

      // 2. Update status
      const { data, error } = await supabase
        .from('deposits')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // 3. If approved, handle standard or direct investment
      if (status === 'approved') {
        if (dep.agent_account_info && dep.agent_account_info.startsWith('Direct Investment: ')) {
          const planId = dep.agent_account_info.replace('Direct Investment: ', '');
          
          // Fetch plan details from Supabase
          const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
          if (plan) {
            const startTime = new Date().toISOString();
            const endTime = new Date(Date.now() + 3600000 * plan.duration_hours).toISOString();
            
            const newInvestment = {
              id: 'inv_' + Math.random().toString(36).substr(2, 9),
              user_id: dep.user_id,
              plan_id: planId,
              amount: dep.amount,
              expected_return: plan.return_amount,
              start_time: startTime,
              end_time: endTime,
              status: 'active'
            };
            await supabase.from('investments').insert([newInvestment]);

            // Add transactions
            const tx1 = {
              user_id: dep.user_id,
              type: 'deposit',
              amount: dep.amount,
              description: `Direct Payment Approved for ${plan.name} (Order: ${dep.transaction_id})`,
              created_at: new Date().toISOString()
            };
            const tx2 = {
              user_id: dep.user_id,
              type: 'investment',
              amount: -dep.amount,
              description: `Staked directly in ${plan.name} (Yields: $${plan.return_amount})`,
              created_at: startTime
            };
            await supabase.from('transactions').insert([tx1, tx2]);
          }
        } else {
          // Standard deposit
          const { data: user, error: userErr } = await supabase
            .from('users')
            .select('*')
            .eq('id', dep.user_id)
            .single();
          if (userErr) throw userErr;

          await supabase
            .from('users')
            .update({ balance: user.balance + dep.amount })
            .eq('id', dep.user_id);

          const tx: Omit<Transaction, 'id'> = {
            user_id: dep.user_id,
            type: 'deposit',
            amount: dep.amount,
            description: `Telebirr Deposit Approved (TxID: ${dep.transaction_id})`,
            created_at: new Date().toISOString()
          };
          await supabase.from('transactions').insert([tx]);
        }
      }

      return data as Deposit;
    } else {
      // Local Database Simulator
      const deposits = getStorageItem<Deposit[]>('deposits', []);
      const users = getStorageItem<DbUser[]>('users', []);
      const txs = getStorageItem<Transaction[]>('transactions', []);

      const depIndex = deposits.findIndex(d => d.id === id);
      if (depIndex === -1) throw new Error('Deposit request not found');

      const dep = deposits[depIndex];
      if (dep.status !== 'pending') {
        throw new Error('This deposit request has already been processed');
      }

      deposits[depIndex].status = status;
      setStorageItem('deposits', deposits);

      if (status === 'approved') {
        if (dep.agent_account_info && dep.agent_account_info.startsWith('Direct Investment: ')) {
          const planId = dep.agent_account_info.replace('Direct Investment: ', '');
          const plans = getStorageItem<InvestmentPlan[]>('plans', DEFAULT_PLANS);
          const plan = plans.find(p => p.id === planId);
          
          if (plan) {
            const startTime = new Date().toISOString();
            const endTime = new Date(Date.now() + 3600000 * plan.duration_hours).toISOString();
            
            const newInvestment: Investment = {
              id: 'inv_' + Math.random().toString(36).substr(2, 9),
              user_id: dep.user_id,
              plan_id: planId,
              amount: dep.amount,
              expected_return: plan.return_amount,
              start_time: startTime,
              end_time: endTime,
              status: 'active'
            };
            const investments = getStorageItem<Investment[]>('investments', []);
            investments.push(newInvestment);
            setStorageItem('investments', investments);

            const tx1: Transaction = {
              id: 'tx_dep_' + Math.random().toString(36).substr(2, 9),
              user_id: dep.user_id,
              type: 'deposit',
              amount: dep.amount,
              description: `Direct Payment Approved for ${plan.name} (Order: ${dep.transaction_id})`,
              created_at: new Date().toISOString()
            };
            const tx2: Transaction = {
              id: 'tx_inv_' + Math.random().toString(36).substr(2, 9),
              user_id: dep.user_id,
              type: 'investment',
              amount: -dep.amount,
              description: `Staked directly in ${plan.name} (Yields: $${plan.return_amount})`,
              created_at: startTime
            };
            txs.unshift(tx1, tx2);
            setStorageItem('transactions', txs);
          }
        } else {
          // Standard deposit
          const uIndex = users.findIndex(u => u.id === dep.user_id);
          if (uIndex !== -1) {
            users[uIndex].balance += dep.amount;
            setStorageItem('users', users);
          }

          const tx: Transaction = {
            id: 'tx_dep_' + Math.random().toString(36).substr(2, 9),
            user_id: dep.user_id,
            type: 'deposit',
            amount: dep.amount,
            description: `Telebirr Deposit Approved (TxID: ${dep.transaction_id})`,
            created_at: new Date().toISOString()
          };
          txs.unshift(tx);
          setStorageItem('transactions', txs);
        }
      }

      return deposits[depIndex];
    }
  },

  // ==========================================
  // WITHDRAWALS SERVICES
  // ==========================================

  async getWithdrawals(userId?: string): Promise<Withdrawal[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('withdrawals').select(`
        *,
        users(full_name)
      `);
      
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      return (data || []).map((w: any) => ({
        ...w,
        user_name: w.users?.full_name || 'Tesla Investor'
      })) as Withdrawal[];
    } else {
      const withdrawals = getStorageItem<Withdrawal[]>('withdrawals', []);
      const users = getStorageItem<DbUser[]>('users', []);
      
      const filtered = userId ? withdrawals.filter(w => w.user_id === userId) : withdrawals;

      return filtered.map(w => {
        const u = users.find(usr => usr.id === w.user_id);
        return {
          ...w,
          user_name: u ? u.full_name : 'Tesla Investor'
        };
      }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async createWithdrawal(userId: string, amount: number, telebirrNumber: string): Promise<Withdrawal> {
    const user = await this.getCurrentUser(userId);
    if (!user) throw new Error('User not found');
    if (user.balance < amount) throw new Error('Insufficient wallet balance for withdrawal');

    const newWithdrawal: Withdrawal = {
      id: 'wd_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      amount,
      telebirr_number: telebirrNumber,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      // 1. Lock funds by deducting immediately
      const { error: balanceErr } = await supabase
        .from('users')
        .update({ balance: user.balance - amount })
        .eq('id', userId);
      if (balanceErr) throw balanceErr;

      // 2. Submit record
      const { data, error } = await supabase
        .from('withdrawals')
        .insert([newWithdrawal])
        .select()
        .single();
      if (error) throw error;

      // 3. Log transaction (negative amount since balance is deducted)
      const tx: Omit<Transaction, 'id'> = {
        user_id: userId,
        type: 'withdrawal',
        amount: -amount,
        description: `Withdrawal request submitted (Telebirr: ${telebirrNumber})`,
        created_at: new Date().toISOString()
      };
      await supabase.from('transactions').insert([tx]);

      return data as Withdrawal;
    } else {
      // Local Database Simulator
      const users = getStorageItem<DbUser[]>('users', []);
      const uIndex = users.findIndex(u => u.id === userId);
      if (uIndex === -1) throw new Error('User not found');

      // Deduct balance locally
      users[uIndex].balance -= amount;
      setStorageItem('users', users);

      // Save request
      const withdrawals = getStorageItem<Withdrawal[]>('withdrawals', []);
      withdrawals.unshift(newWithdrawal);
      setStorageItem('withdrawals', withdrawals);

      // Write transaction log
      const tx: Transaction = {
        id: 'tx_wd_' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        type: 'withdrawal',
        amount: -amount,
        description: `Withdrawal request submitted (Telebirr: ${telebirrNumber})`,
        created_at: new Date().toISOString()
      };
      const txs = getStorageItem<Transaction[]>('transactions', []);
      txs.unshift(tx);
      setStorageItem('transactions', txs);

      return newWithdrawal;
    }
  },

  async updateWithdrawalStatus(id: string, status: 'approved' | 'rejected'): Promise<Withdrawal> {
    if (isSupabaseConfigured && supabase) {
      const { data: wd, error: getErr } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('id', id)
        .single();
      if (getErr) throw getErr;

      if (wd.status !== 'pending') {
        throw new Error('This withdrawal request has already been processed');
      }

      // Update request status
      const { data, error } = await supabase
        .from('withdrawals')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // If rejected, refund the user balance & write refund transaction
      if (status === 'rejected') {
        const { data: user, error: userErr } = await supabase
          .from('users')
          .select('*')
          .eq('id', wd.user_id)
          .single();
        if (userErr) throw userErr;

        await supabase
          .from('users')
          .update({ balance: user.balance + wd.amount })
          .eq('id', wd.user_id);

        const tx: Omit<Transaction, 'id'> = {
          user_id: wd.user_id,
          type: 'bonus',
          amount: wd.amount,
          description: `Telebirr Withdrawal Rejected: Refund of $${wd.amount}`,
          created_at: new Date().toISOString()
        };
        await supabase.from('transactions').insert([tx]);
      }

      return data as Withdrawal;
    } else {
      // Local Database Simulator
      const withdrawals = getStorageItem<Withdrawal[]>('withdrawals', []);
      const users = getStorageItem<DbUser[]>('users', []);
      const txs = getStorageItem<Transaction[]>('transactions', []);

      const wdIndex = withdrawals.findIndex(w => w.id === id);
      if (wdIndex === -1) throw new Error('Withdrawal request not found');

      const wd = withdrawals[wdIndex];
      if (wd.status !== 'pending') {
        throw new Error('This withdrawal request has already been processed');
      }

      withdrawals[wdIndex].status = status;
      setStorageItem('withdrawals', withdrawals);

      if (status === 'rejected') {
        const uIndex = users.findIndex(u => u.id === wd.user_id);
        if (uIndex !== -1) {
          users[uIndex].balance += wd.amount;
          setStorageItem('users', users);
        }

        const tx: Transaction = {
          id: 'tx_wd_ref_' + Math.random().toString(36).substr(2, 9),
          user_id: wd.user_id,
          type: 'bonus',
          amount: wd.amount,
          description: `Telebirr Withdrawal Rejected: Refund of $${wd.amount}`,
          created_at: new Date().toISOString()
        };
        txs.unshift(tx);
        setStorageItem('transactions', txs);
      }

      return withdrawals[wdIndex];
    }
  },

  // ==========================================
  // TRANSACTIONS SERVICES
  // ==========================================

  async getTransactions(userId?: string): Promise<Transaction[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('transactions').select('*');
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    } else {
      const txs = getStorageItem<Transaction[]>('transactions', []);
      if (userId) {
        return txs.filter(t => t.user_id === userId);
      }
      return txs;
    }
  },

  // ==========================================
  // ANNOUNCEMENTS SERVICES
  // ==========================================

  async getAnnouncements(): Promise<Announcement[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Error fetching announcements, using default:', error);
        return DEFAULT_ANNOUNCEMENTS;
      }
      return data as Announcement[];
    } else {
      return getStorageItem<Announcement[]>('announcements', DEFAULT_ANNOUNCEMENTS);
    }
  },

  async createAnnouncement(title: string, message: string): Promise<Announcement> {
    const newAnn: Announcement = {
      id: 'ann_' + Math.random().toString(36).substr(2, 9),
      title,
      message,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('announcements')
        .insert([newAnn])
        .select()
        .single();
      if (error) throw error;
      return data as Announcement;
    } else {
      const anns = getStorageItem<Announcement[]>('announcements', DEFAULT_ANNOUNCEMENTS);
      anns.unshift(newAnn);
      setStorageItem('announcements', anns);
      return newAnn;
    }
  },

  // Admin users retrieval helper
  async getUsers(): Promise<DbUser[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbUser[];
    } else {
      return getStorageItem<DbUser[]>('users', []);
    }
  },

  // ==========================================
  // AGENT ACCOUNTS SERVICES
  // ==========================================

  async getAgentAccounts(): Promise<AgentAccount[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('agent_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Error fetching agent accounts from Supabase, loading fallback:', error);
        return DEFAULT_AGENTS;
      }
      return data as AgentAccount[];
    } else {
      return getStorageItem<AgentAccount[]>('agent_accounts', DEFAULT_AGENTS);
    }
  },

  async createAgentAccount(agent: Omit<AgentAccount, 'id' | 'created_at'>): Promise<AgentAccount> {
    const newAgent: AgentAccount = {
      ...agent,
      id: 'agent_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('agent_accounts')
        .insert([newAgent])
        .select()
        .single();
      if (error) throw error;
      return data as AgentAccount;
    } else {
      const agents = getStorageItem<AgentAccount[]>('agent_accounts', DEFAULT_AGENTS);
      agents.unshift(newAgent);
      setStorageItem('agent_accounts', agents);
      return newAgent;
    }
  },

  async updateAgentAccount(id: string, updates: Partial<AgentAccount>): Promise<AgentAccount> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('agent_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AgentAccount;
    } else {
      const agents = getStorageItem<AgentAccount[]>('agent_accounts', DEFAULT_AGENTS);
      const index = agents.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Agent account not found');
      
      agents[index] = { ...agents[index], ...updates };
      setStorageItem('agent_accounts', agents);
      return agents[index];
    }
  },

  async deleteAgentAccount(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('agent_accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const agents = getStorageItem<AgentAccount[]>('agent_accounts', DEFAULT_AGENTS);
      const filtered = agents.filter(a => a.id !== id);
      setStorageItem('agent_accounts', filtered);
      return true;
    }
  }
};
