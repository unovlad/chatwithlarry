-- ========================================
-- LARRY AI - DETAILED USER POLICIES CHECK
-- ========================================
-- This script shows detailed information about the 4 user policies
-- ========================================

-- ========================================
-- 1. DETAILED POLICY INFORMATION
-- ========================================

-- Get all RLS policies for users table with full details
SELECT 
    'Detailed Policy Info' as check_type,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY cmd, policyname;

-- ========================================
-- 2. POLICY CONDITIONS ANALYSIS
-- ========================================

-- Analyze what each policy does
SELECT 
    'Policy Analysis' as check_type,
    policyname,
    cmd as command,
    CASE 
        WHEN qual LIKE '%auth.uid() = id%' THEN 'Users can only access their own records'
        WHEN qual LIKE '%auth.uid()%' THEN 'Uses user ID for access control'
        WHEN qual IS NULL THEN 'No access restriction (DANGEROUS!)'
        ELSE 'Custom access condition'
    END as access_control,
    CASE 
        WHEN with_check LIKE '%auth.uid() = id%' THEN 'Users can only insert/update their own records'
        WHEN with_check LIKE '%auth.uid()%' THEN 'Uses user ID for insert/update control'
        WHEN with_check IS NULL THEN 'No insert/update restriction'
        ELSE 'Custom insert/update condition'
    END as insert_update_control
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY cmd, policyname;

-- ========================================
-- 3. SECURITY ASSESSMENT
-- ========================================

-- Check if policies are secure
SELECT 
    'Security Assessment' as check_type,
    policyname,
    cmd as command,
    CASE 
        WHEN cmd = 'SELECT' AND qual LIKE '%auth.uid() = id%' THEN '✅ SECURE - Users see only their data'
        WHEN cmd = 'INSERT' AND with_check LIKE '%auth.uid() = id%' THEN '✅ SECURE - Users can only create their own records'
        WHEN cmd = 'UPDATE' AND qual LIKE '%auth.uid() = id%' AND with_check LIKE '%auth.uid() = id%' THEN '✅ SECURE - Users can only update their own records'
        WHEN cmd = 'DELETE' AND qual LIKE '%auth.uid() = id%' THEN '✅ SECURE - Users can only delete their own records'
        WHEN qual IS NULL OR qual = '' THEN '❌ INSECURE - No access restriction'
        WHEN with_check IS NULL AND cmd IN ('INSERT', 'UPDATE') THEN '❌ INSECURE - No insert/update restriction'
        ELSE '⚠️ REVIEW NEEDED - Custom conditions'
    END as security_status,
    qual as using_condition,
    with_check as with_check_condition
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY cmd, policyname;

-- ========================================
-- 4. POLICY NAMES CHECK
-- ========================================

-- Check policy names
SELECT 
    'Policy Names' as check_type,
    policyname,
    cmd as command,
    CASE 
        WHEN policyname LIKE '%view%' AND cmd = 'SELECT' THEN '✅ Good naming'
        WHEN policyname LIKE '%create%' AND cmd = 'INSERT' THEN '✅ Good naming'
        WHEN policyname LIKE '%update%' AND cmd = 'UPDATE' THEN '✅ Good naming'
        WHEN policyname LIKE '%delete%' AND cmd = 'DELETE' THEN '✅ Good naming'
        ELSE '⚠️ Consider renaming for clarity'
    END as naming_assessment
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY cmd, policyname;

-- ========================================
-- 5. ROLES ASSIGNED TO POLICIES
-- ========================================

-- Check which roles can use these policies
SELECT 
    'Policy Roles' as check_type,
    policyname,
    cmd as command,
    CASE 
        WHEN roles IS NULL OR roles = '{}' THEN 'All roles (anon, authenticated, service_role)'
        WHEN 'anon' = ANY(roles) THEN 'Anonymous users included'
        WHEN 'authenticated' = ANY(roles) THEN 'Authenticated users included'
        WHEN 'service_role' = ANY(roles) THEN 'Service role included'
        ELSE 'Custom role assignment'
    END as role_assignment,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY cmd, policyname;

-- ========================================
-- 6. TEST POLICY LOGIC
-- ========================================

-- Show what each policy allows/denies
SELECT 
    'Policy Logic' as check_type,
    policyname,
    cmd as command,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Allows users to READ their own profile data'
        WHEN cmd = 'INSERT' THEN 'Allows users to CREATE their own profile'
        WHEN cmd = 'UPDATE' THEN 'Allows users to MODIFY their own profile data'
        WHEN cmd = 'DELETE' THEN 'Allows users to REMOVE their own profile'
    END as what_it_allows,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Denies access to other users'' data'
        WHEN cmd = 'INSERT' THEN 'Denies creating profiles for other users'
        WHEN cmd = 'UPDATE' THEN 'Denies modifying other users'' data'
        WHEN cmd = 'DELETE' THEN 'Denies deleting other users'' profiles'
    END as what_it_denies
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY cmd, policyname;

-- ========================================
-- 7. RECOMMENDATIONS
-- ========================================

-- Generate recommendations based on current policies
SELECT 
    'Recommendations' as check_type,
    'Current Setup' as aspect,
    'You have 4 policies covering all CRUD operations (SELECT, INSERT, UPDATE, DELETE)' as status

UNION ALL

SELECT 
    'Recommendations' as check_type,
    'Security Level' as aspect,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'users' 
            AND cmd = 'SELECT' 
            AND qual LIKE '%auth.uid() = id%'
        ) THEN '✅ Good - Users can only see their own data'
        ELSE '❌ Review needed - SELECT policy may be too permissive'
    END as status

UNION ALL

SELECT 
    'Recommendations' as check_type,
    'Data Integrity' as aspect,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'users' 
            AND cmd = 'INSERT' 
            AND with_check LIKE '%auth.uid() = id%'
        ) THEN '✅ Good - Users can only create their own profiles'
        ELSE '❌ Review needed - INSERT policy may allow data corruption'
    END as status

UNION ALL

SELECT 
    'Recommendations' as check_type,
    'Update Control' as aspect,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'users' 
            AND cmd = 'UPDATE' 
            AND qual LIKE '%auth.uid() = id%'
            AND with_check LIKE '%auth.uid() = id%'
        ) THEN '✅ Good - Users can only update their own data'
        ELSE '❌ Review needed - UPDATE policy may be insecure'
    END as status

UNION ALL

SELECT 
    'Recommendations' as check_type,
    'Delete Control' as aspect,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'users' 
            AND cmd = 'DELETE' 
            AND qual LIKE '%auth.uid() = id%'
        ) THEN '✅ Good - Users can only delete their own profiles'
        ELSE '❌ Review needed - DELETE policy may be too permissive'
    END as status;

-- ========================================
-- SCRIPT COMPLETED
-- ========================================
-- Detailed user policies analysis completed
-- Review the results above to understand your current RLS setup
-- ========================================

