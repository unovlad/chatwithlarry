-- Перевірка чи існує користувач в БД
-- Виконайте цей запит в Supabase SQL Editor

-- 1. Перевірка в auth.users
SELECT 
    'Auth Users' as table_name,
    id,
    email,
    created_at
FROM auth.users 
WHERE id = 'fe34ee82-0c0a-4df7-8b1f-907ba0468d48';

-- 2. Перевірка в public.users
SELECT 
    'Public Users' as table_name,
    id,
    email,
    full_name,
    messages_limit,
    subscription_plan
FROM public.users 
WHERE id = 'fe34ee82-0c0a-4df7-8b1f-907ba0468d48';

-- 3. Перевірка всіх користувачів в public.users
SELECT 
    'All Public Users' as table_name,
    id,
    email,
    full_name,
    created_at
FROM public.users 
ORDER BY created_at DESC;

-- 4. Перевірка всіх користувачів в auth.users
SELECT 
    'All Auth Users' as table_name,
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC;

