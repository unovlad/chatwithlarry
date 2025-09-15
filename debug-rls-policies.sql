-- Перевірка RLS політик для таблиці users
-- Виконайте цей запит в Supabase SQL Editor

-- 1. Перевірка чи увімкнений RLS для таблиці users
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- 2. Перевірка всіх RLS політик для таблиці users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 3. Перевірка поточного користувача та його ролі
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_setting('role') as current_role;

-- 4. Перевірка чи є користувач в auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE id = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';

-- 5. Перевірка чи є користувач в public.users
SELECT 
    id,
    email,
    full_name,
    messages_limit,
    subscription_plan
FROM public.users 
WHERE id = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';

-- 6. Тест запиту з поточним користувачем
SELECT 
    'Test query result' as test,
    id,
    email,
    messages_limit
FROM public.users 
WHERE id = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';

-- 7. Перевірка дозволів для поточного користувача
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'users' 
AND table_schema = 'public';

-- 8. Перевірка RLS контексту
SELECT 
    current_setting('request.jwt.claims', true) as jwt_claims,
    current_setting('request.jwt.claim.sub', true) as user_id_from_jwt;

