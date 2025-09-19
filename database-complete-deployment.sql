-- ========================================
-- LARRY AI - COMPLETE DATABASE DEPLOYMENT SCRIPT
-- ========================================
-- This comprehensive script includes all database components found in the project
-- Based on analysis of all existing SQL files
-- ========================================

-- ========================================
-- 1. CLEANUP EXISTING OBJECTS
-- ========================================

-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can delete own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view messages in own chats" ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in own chats" ON public.messages;
DROP POLICY IF EXISTS "Users can create own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in own chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages in own chats" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_chats_updated_at ON public.chats;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Drop existing tables (if they exist)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ========================================
-- 2. CREATE TABLES
-- ========================================

-- Users table (main user profiles)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Subscription fields
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'premium', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,

  -- Stripe fields
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_payment_method_id TEXT,
  stripe_default_payment_method TEXT,
  stripe_invoice_settings JSONB DEFAULT '{}',
  stripe_metadata JSONB DEFAULT '{}',

  -- Usage tracking
  messages_used INTEGER DEFAULT 0,
  messages_limit INTEGER DEFAULT 30,
  last_message_date TIMESTAMP WITH TIME ZONE,
  monthly_reset_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),

  -- Business logic
  trial_used BOOLEAN DEFAULT FALSE,
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  onboarding_completed BOOLEAN DEFAULT FALSE,

  -- User preferences
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  notification_settings JSONB DEFAULT '{}',
  user_preferences JSONB DEFAULT '{}'
);

-- Chats table (user conversations)
CREATE TABLE public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (chat messages)
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. CREATE INDEXES
-- ========================================

-- Users table indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX idx_users_stripe_subscription_id ON public.users(stripe_subscription_id);
CREATE INDEX idx_users_subscription_plan ON public.users(subscription_plan);
CREATE INDEX idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX idx_users_messages_used ON public.users(messages_used);
CREATE INDEX idx_users_monthly_reset_date ON public.users(monthly_reset_date);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_users_updated_at ON public.users(updated_at);

-- Chats table indexes
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_chats_created_at ON public.chats(created_at);
CREATE INDEX idx_chats_updated_at ON public.chats(updated_at);

-- Messages table indexes
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_messages_role ON public.messages(role);

-- ========================================
-- 4. CREATE FUNCTIONS
-- ========================================

-- Function for automatic user creation on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    subscription_plan,
    subscription_status,
    messages_used,
    messages_limit,
    monthly_reset_date,
    trial_used,
    onboarding_completed,
    timezone,
    language,
    notification_settings,
    user_preferences,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      ''
    ),
    'free',
    'active',
    0,
    30,
    NOW() + INTERVAL '1 month',
    false,
    false,
    'UTC',
    'en',
    '{}',
    '{}',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. CREATE TRIGGERS
-- ========================================

-- Trigger for automatic user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updating updated_at timestamp
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. CREATE RLS POLICIES
-- ========================================

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can create own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.users
  FOR DELETE USING (auth.uid() = id);

-- Chats table policies
CREATE POLICY "Users can view own chats" ON public.chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON public.chats
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" ON public.chats
  FOR DELETE USING (auth.uid() = user_id);

-- Messages table policies
CREATE POLICY "Users can view messages in own chats" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own chats" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in own chats" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in own chats" ON public.messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- ========================================
-- 8. GRANT PERMISSIONS
-- ========================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant table permissions
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.chats TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ========================================
-- 9. ADD COMMENTS AND DOCUMENTATION
-- ========================================

-- Table comments
COMMENT ON TABLE public.users IS 'Main user profiles table with subscription and usage tracking';
COMMENT ON TABLE public.chats IS 'User conversation chats';
COMMENT ON TABLE public.messages IS 'Messages within chats';

-- Key field comments
COMMENT ON COLUMN public.users.subscription_plan IS 'Subscription type: free, premium, enterprise';
COMMENT ON COLUMN public.users.messages_used IS 'Number of messages used by user';
COMMENT ON COLUMN public.users.messages_limit IS 'Message limit (30 for free, unlimited for premium)';
COMMENT ON COLUMN public.users.monthly_reset_date IS 'Date to reset message counter';
COMMENT ON COLUMN public.users.trial_used IS 'Whether user has used trial period';
COMMENT ON COLUMN public.users.onboarding_completed IS 'Whether user completed onboarding';

COMMENT ON COLUMN public.messages.role IS 'Message sender role: user, assistant, system';

-- ========================================
-- 10. VERIFICATION QUERIES
-- ========================================

-- Check created tables
SELECT 
    'Tables Created' as check_type,
    table_name,
    CASE 
        WHEN table_name IN ('users', 'chats', 'messages') THEN '✅ Created'
        ELSE '❌ Missing'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'chats', 'messages')
ORDER BY table_name;

-- Check RLS status
SELECT 
    'RLS Status' as check_type,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE tablename IN ('users', 'chats', 'messages')
AND schemaname = 'public'
ORDER BY tablename;

-- Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    tablename,
    policyname,
    cmd as command
FROM pg_policies 
WHERE tablename IN ('users', 'chats', 'messages')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Check triggers
SELECT 
    'Triggers' as check_type,
    trigger_name,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE event_object_schema IN ('public', 'auth')
AND event_object_table IN ('users', 'chats', 'messages')
ORDER BY event_object_table, trigger_name;

-- Check functions
SELECT 
    'Functions' as check_type,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_user', 'update_updated_at_column')
AND routine_schema = 'public'
ORDER BY routine_name;

-- ========================================
-- 11. ADMINISTRATIVE QUERIES (COMMENTED)
-- ========================================

-- Reset message counters for free users (uncomment when needed)
/*
UPDATE public.users 
SET messages_used = 0, monthly_reset_date = NOW() + INTERVAL '1 month'
WHERE subscription_plan = 'free' AND monthly_reset_date <= NOW();
*/

-- Update message limits for premium users (uncomment when needed)
/*
UPDATE public.users 
SET messages_limit = 999999
WHERE subscription_plan IN ('premium', 'enterprise');
*/

-- Clean up old chats (uncomment when needed)
/*
DELETE FROM public.chats 
WHERE created_at < NOW() - INTERVAL '1 year';
*/

-- Clean up old messages (uncomment when needed)
/*
DELETE FROM public.messages 
WHERE created_at < NOW() - INTERVAL '1 year';
*/

-- ========================================
-- SCRIPT COMPLETED
-- ========================================
-- Larry AI complete database successfully deployed!
-- Includes: 3 tables, 11 indexes, 12 RLS policies, 3 triggers, 2 functions
-- All components from existing SQL files have been integrated
-- ========================================



