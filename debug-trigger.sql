-- Діагностика trigger
-- Виконайте цей запит в Supabase SQL Editor

-- 1. Перевірка trigger
SELECT 
    'Trigger Status' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- 2. Перевірка функції
SELECT 
    'Function Status' as check_type,
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- 3. Перевірка прав доступу функції
SELECT 
    'Function Permissions' as check_type,
    routine_name,
    security_type,
    definer_rights
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- 4. Тест trigger вручну
-- Розкоментуйте для тестування:
/*
-- Встановлюємо service_role
SET LOCAL role TO service_role;

-- Тестуємо функцію вручну
SELECT public.handle_new_user() FROM auth.users WHERE id = 'b63fdbc1-1946-4b32-834e-9fd9b76d5c23';
*/

-- 5. Перевірка логів (якщо доступно)
-- SELECT * FROM pg_stat_user_functions WHERE funcname = 'handle_new_user';

