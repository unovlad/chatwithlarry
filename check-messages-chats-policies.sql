-- ========================================
-- LARRY AI - MESSAGES AND CHATS RLS POLICIES VERIFICATION
-- ========================================
-- This script specifically checks RLS policies for messages and chats tables
-- ========================================

-- ========================================
-- 1. CHATS TABLE POLICIES
-- ========================================

-- Check chats table RLS status
SELECT 
    'Chats RLS Status' as check_type,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled - SECURITY RISK!'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename = 'chats';

-- Check all chats table policies
SELECT 
    'Chats Policies' as check_type,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'chats'
ORDER BY cmd, policyname;

-- Analyze chats policies security
SELECT 
    'Chats Security Analysis' as check_type,
    policyname,
    cmd as command,
    CASE 
        WHEN cmd = 'SELECT' AND qual LIKE '%auth.uid() = user_id%' THEN '✅ SECURE - Users see only their chats'
        WHEN cmd = 'INSERT' AND with_check LIKE '%auth.uid() = user_id%' THEN '✅ SECURE - Users create only their chats'
        WHEN cmd = 'UPDATE' AND qual LIKE '%auth.uid() = user_id%' AND with_check LIKE '%auth.uid() = user_id%' THEN '✅ SECURE - Users update only their chats'
        WHEN cmd = 'DELETE' AND qual LIKE '%auth.uid() = user_id%' THEN '✅ SECURE - Users delete only their chats'
        WHEN qual IS NULL OR qual = '' THEN '❌ INSECURE - No access restriction'
        WHEN with_check IS NULL AND cmd IN ('INSERT', 'UPDATE') THEN '❌ INSECURE - No insert/update restriction'
        ELSE '⚠️ REVIEW NEEDED - Custom conditions'
    END as security_status,
    qual as using_condition,
    with_check as with_check_condition
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'chats'
ORDER BY cmd, policyname;

-- ========================================
-- 2. MESSAGES TABLE POLICIES
-- ========================================

-- Check messages table RLS status
SELECT 
    'Messages RLS Status' as check_type,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled - SECURITY RISK!'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename = 'messages';

-- Check all messages table policies
SELECT 
    'Messages Policies' as check_type,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'messages'
ORDER BY cmd, policyname;

-- Analyze messages policies security
SELECT 
    'Messages Security Analysis' as check_type,
    policyname,
    cmd as command,
    CASE 
        WHEN cmd = 'SELECT' AND qual LIKE '%EXISTS%' AND qual LIKE '%chats.user_id = auth.uid()%' THEN '✅ SECURE - Users see only messages in their chats'
        WHEN cmd = 'INSERT' AND with_check LIKE '%EXISTS%' AND with_check LIKE '%chats.user_id = auth.uid()%' THEN '✅ SECURE - Users create only messages in their chats'
        WHEN cmd = 'UPDATE' AND qual LIKE '%EXISTS%' AND qual LIKE '%chats.user_id = auth.uid()%' AND with_check LIKE '%EXISTS%' AND with_check LIKE '%chats.user_id = auth.uid()%' THEN '✅ SECURE - Users update only messages in their chats'
        WHEN cmd = 'DELETE' AND qual LIKE '%EXISTS%' AND qual LIKE '%chats.user_id = auth.uid()%' THEN '✅ SECURE - Users delete only messages in their chats'
        WHEN qual IS NULL OR qual = '' THEN '❌ INSECURE - No access restriction'
        WHEN with_check IS NULL AND cmd IN ('INSERT', 'UPDATE') THEN '❌ INSECURE - No insert/update restriction'
        ELSE '⚠️ REVIEW NEEDED - Custom conditions'
    END as security_status,
    qual as using_condition,
    with_check as with_check_condition
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'messages'
ORDER BY cmd, policyname;

-- ========================================
-- 3. POLICY COVERAGE FOR CHATS
-- ========================================

-- Check which operations have policies for chats table
SELECT 
    'Chats Policy Coverage' as check_type,
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
    'Chats Policy Coverage' as check_type,
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
    'Chats Policy Coverage' as check_type,
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
    'Chats Policy Coverage' as check_type,
    'DELETE' as operation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'chats' 
            AND cmd = 'DELETE'
        ) THEN '✅ Has policy'
        ELSE '❌ Missing policy'
    END as status;

-- ========================================
-- 4. POLICY COVERAGE FOR MESSAGES
-- ========================================

-- Check which operations have policies for messages table
SELECT 
    'Messages Policy Coverage' as check_type,
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
    'Messages Policy Coverage' as check_type,
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
    'Messages Policy Coverage' as check_type,
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
    'Messages Policy Coverage' as check_type,
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
-- 5. DETAILED POLICY LOGIC ANALYSIS
-- ========================================

-- Analyze chats policy logic
SELECT 
    'Chats Policy Logic' as check_type,
    policyname,
    cmd as command,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Allows users to READ their own chats only'
        WHEN cmd = 'INSERT' THEN 'Allows users to CREATE chats for themselves only'
        WHEN cmd = 'UPDATE' THEN 'Allows users to MODIFY their own chats only'
        WHEN cmd = 'DELETE' THEN 'Allows users to REMOVE their own chats only'
    END as what_it_allows,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Denies access to other users'' chats'
        WHEN cmd = 'INSERT' THEN 'Denies creating chats for other users'
        WHEN cmd = 'UPDATE' THEN 'Denies modifying other users'' chats'
        WHEN cmd = 'DELETE' THEN 'Denies deleting other users'' chats'
    END as what_it_denies
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'chats'
ORDER BY cmd, policyname;

-- Analyze messages policy logic
SELECT 
    'Messages Policy Logic' as check_type,
    policyname,
    cmd as command,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Allows users to READ messages in their own chats only'
        WHEN cmd = 'INSERT' THEN 'Allows users to CREATE messages in their own chats only'
        WHEN cmd = 'UPDATE' THEN 'Allows users to MODIFY messages in their own chats only'
        WHEN cmd = 'DELETE' THEN 'Allows users to REMOVE messages from their own chats only'
    END as what_it_allows,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Denies access to messages in other users'' chats'
        WHEN cmd = 'INSERT' THEN 'Denies creating messages in other users'' chats'
        WHEN cmd = 'UPDATE' THEN 'Denies modifying messages in other users'' chats'
        WHEN cmd = 'DELETE' THEN 'Denies deleting messages from other users'' chats'
    END as what_it_denies
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'messages'
ORDER BY cmd, policyname;

-- ========================================
-- 6. SECURITY RECOMMENDATIONS
-- ========================================

-- Generate security recommendations for chats and messages
SELECT 
    'Security Recommendations' as check_type,
    'Chats Table' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'chats' 
            AND rowsecurity = true
        ) AND EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'chats' 
            AND cmd = 'SELECT' 
            AND qual LIKE '%auth.uid() = user_id%'
        ) THEN '✅ SECURE - RLS enabled with proper user isolation'
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'chats' 
            AND rowsecurity = true
        ) THEN '⚠️ PARTIALLY SECURE - RLS enabled but policies need review'
        ELSE '❌ INSECURE - RLS disabled or missing policies'
    END as security_status

UNION ALL

SELECT 
    'Security Recommendations' as check_type,
    'Messages Table' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'messages' 
            AND rowsecurity = true
        ) AND EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'messages' 
            AND cmd = 'SELECT' 
            AND qual LIKE '%EXISTS%' 
            AND qual LIKE '%chats.user_id = auth.uid()%'
        ) THEN '✅ SECURE - RLS enabled with proper chat-based isolation'
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'messages' 
            AND rowsecurity = true
        ) THEN '⚠️ PARTIALLY SECURE - RLS enabled but policies need review'
        ELSE '❌ INSECURE - RLS disabled or missing policies'
    END as security_status;

-- ========================================
-- 7. SUMMARY REPORT
-- ========================================

-- Summary of chats and messages policies
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
AND tablename IN ('chats', 'messages')
GROUP BY tablename
ORDER BY tablename;

-- ========================================
-- SCRIPT COMPLETED
-- ========================================
-- Messages and chats RLS policies verification completed
-- Check the results above for security assessment
-- ========================================

