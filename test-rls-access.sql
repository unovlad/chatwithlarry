-- Тестування RLS доступу для різних сценаріїв
-- Виконайте цей запит в Supabase SQL Editor

-- 1. Перевірка RLS статусу
SELECT 
    'RLS Status Check' as test_name,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- 2. Список всіх політик
SELECT 
    'All Policies' as test_name,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as condition,
    with_check as with_check_condition
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 3. Тест доступу як анонімний користувач
SET LOCAL role TO anon;
SELECT 
    'Anonymous Access Test' as test_name,
    count(*) as user_count
FROM public.users;

-- 4. Тест доступу як аутентифікований користувач
SET LOCAL role TO authenticated;
SELECT 
    'Authenticated Access Test' as test_name,
    count(*) as user_count
FROM public.users;

-- 5. Тест доступу до конкретного користувача
SET LOCAL role TO authenticated;
SELECT 
    'Specific User Access Test' as test_name,
    id,
    email,
    messages_limit,
    subscription_plan
FROM public.users 
WHERE id = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';

-- 6. Перевірка JWT токену в контексті
SELECT 
    'JWT Context Check' as test_name,
    current_setting('request.jwt.claims', true) as jwt_claims,
    current_setting('request.jwt.claim.sub', true) as user_id_from_jwt,
    current_setting('request.jwt.claim.email', true) as email_from_jwt;

-- 7. Тест з імітацією JWT токену
SET LOCAL "request.jwt.claim.sub" = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';
SET LOCAL "request.jwt.claim.email" = 'tomhestamp@gmail.com';

SELECT 
    'JWT Simulation Test' as test_name,
    id,
    email,
    messages_limit
FROM public.users 
WHERE id = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';

-- 8. Перевірка дозволів для ролей
SELECT 
    'Role Permissions' as test_name,
    r.rolname as role_name,
    t.privilege_type,
    t.is_grantable
FROM pg_roles r
LEFT JOIN information_schema.table_privileges t 
    ON t.grantee = r.rolname 
    AND t.table_name = 'users'
WHERE r.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY r.rolname, t.privilege_type;

