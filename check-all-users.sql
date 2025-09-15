-- Перевірка всіх користувачів в public.users
-- Виконайте цей запит в Supabase SQL Editor

-- 1. Перевірка всіх користувачів в public.users
SELECT 
    'Public Users' as table_name,
    id,
    email,
    full_name,
    messages_limit,
    subscription_plan,
    created_at
FROM public.users 
ORDER BY created_at DESC;

-- 2. Перевірка конкретних користувачів
SELECT 
    'Specific Users Check' as check_type,
    id,
    email,
    CASE 
        WHEN id IN ('a237fa80-77b1-47bb-a5b7-40c63c7e3285', 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39', 'd566808d-475e-4b8a-ab1e-e1483dd043e9', 'fe34ee82-0c0a-4df7-8b1f-907ba0468d48')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM public.users 
WHERE id IN ('a237fa80-77b1-47bb-a5b7-40c63c7e3285', 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39', 'd566808d-475e-4b8a-ab1e-e1483dd043e9', 'fe34ee82-0c0a-4df7-8b1f-907ba0468d48');

-- 3. Перевірка trigger функції
SELECT 
    'Trigger Function' as check_type,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- 4. Перевірка trigger
SELECT 
    'Trigger Info' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

