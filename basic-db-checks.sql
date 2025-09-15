-- ========================================
-- БАЗОВІ ПЕРЕВІРКИ БД (БЕЗ ПОМИЛОК ДОСТУПУ)
-- ========================================

-- 1. ПЕРЕВІРКА СТРУКТУРИ ТАБЛИЦЬ
-- ========================================
SELECT 
    'Table Structure' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'chats', 'messages')
ORDER BY table_name, ordinal_position;

-- 2. ПЕРЕВІРКА RLS СТАТУСУ
-- ========================================
SELECT 
    'RLS Status' as check_type,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'chats', 'messages')
AND schemaname = 'public';

-- 3. ПЕРЕВІРКА RLS ПОЛІТИК
-- ========================================
SELECT 
    'RLS Policies' as check_type,
    tablename,
    policyname,
    cmd as command,
    permissive
FROM pg_policies 
WHERE tablename IN ('users', 'chats', 'messages')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. ПЕРЕВІРКА ТРИГЕРІВ
-- ========================================
SELECT 
    'Triggers' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- 5. ПЕРЕВІРКА ФУНКЦІЙ
-- ========================================
SELECT 
    'Functions' as check_type,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- 6. ПЕРЕВІРКА ІНДЕКСІВ
-- ========================================
SELECT 
    'Indexes' as check_type,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename, indexname;

-- 7. ПЕРЕВІРКА CONSTRAINTS
-- ========================================
SELECT 
    'Constraints' as check_type,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('users', 'chats', 'messages')
ORDER BY tc.table_name, tc.constraint_type;

-- 8. ПЕРЕВІРКА РОЗМІРУ ТАБЛИЦЬ
-- ========================================
SELECT 
    'Table Sizes' as check_type,
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY pg_total_relation_size('public.'||tablename) DESC;

-- 9. ПЕРЕВІРКА ПОТОЧНОЇ РОЛІ
-- ========================================
SELECT 
    'Current Role' as check_type,
    current_user as current_user,
    session_user as session_user;

-- 10. ПЕРЕВІРКА JWT КОНТЕКСТУ
-- ========================================
SELECT 
    'JWT Context' as check_type,
    current_setting('request.jwt.claims', true) as jwt_claims,
    current_setting('request.jwt.claim.sub', true) as user_id_from_jwt;
