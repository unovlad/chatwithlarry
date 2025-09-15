-- Тест після виправлення RLS політик
-- Виконайте цей запит в Supabase SQL Editor

-- 1. Перевірка RLS статусу
SELECT 
    'RLS Status' as test,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- 2. Перевірка політик
SELECT 
    'Policies' as test,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as condition
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 3. Тест доступу як анонімний користувач (має повернути 0 рядків)
SET LOCAL role TO anon;
SELECT 
    'Anonymous Access' as test,
    count(*) as user_count
FROM public.users;

-- 4. Тест доступу як аутентифікований користувач без JWT (має повернути 0 рядків)
SET LOCAL role TO authenticated;
SELECT 
    'Authenticated without JWT' as test,
    count(*) as user_count
FROM public.users;

-- 5. Тест з імітацією JWT токену
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claim.sub" = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';
SET LOCAL "request.jwt.claim.email" = 'tomhestamp@gmail.com';

SELECT 
    'Authenticated with JWT' as test,
    id,
    email,
    messages_limit,
    subscription_plan
FROM public.users 
WHERE id = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';

-- 6. Тест з неправильним JWT токеном (має повернути 0 рядків)
SET LOCAL "request.jwt.claim.sub" = 'wrong-user-id';

SELECT 
    'Wrong JWT' as test,
    count(*) as user_count
FROM public.users 
WHERE id = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';

-- 7. Перевірка auth.uid() функції
SET LOCAL "request.jwt.claim.sub" = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';
SELECT 
    'Auth UID Test' as test,
    auth.uid() as current_user_id,
    'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39' as expected_user_id,
    (auth.uid() = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39') as match;

