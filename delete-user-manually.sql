-- Видалення користувача вручну з БД
-- Виконайте цей запит в Supabase SQL Editor

-- ВАРІАНТ 1: Використання service_role (рекомендований)
-- Встановлюємо роль service_role для обходу RLS
SET LOCAL role TO service_role;

-- Видаляємо користувача
DELETE FROM public.users 
WHERE id = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';

-- Перевіряємо результат
SELECT 'User deleted' as result, count(*) as remaining_users 
FROM public.users 
WHERE id = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';

-- ВАРІАНТ 2: Тимчасове відключення RLS (альтернативний)
-- Розкоментуйте ці рядки якщо перший варіант не працює:

-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- DELETE FROM public.users WHERE id = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ВАРІАНТ 3: Видалення через auth.users (якщо потрібно видалити повністю)
-- Розкоментуйте якщо потрібно видалити користувача з auth.users:

-- DELETE FROM auth.users WHERE id = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';

