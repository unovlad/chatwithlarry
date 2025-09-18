-- ========================================
-- LARRY AI - COMPREHENSIVE TESTING AND ADMIN SCRIPT
-- ========================================
-- This script includes all testing, verification, and admin operations
-- Based on analysis of all existing SQL files in the project
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
-- 4. DATA VERIFICATION (SERVICE ROLE REQUIRED)
-- ========================================

-- IMPORTANT: This section requires service_role permissions
-- If you get permission errors, run these queries separately with service_role

-- Set service role for data access
-- SET LOCAL role TO service_role;

-- Check record counts (requires service_role)
-- Uncomment and run with service_role if needed
/*
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
*/

-- Check user statistics (requires service_role)
-- Uncomment and run with service_role if needed
/*
SELECT 
    'User Statistics' as check_type,
    subscription_plan,
    subscription_status,
    COUNT(*) as user_count,
    AVG(messages_used) as avg_messages_used,
    MAX(messages_used) as max_messages_used
FROM public.users
GROUP BY subscription_plan, subscription_status
ORDER BY subscription_plan, subscription_status;
*/

-- Check message usage statistics (requires service_role)
-- Uncomment and run with service_role if needed
/*
SELECT 
    'Message Usage Stats' as check_type,
    subscription_plan,
    AVG(messages_used) as avg_messages_used,
    MAX(messages_used) as max_messages_used,
    COUNT(*) as user_count
FROM public.users
GROUP BY subscription_plan
ORDER BY subscription_plan;
*/

-- ========================================
-- 5. RLS TESTING WITH DIFFERENT ROLES
-- ========================================

-- NOTE: These role tests may cause permission errors
-- Run them separately if needed

-- Test anonymous access (should return 0 records)
-- SET LOCAL role TO anon;
-- SELECT 
--     'Anonymous Access Test' as test_type,
--     'users' as table_name,
--     COUNT(*) as accessible_records
-- FROM public.users;

-- Test authenticated access without JWT (should return 0 records)
-- SET LOCAL role TO authenticated;
-- SELECT 
--     'Authenticated Access (No JWT)' as test_type,
--     'users' as table_name,
--     COUNT(*) as accessible_records
-- FROM public.users;

-- Test service role access (should return all records)
-- SET LOCAL role TO service_role;
-- SELECT 
--     'Service Role Access' as test_type,
--     'users' as table_name,
--     COUNT(*) as accessible_records
-- FROM public.users;

-- ========================================
-- 6. DATA INTEGRITY CHECKS
-- ========================================

-- Check for orphaned records (requires service_role)
-- Uncomment and run with service_role if needed
/*
SELECT 
    'Data Integrity Check' as check_type,
    'Orphaned Chats' as issue_type,
    COUNT(*) as count
FROM public.chats c
LEFT JOIN public.users u ON c.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'Data Integrity Check' as check_type,
    'Orphaned Messages' as issue_type,
    COUNT(*) as count
FROM public.messages m
LEFT JOIN public.chats c ON m.chat_id = c.id
WHERE c.id IS NULL;
*/

-- Check auth.users vs public.users sync (requires service_role)
-- Uncomment and run with service_role if needed
/*
SELECT 
    'User Sync Check' as check_type,
    'Users in auth but not in public' as issue_type,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL

UNION ALL

SELECT 
    'User Sync Check' as check_type,
    'Users in public but not in auth' as issue_type,
    COUNT(*) as count
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;
*/

-- ========================================
-- 7. PERFORMANCE MONITORING
-- ========================================

-- Table sizes (safe to run)
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

-- Index usage statistics (safe to run)
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

-- Activity statistics (safe to run)
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
-- 8. ADMINISTRATIVE OPERATIONS
-- ========================================

-- Reset message counters for free users (uncomment when needed)
/*
UPDATE public.users 
SET 
    messages_used = 0,
    monthly_reset_date = NOW() + INTERVAL '1 month',
    updated_at = NOW()
WHERE subscription_plan = 'free' AND monthly_reset_date <= NOW();
*/

-- Update message limits for premium users (uncomment when needed)
/*
UPDATE public.users 
SET 
    messages_limit = 999999,
    updated_at = NOW()
WHERE subscription_plan IN ('premium', 'enterprise');
*/

-- Change user subscription plan (uncomment when needed)
/*
UPDATE public.users 
SET 
    subscription_plan = 'premium',
    subscription_status = 'active',
    updated_at = NOW()
WHERE email = 'user@example.com';
*/

-- Add messages to user limit (uncomment when needed)
/*
UPDATE public.users 
SET 
    messages_used = messages_used + 5,
    updated_at = NOW()
WHERE email = 'user@example.com';
*/

-- Delete user (uncomment when needed)
/*
DELETE FROM public.users 
WHERE email = 'user@example.com';
*/

-- Clean up old chats (uncomment when needed)
/*
DELETE FROM public.chats 
WHERE created_at < NOW() - INTERVAL '90 days'
AND user_id IN (
    SELECT id FROM public.users 
    WHERE subscription_plan = 'free'
    AND messages_used = 0
);
*/

-- Clean up old messages (uncomment when needed)
/*
DELETE FROM public.messages 
WHERE created_at < NOW() - INTERVAL '90 days';
*/

-- ========================================
-- 9. USER SEARCH AND MANAGEMENT
-- ========================================

-- Search user by email (replace with actual email)
/*
SELECT 
    'User Search by Email' as action,
    id,
    email,
    full_name,
    subscription_plan,
    subscription_status,
    messages_used,
    messages_limit,
    created_at
FROM public.users 
WHERE email LIKE '%example@email.com%';
*/

-- Search user by ID (replace with actual ID)
/*
SELECT 
    'User Search by ID' as action,
    id,
    email,
    full_name,
    subscription_plan,
    subscription_status,
    messages_used,
    messages_limit,
    created_at
FROM public.users 
WHERE id = 'user-id-here';
*/

-- Get user chats (replace with actual user ID)
/*
SELECT 
    'User Chats' as action,
    c.id,
    c.title,
    c.created_at,
    c.updated_at,
    COUNT(m.id) as message_count
FROM public.chats c
LEFT JOIN public.messages m ON c.id = m.chat_id
WHERE c.user_id = 'user-id-here'
GROUP BY c.id, c.title, c.created_at, c.updated_at
ORDER BY c.created_at DESC;
*/

-- Get chat messages (replace with actual chat ID)
/*
SELECT 
    'Chat Messages' as action,
    id,
    role,
    LEFT(content, 100) as content_preview,
    created_at
FROM public.messages 
WHERE chat_id = 'chat-id-here'
ORDER BY created_at ASC;
*/

-- ========================================
-- 10. SECURITY VERIFICATION
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
-- 11. SYSTEM STATUS OVERVIEW
-- ========================================

-- Overall system status (safe queries)
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
AND tablename IN ('users', 'chats', 'messages');

-- Data counts (requires service_role - uncomment if needed)
/*
UNION ALL

SELECT 
    'System Status' as check_type,
    'Total Users' as metric,
    COUNT(*) as value
FROM public.users

UNION ALL

SELECT 
    'System Status' as check_type,
    'Total Chats' as metric,
    COUNT(*) as value
FROM public.chats

UNION ALL

SELECT 
    'System Status' as check_type,
    'Total Messages' as metric,
    COUNT(*) as value
FROM public.messages

UNION ALL

SELECT 
    'System Status' as check_type,
    'Users at Limit' as metric,
    COUNT(*) as value
FROM public.users 
WHERE messages_used >= messages_limit
AND subscription_plan = 'free';
*/

-- ========================================
-- 12. DEBUG QUERIES
-- ========================================

-- Find users exceeding limit
/*
SELECT 
    'Users Exceeding Limit' as debug_type,
    id,
    email,
    subscription_plan,
    messages_used,
    messages_limit
FROM public.users 
WHERE messages_used > messages_limit;
*/

-- Find users with inactive subscriptions
/*
SELECT 
    'Inactive Subscriptions' as debug_type,
    id,
    email,
    subscription_plan,
    subscription_status,
    last_message_date
FROM public.users 
WHERE subscription_status != 'active';
*/

-- Find chats without messages
/*
SELECT 
    'Empty Chats' as debug_type,
    c.id,
    c.title,
    c.created_at,
    u.email
FROM public.chats c
LEFT JOIN public.messages m ON c.id = m.chat_id
LEFT JOIN public.users u ON c.user_id = u.id
WHERE m.id IS NULL;
*/

-- ========================================
-- SCRIPT COMPLETED
-- ========================================
-- Comprehensive testing and admin operations script completed
-- All queries from existing SQL files have been integrated
-- ========================================
