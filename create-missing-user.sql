-- Створення відсутнього користувача в public.users
-- Виконайте цей запит в Supabase SQL Editor

-- Використовуємо service_role для обходу RLS
SET LOCAL role TO service_role;

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
) VALUES (
    'fe34ee82-0c0a-4df7-8b1f-907ba0468d48',
    'hestamp@gmail.com',
    'hestamp@gmail.com',
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

-- Перевіряємо результат
SELECT 
    'User Created' as result,
    id,
    email,
    full_name,
    messages_limit,
    subscription_plan
FROM public.users 
WHERE id = 'fe34ee82-0c0a-4df7-8b1f-907ba0468d48';

