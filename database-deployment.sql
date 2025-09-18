-- ========================================
-- LARRY AI - COMPREHENSIVE DATABASE DEPLOYMENT SCRIPT
-- ========================================
-- This script creates the complete database structure for Larry AI
-- Includes: tables, indexes, RLS policies, triggers, functions
-- ========================================

-- ========================================
-- 1. SAFE CLEANUP EXISTING OBJECTS
-- ========================================

-- Only drop objects if they exist to avoid errors on clean database
DO $$
BEGIN
    -- Drop old RLS policies only if tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chats') THEN
        DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
        DROP POLICY IF EXISTS "Users can create own chats" ON public.chats;
        DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;
        DROP POLICY IF EXISTS "Users can delete own chats" ON public.chats;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        DROP POLICY IF EXISTS "Users can view messages in own chats" ON public.messages;
        DROP POLICY IF EXISTS "Users can create messages in own chats" ON public.messages;
        DROP POLICY IF EXISTS "Users can update messages in own chats" ON public.messages;
        DROP POLICY IF EXISTS "Users can delete messages in own chats" ON public.messages;
    END IF;

    -- Drop old triggers and functions
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP FUNCTION IF EXISTS public.handle_new_user();
    DROP FUNCTION IF EXISTS public.update_updated_at_column();

    -- Drop old tables (if they exist) - CASCADE will handle dependencies
    DROP TABLE IF EXISTS public.messages CASCADE;
    DROP TABLE IF EXISTS public.chats CASCADE;
    DROP TABLE IF EXISTS public.users CASCADE;
END $$;

-- ========================================
-- 2. CREATE TABLES
-- ========================================

-- Users table
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

-- Chats table
CREATE TABLE public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
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

-- Indexes for users table
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX idx_users_stripe_subscription_id ON public.users(stripe_subscription_id);
CREATE INDEX idx_users_subscription_plan ON public.users(subscription_plan);
CREATE INDEX idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX idx_users_messages_used ON public.users(messages_used);
CREATE INDEX idx_users_monthly_reset_date ON public.users(monthly_reset_date);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- Indexes for chats table
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_chats_created_at ON public.chats(created_at);
CREATE INDEX idx_chats_updated_at ON public.chats(updated_at);

-- Indexes for messages table
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_messages_role ON public.messages(role);

-- ========================================
-- 4. CREATE FUNCTIONS
-- ========================================

-- Function for automatic user creation
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

-- Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.users
  FOR DELETE USING (auth.uid() = id);

-- Policies for chats table
CREATE POLICY "Users can view own chats" ON public.chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON public.chats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" ON public.chats
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for messages table
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
-- 8. ADDITIONAL SETTINGS
-- ========================================

-- Allow anonymous access to tables (for verification)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant access to tables
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.chats TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;

-- Allow usage of sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ========================================
-- 9. VERIFICATION
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
-- 10. COMMENTS AND DOCUMENTATION
-- ========================================

-- Table comments
COMMENT ON TABLE public.users IS 'Основна таблиця користувачів Larry AI з підтримкою підписок та лімітів';
COMMENT ON TABLE public.chats IS 'Таблиця чатів користувачів';
COMMENT ON TABLE public.messages IS 'Таблиця повідомлень в чатах';

-- Key field comments
COMMENT ON COLUMN public.users.subscription_plan IS 'Тип підписки: free, premium, enterprise';
COMMENT ON COLUMN public.users.messages_used IS 'Кількість використаних повідомлень';
COMMENT ON COLUMN public.users.messages_limit IS 'Ліміт повідомлень (30 для free, безліміт для premium)';
COMMENT ON COLUMN public.users.monthly_reset_date IS 'Дата скидання лічильника повідомлень';

COMMENT ON COLUMN public.messages.role IS 'Роль відправника: user, assistant, system';

-- ========================================
-- SCRIPT COMPLETED
-- ========================================
-- Larry AI database successfully deployed!
-- Includes: 3 tables, 8 indexes, 12 RLS policies, 3 triggers, 2 functions
-- ========================================
