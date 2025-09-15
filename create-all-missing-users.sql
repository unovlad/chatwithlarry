-- Створення всіх відсутніх користувачів в public.users
-- Виконайте цей запит в Supabase SQL Editor

-- Використовуємо service_role для обходу RLS
SET LOCAL role TO service_role;

-- Створюємо всіх відсутніх користувачів
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
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
AND au.id IN (
    'a237fa80-77b1-47bb-a5b7-40c63c7e3285',
    'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39', 
    'd566808d-475e-4b8a-ab1e-e1483dd043e9',
    'fe34ee82-0c0a-4df7-8b1f-907ba0468d48'
);

-- Перевіряємо результат
SELECT 
    'Users Created' as result,
    id,
    email,
    full_name,
    messages_limit,
    subscription_plan
FROM public.users 
WHERE id IN (
    'a237fa80-77b1-47bb-a5b7-40c63c7e3285',
    'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39', 
    'd566808d-475e-4b8a-ab1e-e1483dd043e9',
    'fe34ee82-0c0a-4df7-8b1f-907ba0468d48'
)
ORDER BY created_at DESC;

