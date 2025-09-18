-- ========================================
-- LARRY AI - SAFE DATABASE VERIFICATION SCRIPT
-- ========================================
-- This script contains only safe queries that don't require special permissions
-- Safe to run without service_role or special permissions
-- ========================================

-- ========================================
-- 1. BASIC DATABASE STRUCTURE CHECKS
-- ========================================

-- Check table structure
SELECT 
    'Table Structure' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'chats', 'messages')
ORDER BY table_name, ordinal_position;

-- Check RLS status
SELECT 
    'RLS Status' as check_type,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE tablename IN ('users', 'chats', 'messages')
AND schemaname = 'public'
ORDER BY tablename;

-- Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    tablename,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename IN ('users', 'chats', 'messages')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 2. TRIGGERS AND FUNCTIONS VERIFICATION
-- ========================================

-- Check triggers
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

-- Check functions
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
-- 3. INDEXES AND CONSTRAINTS VERIFICATION
-- ========================================

-- Check indexes
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

-- Check constraints
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
-- 4. PERFORMANCE MONITORING
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
-- 5. SECURITY VERIFICATION
-- ========================================

-- Check current user and permissions
SELECT 
    'Security Check' as check_type,
    current_user as current_user,
    session_user as session_user,
    current_setting('role') as current_role;

-- Check JWT context (if available)
SELECT 
    'JWT Context' as check_type,
    current_setting('request.jwt.claims', true) as jwt_claims,
    current_setting('request.jwt.claim.sub', true) as user_id_from_jwt,
    current_setting('request.jwt.claim.email', true) as email_from_jwt;

-- Check table permissions
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
-- 6. SYSTEM STATUS OVERVIEW
-- ========================================

-- Overall system status
SELECT 
    'System Status' as check_type,
    'RLS Enabled Tables' as metric,
    COUNT(*) as value
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
AND rowsecurity = true

UNION ALL

SELECT 
    'System Status' as check_type,
    'Active RLS Policies' as metric,
    COUNT(*) as value
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')

UNION ALL

SELECT 
    'System Status' as check_type,
    'Total Indexes' as metric,
    COUNT(*) as value
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')

UNION ALL

SELECT 
    'System Status' as check_type,
    'Total Triggers' as metric,
    COUNT(*) as value
FROM information_schema.triggers 
WHERE event_object_schema IN ('public', 'auth')
AND event_object_table IN ('users', 'chats', 'messages')

UNION ALL

SELECT 
    'System Status' as check_type,
    'Total Functions' as metric,
    COUNT(*) as value
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('handle_new_user', 'update_updated_at_column');

-- ========================================
-- 7. CHECK CONSTRAINTS VERIFICATION
-- ========================================

-- Check constraints details
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
AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- ========================================
-- 8. FOREIGN KEY VERIFICATION
-- ========================================

-- Foreign key relationships
SELECT 
    'Foreign Keys' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('users', 'chats', 'messages')
ORDER BY tc.table_name, kcu.column_name;

-- ========================================
-- 9. SEQUENCE VERIFICATION
-- ========================================

-- Check sequences
SELECT 
    'Sequences' as check_type,
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment
FROM information_schema.sequences 
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- ========================================
-- 10. VIEW VERIFICATION
-- ========================================

-- Check views
SELECT 
    'Views' as check_type,
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
AND table_name IN ('users', 'chats', 'messages')
ORDER BY table_name;

-- ========================================
-- SCRIPT COMPLETED
-- ========================================
-- Safe verification script completed
-- All queries are safe to run without special permissions
-- ========================================

