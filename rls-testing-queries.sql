-- ========================================
-- ПРАВИЛЬНІ SQL ЗАПИТИ ДЛЯ ПЕРЕВІРКИ RLS
-- ========================================

-- ВАЖЛИВО: Запускайте ці запити в правильному порядку!

-- 1. ПЕРЕВІРКА ПОТОЧНОЇ РОЛІ ТА ДОЗВОЛІВ
-- ========================================

-- Перевірка поточної ролі
SELECT 
    'Current Role Check' as test_type,
    current_user as current_user,
    session_user as session_user,
    current_setting('role') as current_role;

-- Перевірка JWT контексту (якщо є)
SELECT 
    'JWT Context Check' as test_type,
    current_setting('request.jwt.claims', true) as jwt_claims,
    current_setting('request.jwt.claim.sub', true) as user_id_from_jwt,
    current_setting('request.jwt.claim.email', true) as email_from_jwt;

-- 2. ПЕРЕВІРКА RLS СТАТУСУ (БЕЗ ДОСТУПУ ДО ДАНИХ)
-- ========================================

-- Перевірка чи увімкнений RLS
SELECT 
    'RLS Status Check' as test_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename;

-- Перевірка політик RLS
SELECT 
    'RLS Policies Check' as test_type,
    schemaname,
    tablename,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as condition
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename, policyname;

-- 3. ПЕРЕВІРКА ТРИГЕРІВ ТА ФУНКЦІЙ
-- ========================================

-- Перевірка trigger для створення користувачів
SELECT 
    'Trigger Check' as test_type,
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table,
    event_object_schema
FROM information_schema.triggers 
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- Перевірка функції handle_new_user
SELECT 
    'Function Check' as test_type,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- 4. ПЕРЕВІРКА ДОЗВОЛІВ РОЛЕЙ
-- ========================================

-- Дозволи для різних ролей
SELECT 
    'Role Permissions' as test_type,
    r.rolname as role_name,
    t.table_name,
    t.privilege_type,
    t.is_grantable
FROM pg_roles r
LEFT JOIN information_schema.table_privileges t 
    ON t.grantee = r.rolname 
    AND t.table_schema = 'public'
    AND t.table_name IN ('users', 'chats', 'messages')
WHERE r.rolname IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY r.rolname, t.table_name, t.privilege_type;

-- 5. ТЕСТУВАННЯ ДОСТУПУ З РІЗНИМИ РОЛЯМИ
-- ========================================

-- Тест 1: Анонімний доступ (має повернути 0 записів)
SET LOCAL role TO anon;
SELECT 
    'Anonymous Access Test' as test_type,
    'users' as table_name,
    count(*) as accessible_records
FROM public.users;

-- Тест 2: Аутентифікований доступ без JWT (має повернути 0 записів)
SET LOCAL role TO authenticated;
SELECT 
    'Authenticated Access (No JWT)' as test_type,
    'users' as table_name,
    count(*) as accessible_records
FROM public.users;

-- Тест 3: Service role доступ (має повернути всі записи)
SET LOCAL role TO service_role;
SELECT 
    'Service Role Access' as test_type,
    'users' as table_name,
    count(*) as accessible_records
FROM public.users;

-- 6. ПЕРЕВІРКА ДАНИХ З SERVICE_ROLE
-- ========================================

-- Перевірка користувачів (тільки з service_role)
SET LOCAL role TO service_role;

SELECT 
    'Users Overview' as test_type,
    id,
    email,
    full_name,
    subscription_plan,
    subscription_status,
    messages_used,
    messages_limit,
    created_at
FROM public.users 
ORDER BY created_at DESC
LIMIT 10;

-- Перевірка чатів
SELECT 
    'Chats Overview' as test_type,
    id,
    user_id,
    title,
    created_at,
    updated_at
FROM public.chats 
ORDER BY created_at DESC
LIMIT 10;

-- Перевірка повідомлень
SELECT 
    'Messages Overview' as test_type,
    id,
    chat_id,
    role,
    length(content) as content_length,
    created_at
FROM public.messages 
ORDER BY created_at DESC
LIMIT 10;

-- 7. СТАТИСТИКА СИСТЕМИ
-- ========================================

-- Статистика користувачів
SELECT 
    'User Statistics' as test_type,
    subscription_plan,
    count(*) as user_count,
    avg(messages_used) as avg_messages_used,
    max(messages_used) as max_messages_used
FROM public.users 
GROUP BY subscription_plan;

-- Статистика використання
SELECT 
    'Usage Statistics' as test_type,
    count(*) as total_users,
    count(case when messages_used >= messages_limit then 1 end) as users_at_limit,
    sum(messages_used) as total_messages_used
FROM public.users;

-- 8. ПЕРЕВІРКА ЦІЛІСНОСТІ ДАНИХ
-- ========================================

-- Перевірка orphaned записів
SELECT 
    'Data Integrity Check' as test_type,
    'Orphaned Chats' as issue_type,
    count(*) as count
FROM public.chats c
LEFT JOIN public.users u ON c.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'Data Integrity Check' as test_type,
    'Orphaned Messages' as issue_type,
    count(*) as count
FROM public.messages m
LEFT JOIN public.chats c ON m.chat_id = c.id
WHERE c.id IS NULL;

-- 9. ПЕРЕВІРКА ІНДЕКСІВ
-- ========================================

-- Перевірка індексів
SELECT 
    'Indexes Check' as test_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename, indexname;

-- 10. ПЕРЕВІРКА CONSTRAINTS
-- ========================================

-- Перевірка check constraints
SELECT 
    'Check Constraints' as test_type,
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('users', 'chats', 'messages')
AND tc.constraint_type = 'CHECK';

-- 11. ПЕРЕВІРКА РОЗМІРУ ТАБЛИЦЬ
-- ========================================

-- Розмір таблиць
SELECT 
    'Table Sizes' as test_type,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 12. ТЕСТУВАННЯ JWT СИМУЛЯЦІЇ
-- ========================================

-- Симуляція JWT токену для тестування
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claim.sub" = 'test-user-id';
SET LOCAL "request.jwt.claim.email" = 'test@example.com';

-- Тест доступу з симульованим JWT
SELECT 
    'JWT Simulation Test' as test_type,
    'users' as table_name,
    count(*) as accessible_records
FROM public.users;

-- 13. ПЕРЕВІРКА AUTH.USERS
-- ========================================

-- Перевірка користувачів в auth.users (тільки з service_role)
SET LOCAL role TO service_role;

SELECT 
    'Auth Users Check' as test_type,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- 14. ПОРІВНЯННЯ AUTH.USERS ТА PUBLIC.USERS
-- ========================================

-- Перевірка синхронізації між auth.users та public.users
SELECT 
    'User Sync Check' as test_type,
    'Users in auth but not in public' as issue_type,
    count(*) as count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL

UNION ALL

SELECT 
    'User Sync Check' as test_type,
    'Users in public but not in auth' as issue_type,
    count(*) as count
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;

-- 15. ФІНАЛЬНА ПЕРЕВІРКА СИСТЕМИ
-- ========================================

-- Загальний статус системи
SELECT 
    'System Status' as test_type,
    'RLS Enabled Tables' as metric,
    count(*) as value
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
AND rowsecurity = true

UNION ALL

SELECT 
    'System Status' as test_type,
    'Active RLS Policies' as metric,
    count(*) as value
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')

UNION ALL

SELECT 
    'System Status' as test_type,
    'Total Users' as metric,
    count(*) as value
FROM public.users

UNION ALL

SELECT 
    'System Status' as test_type,
    'Total Chats' as metric,
    count(*) as value
FROM public.chats

UNION ALL

SELECT 
    'System Status' as test_type,
    'Total Messages' as metric,
    count(*) as value
FROM public.messages;
