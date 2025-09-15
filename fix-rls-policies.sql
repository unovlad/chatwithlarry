-- Виправлення RLS політик для таблиці users
-- Виконайте цей запит в Supabase SQL Editor

-- 1. Увімкнути RLS для таблиці users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Видалити існуючі політики (якщо є)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- 3. Створити політику для SELECT (перегляд власного профілю)
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- 4. Створити політику для UPDATE (оновлення власного профілю)
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 5. Створити політику для INSERT (створення профілю)
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 6. Перевірити створені політики
SELECT 
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as condition,
    with_check as with_check_condition
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 7. Перевірити RLS статус
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

