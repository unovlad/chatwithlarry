-- ========================================
-- LARRY AI - USER RLS POLICIES VERIFICATION
-- ========================================
-- This script checks all RLS policies specifically for the users table
-- Safe to run without special permissions
-- ========================================

-- ========================================
-- 1. CHECK RLS STATUS FOR USERS TABLE
-- ========================================

-- Check if RLS is enabled for users table
SELECT 
    'RLS Status for Users' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled - SECURITY RISK!'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename = 'users';

-- ========================================
-- 2. CHECK ALL RLS POLICIES FOR USERS TABLE
-- ========================================

-- Get all RLS policies for users table
SELECT 
    'Users RLS Policies' as check_type,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY policyname;

-- ========================================
-- 3. CHECK POLICY DETAILS
-- ========================================

-- Detailed policy information
SELECT 
    'Policy Details' as check_type,
    policyname,
    cmd as command_type,
    CASE 
        WHEN cmd = 'SELECT' THEN 'READ access'
        WHEN cmd = 'INSERT' THEN 'CREATE access'
        WHEN cmd = 'UPDATE' THEN 'UPDATE access'
        WHEN cmd = 'DELETE' THEN 'DELETE access'
        WHEN cmd = 'ALL' THEN 'ALL access'
        ELSE 'UNKNOWN'
    END as access_type,
    permissive,
    roles,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING condition'
        ELSE 'No USING condition'
    END as has_using_condition,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK condition'
        ELSE 'No WITH CHECK condition'
    END as has_with_check_condition
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY cmd, policyname;

-- ========================================
-- 4. CHECK POLICY CONDITIONS
-- ========================================

-- Analyze policy conditions
SELECT 
    'Policy Conditions Analysis' as check_type,
    policyname,
    cmd as command,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN 'Uses auth.uid() - User ID based'
        WHEN qual LIKE '%auth.role()%' THEN 'Uses auth.role() - Role based'
        WHEN qual LIKE '%auth.jwt()%' THEN 'Uses auth.jwt() - JWT based'
        WHEN qual IS NULL THEN 'No USING condition'
        ELSE 'Custom condition'
    END as using_condition_type,
    CASE 
        WHEN with_check LIKE '%auth.uid()%' THEN 'Uses auth.uid() - User ID based'
        WHEN with_check LIKE '%auth.role()%' THEN 'Uses auth.role() - Role based'
        WHEN with_check LIKE '%auth.jwt()%' THEN 'Uses auth.jwt() - JWT based'
        WHEN with_check IS NULL THEN 'No WITH CHECK condition'
        ELSE 'Custom condition'
    END as with_check_condition_type
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY cmd, policyname;

-- ========================================
-- 5. CHECK FOR MISSING POLICIES
-- ========================================

-- Check which operations have policies
SELECT 
    'Policy Coverage' as check_type,
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
    'DELETE' as operation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'users' 
            AND cmd = 'DELETE'
        ) THEN '✅ Has policy'
        ELSE '❌ Missing policy'
    END as status;

-- ========================================
-- 6. CHECK POLICY SECURITY
-- ========================================

-- Check for potentially insecure policies
SELECT 
    'Security Analysis' as check_type,
    policyname,
    cmd as command,
    CASE 
        WHEN qual IS NULL AND cmd IN ('SELECT', 'UPDATE', 'DELETE') THEN '⚠️ No USING condition - allows all records'
        WHEN with_check IS NULL AND cmd = 'INSERT' THEN '⚠️ No WITH CHECK condition - allows any data'
        WHEN qual LIKE '%true%' THEN '⚠️ Always true condition - allows all records'
        WHEN with_check LIKE '%true%' THEN '⚠️ Always true WITH CHECK - allows any data'
        ELSE '✅ Secure policy'
    END as security_status,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY security_status, policyname;

-- ========================================
-- 7. CHECK POLICY NAMING CONVENTION
-- ========================================

-- Check if policies follow naming convention
SELECT 
    'Naming Convention' as check_type,
    policyname,
    CASE 
        WHEN policyname LIKE 'Users can %' THEN '✅ Follows convention'
        WHEN policyname LIKE '%users%' OR policyname LIKE '%user%' THEN '⚠️ Contains user reference'
        ELSE '❌ Does not follow convention'
    END as naming_status,
    cmd as command
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY policyname;

-- ========================================
-- 8. CHECK FOR DUPLICATE POLICIES
-- ========================================

-- Check for duplicate policy names
SELECT 
    'Duplicate Policies' as check_type,
    policyname,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 1 THEN '❌ Duplicate policy names'
        ELSE '✅ Unique policy names'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
GROUP BY policyname
ORDER BY count DESC, policyname;

-- ========================================
-- 9. CHECK POLICY ROLES
-- ========================================

-- Check which roles are assigned to policies
SELECT 
    'Policy Roles' as check_type,
    policyname,
    cmd as command,
    roles,
    CASE 
        WHEN roles IS NULL OR roles = '{}' THEN 'All roles'
        WHEN 'anon' = ANY(roles) THEN 'Includes anonymous'
        WHEN 'authenticated' = ANY(roles) THEN 'Includes authenticated'
        WHEN 'service_role' = ANY(roles) THEN 'Includes service role'
        ELSE 'Custom roles'
    END as role_type
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY policyname;

-- ========================================
-- 10. SUMMARY REPORT
-- ========================================

-- Summary of users table RLS status
SELECT 
    'Summary Report' as check_type,
    'Total Policies' as metric,
    COUNT(*) as value
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'

UNION ALL

SELECT 
    'Summary Report' as check_type,
    'SELECT Policies' as metric,
    COUNT(*) as value
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
AND cmd = 'SELECT'

UNION ALL

SELECT 
    'Summary Report' as check_type,
    'INSERT Policies' as metric,
    COUNT(*) as value
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
AND cmd = 'INSERT'

UNION ALL

SELECT 
    'Summary Report' as check_type,
    'UPDATE Policies' as metric,
    COUNT(*) as value
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
AND cmd = 'UPDATE'

UNION ALL

SELECT 
    'Summary Report' as check_type,
    'DELETE Policies' as metric,
    COUNT(*) as value
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
AND cmd = 'DELETE'

UNION ALL

SELECT 
    'Summary Report' as check_type,
    'RLS Enabled' as metric,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'users' 
            AND rowsecurity = true
        ) THEN 1
        ELSE 0
    END as value;

-- ========================================
-- SCRIPT COMPLETED
-- ========================================
-- User RLS policies verification completed
-- Check the results above for any security issues
-- ========================================



