-- ========================================
-- LARRY AI - COMPLETE RLS POLICIES VERIFICATION
-- ========================================
-- This script checks all RLS policies for users, chats, and messages tables
-- ========================================

-- ========================================
-- 1. OVERALL RLS STATUS
-- ========================================

-- Check RLS status for all tables
SELECT 
    'RLS Status' as check_type,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled - SECURITY RISK!'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename;

-- ========================================
-- 2. ALL RLS POLICIES OVERVIEW
-- ========================================

-- Get all RLS policies for all tables
SELECT 
    'All RLS Policies' as check_type,
    tablename,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY tablename, cmd, policyname;

-- ========================================
-- 3. USERS TABLE POLICIES DETAILED
-- ========================================

-- Users table policies analysis
SELECT 
    'Users Policies' as check_type,
    policyname,
    cmd as command,
    CASE 
        WHEN cmd = 'SELECT' AND qual LIKE '%auth.uid() = id%' THEN '✅ SECURE - Users see only their data'
        WHEN cmd = 'INSERT' AND with_check LIKE '%auth.uid() = id%' THEN '✅ SECURE - Users create only their profiles'
        WHEN cmd = 'UPDATE' AND qual LIKE '%auth.uid() = id%' AND with_check LIKE '%auth.uid() = id%' THEN '✅ SECURE - Users update only their data'
        WHEN cmd = 'DELETE' AND qual LIKE '%auth.uid() = id%' THEN '✅ SECURE - Users delete only their profiles'
        WHEN qual IS NULL OR qual = '' THEN '❌ INSECURE - No access restriction'
        ELSE '⚠️ REVIEW NEEDED - Custom conditions'
    END as security_status,
    qual as using_condition,
    with_check as with_check_condition
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY cmd, policyname;

-- ========================================
-- 4. CHATS TABLE POLICIES DETAILED
-- ========================================

-- Chats table policies analysis
SELECT 
    'Chats Policies' as check_type,
    policyname,
    cmd as command,
    CASE 
        WHEN cmd = 'SELECT' AND qual LIKE '%auth.uid() = user_id%' THEN '✅ SECURE - Users see only their chats'
        WHEN cmd = 'INSERT' AND with_check LIKE '%auth.uid() = user_id%' THEN '✅ SECURE - Users create only their chats'
        WHEN cmd = 'UPDATE' AND qual LIKE '%auth.uid() = user_id%' AND with_check LIKE '%auth.uid() = user_id%' THEN '✅ SECURE - Users update only their chats'
        WHEN cmd = 'DELETE' AND qual LIKE '%auth.uid() = user_id%' THEN '✅ SECURE - Users delete only their chats'
        WHEN qual IS NULL OR qual = '' THEN '❌ INSECURE - No access restriction'
        ELSE '⚠️ REVIEW NEEDED - Custom conditions'
    END as security_status,
    qual as using_condition,
    with_check as with_check_condition
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'chats'
ORDER BY cmd, policyname;

-- ========================================
-- 5. MESSAGES TABLE POLICIES DETAILED
-- ========================================

-- Messages table policies analysis
SELECT 
    'Messages Policies' as check_type,
    policyname,
    cmd as command,
    CASE 
        WHEN cmd = 'SELECT' AND qual LIKE '%EXISTS%' AND qual LIKE '%chats.user_id = auth.uid()%' THEN '✅ SECURE - Users see only messages in their chats'
        WHEN cmd = 'INSERT' AND with_check LIKE '%EXISTS%' AND with_check LIKE '%chats.user_id = auth.uid()%' THEN '✅ SECURE - Users create only messages in their chats'
        WHEN cmd = 'UPDATE' AND qual LIKE '%EXISTS%' AND qual LIKE '%chats.user_id = auth.uid()%' AND with_check LIKE '%EXISTS%' AND with_check LIKE '%chats.user_id = auth.uid()%' THEN '✅ SECURE - Users update only messages in their chats'
        WHEN cmd = 'DELETE' AND qual LIKE '%EXISTS%' AND qual LIKE '%chats.user_id = auth.uid()%' THEN '✅ SECURE - Users delete only messages in their chats'
        WHEN qual IS NULL OR qual = '' THEN '❌ INSECURE - No access restriction'
        ELSE '⚠️ REVIEW NEEDED - Custom conditions'
    END as security_status,
    qual as using_condition,
    with_check as with_check_condition
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'messages'
ORDER BY cmd, policyname;

-- ========================================
-- 6. POLICY COVERAGE CHECK
-- ========================================

-- Check which operations have policies for each table
SELECT 
    'Policy Coverage' as check_type,
    'users' as table_name,
    'SELECT' as operation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'users' 
            AND cmd = 'SELECT'
        ) THEN '✅ Has policy'
        ELSE '❌ Missing policy'
    END as status

UNION ALL

SELECT 
    'Policy Coverage' as check_type,
    'users' as table_name,
    'INSERT' as operation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'users' 
            AND cmd = 'INSERT'
        ) THEN '✅ Has policy'
        ELSE '❌ Missing policy'
    END as status

UNION ALL

SELECT 
    'Policy Coverage' as check_type,
    'users' as table_name,
    'UPDATE' as operation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'users' 
            AND cmd = 'UPDATE'
        ) THEN '✅ Has policy'
        ELSE '❌ Missing policy'
    END as status

UNION ALL

SELECT 
    'Policy Coverage' as check_type,
    'users' as table_name,
    'DELETE' as operation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'users' 
            AND cmd = 'DELETE'
        ) THEN '✅ Has policy'
        ELSE '❌ Missing policy'
    END as status

UNION ALL

-- Chats table coverage
SELECT 
    'Policy Coverage' as check_type,
    'chats' as table_name,
    'SELECT' as operation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'chats' 
            AND cmd = 'SELECT'
        ) THEN '✅ Has policy'
        ELSE '❌ Missing policy'
    END as status

UNION ALL

SELECT 
    'Policy Coverage' as check_type,
    'chats' as table_name,
    'INSERT' as operation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'chats' 
            AND cmd = 'INSERT'
        ) THEN '✅ Has policy'
        ELSE '❌ Missing policy'
    END as status

UNION ALL

SELECT 
    'Policy Coverage' as check_type,
    'chats' as table_name,
    'UPDATE' as operation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'chats' 
            AND cmd = 'UPDATE'
        ) THEN '✅ Has policy'
        ELSE '❌ Missing policy'
    END as status

UNION ALL

SELECT 
    'Policy Coverage' as check_type,
    'chats' as table_name,
    'DELETE' as operation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'chats' 
            AND cmd = 'DELETE'
        ) THEN '✅ Has policy'
        ELSE '❌ Missing policy'
    END as status

UNION ALL

-- Messages table coverage
SELECT 
    'Policy Coverage' as check_type,
    'messages' as table_name,
    'SELECT' as operation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'messages' 
            AND cmd = 'SELECT'
        ) THEN '✅ Has policy'
        ELSE '❌ Missing policy'
    END as status

UNION ALL

SELECT 
    'Policy Coverage' as check_type,
    'messages' as table_name,
    'INSERT' as operation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'messages' 
            AND cmd = 'INSERT'
        ) THEN '✅ Has policy'
        ELSE '❌ Missing policy'
    END as status

UNION ALL

SELECT 
    'Policy Coverage' as check_type,
    'messages' as table_name,
    'UPDATE' as operation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'messages' 
            AND cmd = 'UPDATE'
        ) THEN '✅ Has policy'
        ELSE '❌ Missing policy'
    END as status

UNION ALL

SELECT 
    'Policy Coverage' as check_type,
    'messages' as table_name,
    'DELETE' as operation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'messages' 
            AND cmd = 'DELETE'
        ) THEN '✅ Has policy'
        ELSE '❌ Missing policy'
    END as status;

-- ========================================
-- 7. SUMMARY REPORT
-- ========================================

-- Summary of all RLS policies
SELECT 
    'Summary Report' as check_type,
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
GROUP BY tablename
ORDER BY tablename;

-- ========================================
-- 8. SECURITY RECOMMENDATIONS
-- ========================================

-- Generate security recommendations
SELECT 
    'Security Recommendations' as check_type,
    'Overall Assessment' as aspect,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename IN ('users', 'chats', 'messages')
        ) = 12 THEN '✅ Perfect - All 12 expected policies are present'
        WHEN (
            SELECT COUNT(*) FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename IN ('users', 'chats', 'messages')
        ) > 12 THEN '⚠️ Extra policies detected - Review for conflicts'
        ELSE '❌ Missing policies - Security risk'
    END as status

UNION ALL

SELECT 
    'Security Recommendations' as check_type,
    'RLS Status' as aspect,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename IN ('users', 'chats', 'messages')
            AND rowsecurity = true
        ) = 3 THEN '✅ Perfect - All tables have RLS enabled'
        ELSE '❌ Some tables missing RLS - Security risk'
    END as status

UNION ALL

SELECT 
    'Security Recommendations' as check_type,
    'Policy Consistency' as aspect,
    CASE 
        WHEN (
            SELECT COUNT(DISTINCT tablename) FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename IN ('users', 'chats', 'messages')
        ) = 3 THEN '✅ Perfect - All tables have policies'
        ELSE '❌ Some tables missing policies - Security risk'
    END as status;

-- ========================================
-- SCRIPT COMPLETED
-- ========================================
-- Complete RLS policies verification completed
-- Check the results above for security assessment
-- ========================================








