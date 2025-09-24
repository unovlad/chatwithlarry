-- ========================================
-- LARRY AI - DATABASE STRUCTURE MATCH VERIFICATION
-- ========================================
-- This script checks if current database structure matches our deployment script
-- ========================================

-- ========================================
-- 1. CHECK TABLES EXISTENCE
-- ========================================

-- Check if all required tables exist
SELECT 
    'Table Existence' as check_type,
    table_name,
    CASE 
        WHEN table_name IN ('users', 'chats', 'messages') THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'chats', 'messages')
ORDER BY table_name;

-- ========================================
-- 2. CHECK USERS TABLE STRUCTURE
-- ========================================

-- Check users table columns
SELECT 
    'Users Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'id' AND data_type = 'uuid' THEN '✅ Correct'
        WHEN column_name = 'email' AND data_type = 'text' AND is_nullable = 'NO' THEN '✅ Correct'
        WHEN column_name = 'full_name' AND data_type = 'text' AND is_nullable = 'YES' THEN '✅ Correct'
        WHEN column_name = 'subscription_plan' AND data_type = 'text' AND column_default = '''free''::text' THEN '✅ Correct'
        WHEN column_name = 'subscription_status' AND data_type = 'text' AND column_default = '''active''::text' THEN '✅ Correct'
        WHEN column_name = 'messages_used' AND data_type = 'integer' AND column_default = '0' THEN '✅ Correct'
        WHEN column_name = 'messages_limit' AND data_type = 'integer' AND column_default = '30' THEN '✅ Correct'
        WHEN column_name = 'trial_used' AND data_type = 'boolean' AND column_default = 'false' THEN '✅ Correct'
        WHEN column_name = 'onboarding_completed' AND data_type = 'boolean' AND column_default = 'false' THEN '✅ Correct'
        WHEN column_name = 'timezone' AND data_type = 'text' AND column_default = '''UTC''::text' THEN '✅ Correct'
        WHEN column_name = 'language' AND data_type = 'text' AND column_default = '''en''::text' THEN '✅ Correct'
        WHEN column_name = 'notification_settings' AND data_type = 'jsonb' AND column_default = '''{}''::jsonb' THEN '✅ Correct'
        WHEN column_name = 'user_preferences' AND data_type = 'jsonb' AND column_default = '''{}''::jsonb' THEN '✅ Correct'
        WHEN column_name = 'stripe_invoice_settings' AND data_type = 'jsonb' AND column_default = '''{}''::jsonb' THEN '✅ Correct'
        WHEN column_name = 'stripe_metadata' AND data_type = 'jsonb' AND column_default = '''{}''::jsonb' THEN '✅ Correct'
        WHEN column_name IN ('created_at', 'updated_at') AND data_type = 'timestamp with time zone' THEN '✅ Correct'
        ELSE '⚠️ Check needed'
    END as validation_status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- ========================================
-- 3. CHECK CHATS TABLE STRUCTURE
-- ========================================

-- Check chats table columns
SELECT 
    'Chats Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'id' AND data_type = 'uuid' THEN '✅ Correct'
        WHEN column_name = 'user_id' AND data_type = 'uuid' AND is_nullable = 'NO' THEN '✅ Correct'
        WHEN column_name = 'title' AND data_type = 'text' AND is_nullable = 'NO' THEN '✅ Correct'
        WHEN column_name IN ('created_at', 'updated_at') AND data_type = 'timestamp with time zone' THEN '✅ Correct'
        ELSE '⚠️ Check needed'
    END as validation_status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chats'
ORDER BY ordinal_position;

-- ========================================
-- 4. CHECK MESSAGES TABLE STRUCTURE
-- ========================================

-- Check messages table columns
SELECT 
    'Messages Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'id' AND data_type = 'uuid' THEN '✅ Correct'
        WHEN column_name = 'chat_id' AND data_type = 'uuid' AND is_nullable = 'NO' THEN '✅ Correct'
        WHEN column_name = 'role' AND data_type = 'text' AND is_nullable = 'NO' THEN '✅ Correct'
        WHEN column_name = 'content' AND data_type = 'text' AND is_nullable = 'NO' THEN '✅ Correct'
        WHEN column_name = 'created_at' AND data_type = 'timestamp with time zone' THEN '✅ Correct'
        ELSE '⚠️ Check needed'
    END as validation_status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages'
ORDER BY ordinal_position;

-- ========================================
-- 5. CHECK CONSTRAINTS
-- ========================================

-- Check foreign key constraints
SELECT 
    'Foreign Key Constraints' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN tc.table_name = 'chats' AND kcu.column_name = 'user_id' AND ccu.table_name = 'users' AND ccu.column_name = 'id' THEN '✅ Correct'
        WHEN tc.table_name = 'messages' AND kcu.column_name = 'chat_id' AND ccu.table_name = 'chats' AND ccu.column_name = 'id' THEN '✅ Correct'
        ELSE '⚠️ Check needed'
    END as validation_status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('users', 'chats', 'messages')
ORDER BY tc.table_name, kcu.column_name;

-- Check check constraints
SELECT 
    'Check Constraints' as check_type,
    tc.table_name,
    tc.constraint_name,
    cc.check_clause,
    CASE 
        WHEN tc.table_name = 'users' AND cc.check_clause LIKE '%subscription_plan%' AND cc.check_clause LIKE '%free%' AND cc.check_clause LIKE '%premium%' AND cc.check_clause LIKE '%enterprise%' THEN '✅ Correct'
        WHEN tc.table_name = 'users' AND cc.check_clause LIKE '%subscription_status%' AND cc.check_clause LIKE '%active%' AND cc.check_clause LIKE '%inactive%' THEN '✅ Correct'
        WHEN tc.table_name = 'messages' AND cc.check_clause LIKE '%role%' AND cc.check_clause LIKE '%user%' AND cc.check_clause LIKE '%assistant%' AND cc.check_clause LIKE '%system%' THEN '✅ Correct'
        ELSE '⚠️ Check needed'
    END as validation_status
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('users', 'chats', 'messages')
AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- ========================================
-- 6. CHECK INDEXES
-- ========================================

-- Check if expected indexes exist
SELECT 
    'Indexes Check' as check_type,
    tablename,
    indexname,
    CASE 
        WHEN tablename = 'users' AND indexname LIKE '%email%' THEN '✅ Expected index'
        WHEN tablename = 'users' AND indexname LIKE '%stripe%' THEN '✅ Expected index'
        WHEN tablename = 'users' AND indexname LIKE '%subscription%' THEN '✅ Expected index'
        WHEN tablename = 'users' AND indexname LIKE '%messages_used%' THEN '✅ Expected index'
        WHEN tablename = 'users' AND indexname LIKE '%monthly_reset%' THEN '✅ Expected index'
        WHEN tablename = 'users' AND indexname LIKE '%created_at%' THEN '✅ Expected index'
        WHEN tablename = 'chats' AND indexname LIKE '%user_id%' THEN '✅ Expected index'
        WHEN tablename = 'chats' AND indexname LIKE '%created_at%' THEN '✅ Expected index'
        WHEN tablename = 'chats' AND indexname LIKE '%updated_at%' THEN '✅ Expected index'
        WHEN tablename = 'messages' AND indexname LIKE '%chat_id%' THEN '✅ Expected index'
        WHEN tablename = 'messages' AND indexname LIKE '%created_at%' THEN '✅ Expected index'
        WHEN tablename = 'messages' AND indexname LIKE '%role%' THEN '✅ Expected index'
        WHEN indexname LIKE '%_pkey%' THEN '✅ Primary key'
        ELSE '⚠️ Additional index'
    END as validation_status
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename, indexname;

-- ========================================
-- 7. CHECK FUNCTIONS AND TRIGGERS
-- ========================================

-- Check functions
SELECT 
    'Functions Check' as check_type,
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'handle_new_user' AND routine_type = 'FUNCTION' THEN '✅ Expected function'
        WHEN routine_name = 'update_updated_at_column' AND routine_type = 'FUNCTION' THEN '✅ Expected function'
        ELSE '⚠️ Additional function'
    END as validation_status
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('handle_new_user', 'update_updated_at_column')
ORDER BY routine_name;

-- Check triggers
SELECT 
    'Triggers Check' as check_type,
    trigger_name,
    event_object_table,
    action_timing,
    CASE 
        WHEN trigger_name = 'on_auth_user_created' AND event_object_table = 'users' AND event_object_schema = 'auth' THEN '✅ Expected trigger'
        WHEN trigger_name = 'update_users_updated_at' AND event_object_table = 'users' THEN '✅ Expected trigger'
        WHEN trigger_name = 'update_chats_updated_at' AND event_object_table = 'chats' THEN '✅ Expected trigger'
        ELSE '⚠️ Additional trigger'
    END as validation_status
FROM information_schema.triggers 
WHERE event_object_schema IN ('public', 'auth')
AND event_object_table IN ('users', 'chats', 'messages')
ORDER BY event_object_table, trigger_name;

-- ========================================
-- 8. SUMMARY COMPARISON
-- ========================================

-- Overall structure comparison
SELECT 
    'Structure Comparison' as check_type,
    'Tables' as component,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'chats', 'messages')
        ) = 3 THEN '✅ All 3 tables present'
        ELSE '❌ Missing tables'
    END as status

UNION ALL

SELECT 
    'Structure Comparison' as check_type,
    'Users Columns' as component,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        ) >= 20 THEN '✅ Expected number of columns'
        ELSE '❌ Missing columns'
    END as status

UNION ALL

SELECT 
    'Structure Comparison' as check_type,
    'Indexes' as component,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM pg_indexes 
            WHERE schemaname = 'public'
            AND tablename IN ('users', 'chats', 'messages')
        ) >= 10 THEN '✅ Expected number of indexes'
        ELSE '❌ Missing indexes'
    END as status

UNION ALL

SELECT 
    'Structure Comparison' as check_type,
    'Functions' as component,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.routines 
            WHERE routine_schema = 'public'
            AND routine_name IN ('handle_new_user', 'update_updated_at_column')
        ) = 2 THEN '✅ Expected functions present'
        ELSE '❌ Missing functions'
    END as status

UNION ALL

SELECT 
    'Structure Comparison' as check_type,
    'Triggers' as component,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.triggers 
            WHERE event_object_schema IN ('public', 'auth')
            AND event_object_table IN ('users', 'chats', 'messages')
        ) >= 3 THEN '✅ Expected triggers present'
        ELSE '❌ Missing triggers'
    END as status;

-- ========================================
-- SCRIPT COMPLETED
-- ========================================
-- Database structure match verification completed
-- Check the results above to see if current DB matches deployment script
-- ========================================








