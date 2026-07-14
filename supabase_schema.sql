-- ========================================================
-- TESLA INVESTMENT LIMITED - SUPABASE DATABASE BLUEPRINT
-- ========================================================
-- Copy and paste this script into the Supabase SQL Editor to set up
-- the exact database schema, tables, and security policy rules!

-- 1. USERS PROFILE TABLE
-- Syncs with Supabase Auth users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  balance NUMERIC(15, 2) DEFAULT 10.00 NOT NULL, -- Defaults to $10.00 sign-up bonus
  total_profit NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. INVESTMENT PLANS TABLE
CREATE TABLE IF NOT EXISTS public.investment_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  return_amount NUMERIC(15, 2) NOT NULL,
  duration_hours INTEGER DEFAULT 24 NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')) NOT NULL
);

ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;

-- 3. INVESTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.investments (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  plan_id TEXT REFERENCES public.investment_plans(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL,
  expected_return NUMERIC(15, 2) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')) NOT NULL
);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- 4. DEPOSITS (RECHARGES) TABLE
CREATE TABLE IF NOT EXISTS public.deposits (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  screenshot_url TEXT NOT NULL, -- Base64 encoded screenshot or image URL
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- 5. WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  telebirr_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- 6. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('deposit', 'withdrawal', 'investment', 'profit', 'bonus')) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 7. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;


-- ========================================================
-- SEED INITIAL DATA (DEFAULT PLANS & ANNOUNCEMENTS)
-- ========================================================

INSERT INTO public.investment_plans (id, name, amount, return_amount, duration_hours, status)
VALUES
  ('plan_model3', 'Tesla Model 3 Starter', 50.00, 65.00, 24, 'active'),
  ('plan_modely', 'Tesla Model Y Premium', 200.00, 280.00, 24, 'active'),
  ('plan_models', 'Tesla Model S Elite', 500.00, 750.00, 24, 'active'),
  ('plan_cybertruck', 'Tesla CyberTruck Sovereign', 1500.00, 2400.00, 24, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.announcements (id, title, message, created_at)
VALUES
  ('ann_1', '⚡ Welcome to TESLA INVESTMENT LIMITED', 'We are thrilled to launch the world''s most high-yield clean energy investment platform. Invest in Tesla clean projects and receive guaranteed 24-hour returns of up to 60%! Join our sustainable revolution today.', now()),
  ('ann_2', '📱 Telebirr Deposits & Withdrawals Active', 'To facilitate immediate and secure local transfers, we have fully integrated Telebirr. Deposits are processed under 15 minutes. To begin, navigate to the Wallet screen, copy our payment details, and submit your transaction ID.', now() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;


-- ========================================================
-- ROW-LEVEL SECURITY (RLS) POLICY RULES
-- ========================================================

-- Policies for public.users
CREATE POLICY "Allow users to read their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id OR (SELECT is_admin FROM public.users WHERE id = auth.uid()) = TRUE);

CREATE POLICY "Allow public signup trigger profile insert" ON public.users
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Allow profile updates by self or admins" ON public.users
  FOR UPDATE USING (auth.uid() = id OR (SELECT is_admin FROM public.users WHERE id = auth.uid()) = TRUE);

-- Policies for public.investment_plans
CREATE POLICY "Allow anyone to view plans" ON public.investment_plans
  FOR SELECT USING (TRUE);

CREATE POLICY "Allow admins to modify plans" ON public.investment_plans
  ALL USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = TRUE);

-- Policies for public.investments
CREATE POLICY "Allow users to view their own investments" ON public.investments
  FOR SELECT USING (auth.uid() = user_id OR (SELECT is_admin FROM public.users WHERE id = auth.uid()) = TRUE);

CREATE POLICY "Allow users to insert investments" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow updates to investments by self/system/admin" ON public.investments
  FOR UPDATE USING (auth.uid() = user_id OR (SELECT is_admin FROM public.users WHERE id = auth.uid()) = TRUE);

-- Policies for public.deposits
CREATE POLICY "Allow users to view their own deposits" ON public.deposits
  FOR SELECT USING (auth.uid() = user_id OR (SELECT is_admin FROM public.users WHERE id = auth.uid()) = TRUE);

CREATE POLICY "Allow users to submit deposits" ON public.deposits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admins to update deposits" ON public.deposits
  FOR UPDATE USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = TRUE);

-- Policies for public.withdrawals
CREATE POLICY "Allow users to view their own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = user_id OR (SELECT is_admin FROM public.users WHERE id = auth.uid()) = TRUE);

CREATE POLICY "Allow users to submit withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admins to update withdrawals" ON public.withdrawals
  FOR UPDATE USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = TRUE);

-- Policies for public.transactions
CREATE POLICY "Allow users to view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id OR (SELECT is_admin FROM public.users WHERE id = auth.uid()) = TRUE);

CREATE POLICY "Allow users to log transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for public.announcements
CREATE POLICY "Allow everyone to view announcements" ON public.announcements
  FOR SELECT USING (TRUE);

CREATE POLICY "Allow admins to manage announcements" ON public.announcements
  ALL USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = TRUE);


-- ========================================================
-- AUTOMATIC AUTH PROFILE TRIGGER
-- ========================================================
-- Automatically creates a user entry in the public.users table 
-- whenever a user registers with Supabase Authentication.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, balance, total_profit, is_admin)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Tesla Investor'),
    new.email,
    10.00, -- Sign-up bonus credit
    0.00,
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
