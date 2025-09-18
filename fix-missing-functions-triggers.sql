-- ========================================
-- LARRY AI - FIX MISSING FUNCTIONS AND TRIGGERS
-- ========================================
-- This script adds the missing functions and triggers to complete the database setup
-- ========================================

-- ========================================
-- 1. CREATE MISSING FUNCTIONS
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
-- 2. CREATE MISSING TRIGGERS
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
-- 3. VERIFICATION
-- ========================================

-- Check functions were created
SELECT 
    'Functions Created' as check_type,
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'handle_new_user' THEN '✅ Created'
        WHEN routine_name = 'update_updated_at_column' THEN '✅ Created'
        ELSE '❌ Missing'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('handle_new_user', 'update_updated_at_column')
ORDER BY routine_name;

-- Check triggers were created
SELECT 
    'Triggers Created' as check_type,
    trigger_name,
    event_object_table,
    action_timing,
    CASE 
        WHEN trigger_name = 'on_auth_user_created' AND event_object_table = 'users' AND event_object_schema = 'auth' THEN '✅ Created'
        WHEN trigger_name = 'update_users_updated_at' AND event_object_table = 'users' THEN '✅ Created'
        WHEN trigger_name = 'update_chats_updated_at' AND event_object_table = 'chats' THEN '✅ Created'
        ELSE '❌ Missing'
    END as status
FROM information_schema.triggers 
WHERE event_object_schema IN ('public', 'auth')
AND event_object_table IN ('users', 'chats', 'messages')
ORDER BY event_object_table, trigger_name;

-- ========================================
-- 4. FINAL VERIFICATION
-- ========================================

-- Overall status check
SELECT 
    'Final Status' as check_type,
    'Functions' as component,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.routines 
            WHERE routine_schema = 'public'
            AND routine_name IN ('handle_new_user', 'update_updated_at_column')
        ) = 2 THEN '✅ All functions present'
        ELSE '❌ Missing functions'
    END as status

UNION ALL

SELECT 
    'Final Status' as check_type,
    'Triggers' as component,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.triggers 
            WHERE event_object_schema IN ('public', 'auth')
            AND event_object_table IN ('users', 'chats', 'messages')
        ) >= 3 THEN '✅ All triggers present'
        ELSE '❌ Missing triggers'
    END as status

UNION ALL

SELECT 
    'Final Status' as check_type,
    'Database Complete' as component,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'chats', 'messages')
        ) = 3 
        AND (
            SELECT COUNT(*) FROM pg_policies 
            WHERE schemaname = 'public'
            AND tablename IN ('users', 'chats', 'messages')
        ) = 12
        AND (
            SELECT COUNT(*) FROM information_schema.routines 
            WHERE routine_schema = 'public'
            AND routine_name IN ('handle_new_user', 'update_updated_at_column')
        ) = 2
        AND (
            SELECT COUNT(*) FROM information_schema.triggers 
            WHERE event_object_schema IN ('public', 'auth')
            AND event_object_table IN ('users', 'chats', 'messages')
        ) >= 3
        THEN '✅ DATABASE COMPLETE - All components present'
        ELSE '⚠️ Some components still missing'
    END as status;

-- ========================================
-- SCRIPT COMPLETED
-- ========================================
-- Missing functions and triggers have been added
-- Your database should now be complete and match the deployment script
-- ========================================

