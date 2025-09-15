-- ========================================
-- SQL ІНЖЕКТИ ДЛЯ ПЕРЕВІРКИ СТРУКТУРИ БД
-- ========================================

-- 1. ПЕРЕВІРКА СТРУКТУРИ ТАБЛИЦЬ
-- ========================================

-- Перевірка всіх таблиць в public схемі
SELECT 
    'Table Structure Check' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'chats', 'messages')
ORDER BY table_name, ordinal_position;

-- Перевірка foreign key constraints
SELECT 
    'Foreign Keys Check' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('users', 'chats', 'messages');

-- 2. ПЕРЕВІРКА RLS СТАТУСУ
-- ========================================

-- Перевірка чи увімкнений RLS для всіх таблиць
SELECT 
    'RLS Status Check' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename;

-- 3. ПЕРЕВІРКА RLS ПОЛІТИК
-- ========================================

-- Всі політики для таблиці users
SELECT 
    'Users RLS Policies' as check_type,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as condition,
    with_check as with_check_condition
FROM pg_policies 
WHERE tablename = 'users'
AND schemaname = 'public'
ORDER BY policyname;

-- Всі політики для таблиці chats
SELECT 
    'Chats RLS Policies' as check_type,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as condition,
    with_check as with_check_condition
FROM pg_policies 
WHERE tablename = 'chats'
AND schemaname = 'public'
ORDER BY policyname;

-- Всі політики для таблиці messages
SELECT 
    'Messages RLS Policies' as check_type,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as condition,
    with_check as with_check_condition
FROM pg_policies 
WHERE tablename = 'messages'
AND schemaname = 'public'
ORDER BY policyname;

-- 4. ПЕРЕВІРКА TRIGGER ТА ФУНКЦІЙ
-- ========================================

-- Перевірка trigger для автоматичного створення користувачів
SELECT 
    'Trigger Check' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    event_object_table,
    event_object_schema
FROM information_schema.triggers 
WHERE event_object_schema = 'auth'
AND event_object_table = 'users'
AND trigger_name = 'on_auth_user_created';

-- Перевірка функції handle_new_user
SELECT 
    'Function Check' as check_type,
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- 5. ПЕРЕВІРКА ІНДЕКСІВ
-- ========================================

-- Перевірка індексів для всіх таблиць
SELECT 
    'Indexes Check' as check_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename, indexname;

-- 6. ПЕРЕВІРКА ДОЗВОЛІВ РОЛЕЙ
-- ========================================

-- Дозволи для ролей anon, authenticated, service_role
SELECT 
    'Role Permissions' as check_type,
    r.rolname as role_name,
    t.table_name,
    t.privilege_type,
    t.is_grantable
FROM pg_roles r
LEFT JOIN information_schema.table_privileges t 
    ON t.grantee = r.rolname 
    AND t.table_schema = 'public'
    AND t.table_name IN ('users', 'chats', 'messages')
WHERE r.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY r.rolname, t.table_name, t.privilege_type;

-- 7. ТЕСТУВАННЯ RLS ПОЛІТИК
-- ========================================

-- Тест доступу як анонімний користувач
SET LOCAL role TO anon;
SELECT 
    'Anonymous Access Test' as test_type,
    'users' as table_name,
    count(*) as accessible_records
FROM public.users;

SET LOCAL role TO anon;
SELECT 
    'Anonymous Access Test' as test_type,
    'chats' as table_name,
    count(*) as accessible_records
FROM public.chats;

SET LOCAL role TO anon;
SELECT 
    'Anonymous Access Test' as test_type,
    'messages' as table_name,
    count(*) as accessible_records
FROM public.messages;

-- Тест доступу як аутентифікований користувач (без конкретного JWT)
SET LOCAL role TO authenticated;
SELECT 
    'Authenticated Access Test (No JWT)' as test_type,
    'users' as table_name,
    count(*) as accessible_records
FROM public.users;

-- 8. ПЕРЕВІРКА JWT КОНТЕКСТУ
-- ========================================

-- Перевірка JWT налаштувань
SELECT 
    'JWT Context Check' as check_type,
    current_setting('request.jwt.claims', true) as jwt_claims,
    current_setting('request.jwt.claim.sub', true) as user_id_from_jwt,
    current_setting('request.jwt.claim.email', true) as email_from_jwt,
    current_setting('request.jwt.claim.role', true) as role_from_jwt;

-- 9. ПЕРЕВІРКА ДАНИХ КОРИСТУВАЧІВ
-- ========================================

-- Перевірка користувачів в auth.users
SELECT 
    'Auth Users Check' as check_type,
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- Перевірка користувачів в public.users
SELECT 
    'Public Users Check' as check_type,
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
    'Chats Check' as check_type,
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
    'Messages Check' as check_type,
    id,
    chat_id,
    role,
    length(content) as content_length,
    created_at
FROM public.messages 
ORDER BY created_at DESC
LIMIT 10;

-- 10. ПЕРЕВІРКА СИСТЕМИ ЛІМІТІВ
-- ========================================

-- Статистика використання повідомлень
SELECT 
    'Message Usage Statistics' as check_type,
    subscription_plan,
    count(*) as user_count,
    avg(messages_used) as avg_messages_used,
    max(messages_used) as max_messages_used,
    sum(case when messages_used >= messages_limit then 1 else 0 end) as users_at_limit
FROM public.users 
GROUP BY subscription_plan;

-- Користувачі, які досягли ліміту
SELECT 
    'Users at Limit' as check_type,
    id,
    email,
    subscription_plan,
    messages_used,
    messages_limit,
    monthly_reset_date
FROM public.users 
WHERE messages_used >= messages_limit
AND subscription_plan = 'free'
ORDER BY messages_used DESC;

-- 11. ПЕРЕВІРКА ЦІЛІСНОСТІ ДАНИХ
-- ========================================

-- Перевірка orphaned chats (чати без користувача)
SELECT 
    'Orphaned Chats Check' as check_type,
    c.id,
    c.user_id,
    c.title
FROM public.chats c
LEFT JOIN public.users u ON c.user_id = u.id
WHERE u.id IS NULL;

-- Перевірка orphaned messages (повідомлення без чату)
SELECT 
    'Orphaned Messages Check' as check_type,
    m.id,
    m.chat_id,
    m.role
FROM public.messages m
LEFT JOIN public.chats c ON m.chat_id = c.id
WHERE c.id IS NULL;

-- 12. ПЕРЕВІРКА CONSTRAINTS
-- ========================================

-- Перевірка check constraints
SELECT 
    'Check Constraints' as check_type,
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('users', 'chats', 'messages')
AND tc.constraint_type = 'CHECK';

-- 13. ПЕРЕВІРКА СИСТЕМИ ПІДПИСОК
-- ========================================

-- Статистика підписок
SELECT 
    'Subscription Statistics' as check_type,
    subscription_plan,
    subscription_status,
    count(*) as user_count
FROM public.users 
GROUP BY subscription_plan, subscription_status
ORDER BY subscription_plan, subscription_status;

-- Користувачі з Stripe інтеграцією
SELECT 
    'Stripe Integration Check' as check_type,
    count(*) as total_users,
    count(stripe_customer_id) as users_with_stripe_customer,
    count(stripe_subscription_id) as users_with_stripe_subscription
FROM public.users;

-- 14. ПЕРЕВІРКА ПРОДУКТИВНОСТІ
-- ========================================

-- Розмір таблиць
SELECT 
    'Table Sizes' as check_type,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Статистика використання індексів
SELECT 
    'Index Usage Statistics' as check_type,
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY idx_scan DESC;
