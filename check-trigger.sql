-- Перевірка database trigger для автоматичного створення користувачів
-- Виконайте цей запит в Supabase SQL Editor

-- 1. Перевірка чи існує trigger
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- 2. Перевірка функції trigger
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%user%' 
AND routine_schema = 'public';

-- 3. Перевірка чи є функція handle_new_user
SELECT 
    'Function exists' as check,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- 4. Якщо trigger не існує, створимо його
-- Розкоментуйте ці рядки якщо trigger не існує:

/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, subscription_plan, subscription_status, messages_used, messages_limit, monthly_reset_date, trial_used, onboarding_completed, timezone, language, notification_settings, user_preferences, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'free',
    'active',
    0,
    30,
    NOW() + INTERVAL '30 days',
    false,
    false,
    'UTC',
    'en',
    '{}',
    '{}',
    NOW(),
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
*/

