-- ========================================
-- LARRY AI - DATABASE VERIFICATION AND ADMIN OPERATIONS SCRIPT
-- ========================================
-- This script contains commands for database state verification and admin operations
-- ========================================

-- ========================================
-- 1. DATABASE STRUCTURE VERIFICATION
-- ========================================

-- Check all tables
SELECT 
    'Database Structure' as check_type,
    table_name,
    CASE 
        WHEN table_name IN ('users', 'chats', 'messages') THEN '✅ Present'
        ELSE '❌ Missing'
    END as status,
    pg_size_pretty(pg_total_relation_size('public.'||table_name)) as size
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'chats', 'messages')
ORDER BY table_name;

-- Detailed table structure
SELECT 
    'Table Columns' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'chats', 'messages')
ORDER BY table_name, ordinal_position;

-- ========================================
-- 2. RLS STATUS VERIFICATION
-- ========================================

-- RLS status for all tables
SELECT 
    'RLS Status' as check_type,
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename;

-- All RLS policies
SELECT 
    'RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename, policyname;

-- ========================================
-- 3. TRIGGERS AND FUNCTIONS VERIFICATION
-- ========================================

-- All triggers
SELECT 
    'Triggers' as check_type,
    trigger_name,
    event_object_schema,
    event_object_table,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema IN ('public', 'auth')
AND event_object_table IN ('users', 'chats', 'messages')
ORDER BY event_object_table, trigger_name;

-- All functions
SELECT 
    'Functions' as check_type,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('handle_new_user', 'update_updated_at_column')
ORDER BY routine_name;

-- ========================================
-- 4. INDEXES VERIFICATION
-- ========================================

-- All indexes
SELECT 
    'Indexes' as check_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename, indexname;

-- Index usage statistics
SELECT 
    'Index Usage' as check_type,
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename, indexname;

-- ========================================
-- 5. CONSTRAINTS VERIFICATION
-- ========================================

-- All constraints
SELECT 
    'Constraints' as check_type,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('users', 'chats', 'messages')
ORDER BY tc.table_name, tc.constraint_type;

-- ========================================
-- 6. DATA STATISTICS
-- ========================================

-- Record counts in tables
SELECT 
    'Record Counts' as check_type,
    'users' as table_name,
    COUNT(*) as record_count
FROM public.users
UNION ALL
SELECT 
    'Record Counts' as check_type,
    'chats' as table_name,
    COUNT(*) as record_count
FROM public.chats
UNION ALL
SELECT 
    'Record Counts' as check_type,
    'messages' as table_name,
    COUNT(*) as record_count
FROM public.messages;

-- Subscription statistics
SELECT 
    'Subscription Stats' as check_type,
    subscription_plan,
    subscription_status,
    COUNT(*) as user_count
FROM public.users
GROUP BY subscription_plan, subscription_status
ORDER BY subscription_plan, subscription_status;

-- Message usage statistics
SELECT 
    'Message Usage Stats' as check_type,
    subscription_plan,
    AVG(messages_used) as avg_messages_used,
    MAX(messages_used) as max_messages_used,
    COUNT(*) as user_count
FROM public.users
GROUP BY subscription_plan
ORDER BY subscription_plan;

-- ========================================
-- 7. ADMINISTRATIVE OPERATIONS
-- ========================================

-- Reset message counter for all users (free plan)
-- UPDATE public.users 
-- SET messages_used = 0, monthly_reset_date = NOW() + INTERVAL '1 month'
-- WHERE subscription_plan = 'free' AND monthly_reset_date <= NOW();

-- Update message limit for premium users
-- UPDATE public.users 
-- SET messages_limit = 999999
-- WHERE subscription_plan IN ('premium', 'enterprise');

-- Delete old chats (older than 1 year)
-- DELETE FROM public.chats 
-- WHERE created_at < NOW() - INTERVAL '1 year';

-- Delete old messages (older than 1 year)
-- DELETE FROM public.messages 
-- WHERE created_at < NOW() - INTERVAL '1 year';

-- ========================================
-- 8. PERFORMANCE VERIFICATION
-- ========================================

-- Table sizes
SELECT 
    'Table Sizes' as check_type,
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size,
    pg_size_pretty(pg_relation_size('public.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size('public.'||tablename) - pg_relation_size('public.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY pg_total_relation_size('public.'||tablename) DESC;

-- Activity statistics
SELECT 
    'Activity Stats' as check_type,
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename;

-- ========================================
-- 9. SECURITY VERIFICATION
-- ========================================

-- Check current user
SELECT 
    'Security Check' as check_type,
    current_user as current_user,
    session_user as session_user,
    current_setting('request.jwt.claims', true) as jwt_claims;

-- Check permissions
SELECT 
    'Permissions' as check_type,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public'
AND table_name IN ('users', 'chats', 'messages')
ORDER BY table_name, privilege_type;

-- ========================================
-- 10. USEFUL DEBUG QUERIES
-- ========================================

-- Find users exceeding limit
-- SELECT 
--     id, email, subscription_plan, messages_used, messages_limit
-- FROM public.users 
-- WHERE messages_used > messages_limit;

-- Find users with inactive subscriptions
-- SELECT 
--     id, email, subscription_plan, subscription_status, last_message_date
-- FROM public.users 
-- WHERE subscription_status != 'active';

-- Find chats without messages
-- SELECT 
--     c.id, c.title, c.created_at, u.email
-- FROM public.chats c
-- LEFT JOIN public.messages m ON c.id = m.chat_id
-- LEFT JOIN public.users u ON c.user_id = u.id
-- WHERE m.id IS NULL;

-- ========================================
-- SCRIPT COMPLETED
-- ========================================
