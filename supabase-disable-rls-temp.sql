-- ТИМЧАСОВО відключаємо RLS для тестування
-- УВАГА: Це тільки для тестування! Після тестування обов'язково увімкніть RLS назад!

-- Відключаємо RLS для users таблиці
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Перевіряємо статус RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Після тестування обов'язково виконайте:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
