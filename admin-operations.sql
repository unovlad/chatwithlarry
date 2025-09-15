-- Операції адміністратора з користувачами
-- Виконайте цей запит в Supabase SQL Editor

-- ВАРІАНТ 1: Використання service_role (рекомендований)
-- Встановлюємо роль service_role для обходу RLS
SET LOCAL role TO service_role;

-- Перегляд всіх користувачів
SELECT 
    'All Users' as operation,
    id,
    email,
    full_name,
    messages_limit,
    subscription_plan,
    messages_used,
    created_at
FROM public.users 
ORDER BY created_at DESC;

-- Оновлення користувача (приклад)
-- UPDATE public.users 
-- SET messages_limit = 50, subscription_plan = 'premium'
-- WHERE id = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';

-- Видалення користувача (приклад)
-- DELETE FROM public.users 
-- WHERE id = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';

-- ВАРІАНТ 2: Тимчасове відключення RLS (альтернативний)
-- Розкоментуйте ці рядки якщо потрібно:

/*
-- Відключити RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Виконати операції
SELECT * FROM public.users;
UPDATE public.users SET messages_limit = 50 WHERE id = 'some-id';
DELETE FROM public.users WHERE id = 'some-id';

-- Увімкнути RLS назад
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
*/

-- ВАРІАНТ 3: Створення адміністративної політики
-- Розкоментуйте якщо потрібно дозволити адміністраторам доступ:

/*
-- Додати політику для адміністраторів
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');
*/

