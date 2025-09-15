-- Створення нового користувача b63fdbc1-1946-4b32-834e-9fd9b76d5c23
-- Виконайте цей запит в Supabase SQL Editor

-- Встановлюємо service_role для обходу RLS
SET LOCAL role TO service_role;

-- Перевіряємо чи існує користувач в auth.users
SELECT 
    'Auth User Check' as check_type,
    id,
    email,
    created_at
FROM auth.users 
WHERE id = 'b63fdbc1-1946-4b32-834e-9fd9b76d5c23';

-- Перевіряємо чи існує користувач в public.users
SELECT 
    'Public User Check' as check_type,
    id,
    email,
    full_name,
    messages_limit
FROM public.users 
WHERE id = 'b63fdbc1-1946-4b32-834e-9fd9b76d5c23';

-- Створюємо користувача в public.users
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
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email),
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
    au.created_at,
    NOW()
FROM auth.users au
WHERE au.id = 'b63fdbc1-1946-4b32-834e-9fd9b76d5c23'
ON CONFLICT (id) DO NOTHING;

-- Перевіряємо результат
SELECT 
    'User Created' as result,
    id,
    email,
    full_name,
    messages_limit,
    subscription_plan,
    created_at
FROM public.users 
WHERE id = 'b63fdbc1-1946-4b32-834e-9fd9b76d5c23';

