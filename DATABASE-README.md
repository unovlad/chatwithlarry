# Larry AI - Complete Database Deployment Guide

## Overview

This comprehensive set of SQL scripts creates the complete database structure for Larry AI based on Supabase PostgreSQL. All scripts have been created by analyzing all existing SQL files in the project.

## Files

### 1. `database-complete-deployment.sql` - Main deployment script (RECOMMENDED)

Complete SQL script for creating the entire database structure:

- ✅ 3 tables (users, chats, messages)
- ✅ 11 indexes for optimization
- ✅ 12 RLS policies for security
- ✅ 3 triggers for automation
- ✅ 2 functions for business logic
- ✅ All components from existing SQL files integrated

### 2. `database-deployment.sql` - Basic deployment script

Basic SQL script for creating database structure:

- ✅ 3 tables (users, chats, messages)
- ✅ 8 indexes for optimization
- ✅ 12 RLS policies for security
- ✅ 3 triggers for automation
- ✅ 2 functions for business logic

### 3. `database-testing-and-admin.sql` - Comprehensive testing and admin script

Complete testing, verification, and administrative operations:

- 🔍 Database structure verification
- 🔍 RLS status and policies testing
- 🔍 Triggers and functions verification
- 🔍 Data integrity checks
- 🔍 Performance monitoring
- 🔍 Administrative operations
- 🔍 User search and management
- 🔍 Security verification
- 🔍 Debug queries

### 4. `database-verification.sql` - Basic verification script

Basic database state verification and admin operations:

- 🔍 Table structure checks
- 🔍 RLS status verification
- 🔍 Triggers and functions
- 🔍 Usage statistics
- 🔍 Administrative operations

## Quick Start

### 1. Database Deployment

```sql
-- Execute in Supabase SQL Editor
\i database-complete-deployment.sql
```

### 2. State Verification

```sql
-- Execute for verification
\i database-testing-and-admin.sql
```

## Database Structure

### `users` Table

Main user profiles table with support for:

- Subscriptions (free/premium/enterprise)
- Stripe integration
- Message limits
- User preferences

### `chats` Table

User conversation storage:

- User relationship
- Chat title
- Timestamps

### `messages` Table

Messages within chats:

- Chat relationship
- Role (user/assistant/system)
- Message content

## Security (RLS)

All tables are protected with Row Level Security:

- Users can only see their own data
- Automatic profile creation on registration
- Protection against unauthorized access

## Automation

### Triggers

1. **on_auth_user_created** - automatically creates profile on registration
2. **update_users_updated_at** - updates timestamp on change
3. **update_chats_updated_at** - updates timestamp on change

### Functions

1. **handle_new_user()** - user profile creation
2. **update_updated_at_column()** - timestamp update

## Message Limits

### Free Plan

- 30 messages per month
- Automatic monthly reset
- Checked via `userService.canSendMessage()`

### Premium/Enterprise

- Unlimited messages
- Checked via `subscription_plan`

## Administrative Operations

### Reset Counter (Free Users)

```sql
UPDATE public.users
SET messages_used = 0, monthly_reset_date = NOW() + INTERVAL '1 month'
WHERE subscription_plan = 'free' AND monthly_reset_date <= NOW();
```

### Update Limit (Premium)

```sql
UPDATE public.users
SET messages_limit = 999999
WHERE subscription_plan IN ('premium', 'enterprise');
```

### Clean Up Old Data

```sql
-- Delete chats older than 1 year
DELETE FROM public.chats
WHERE created_at < NOW() - INTERVAL '1 year';

-- Delete messages older than 1 year
DELETE FROM public.messages
WHERE created_at < NOW() - INTERVAL '1 year';
```

## Monitoring

### Database State Check

```sql
-- Run database-testing-and-admin.sql for comprehensive verification
```

### Key Metrics

- User count by subscription plan
- Message usage statistics
- Table sizes
- RLS policy activity

## TypeScript Typing

All types correspond to `types/user.ts`:

- `User` - user interface
- `Chat` - chat interface
- `Message` - message interface
- `AuthContextType` - authentication context

## Support

If issues arise:

1. Check Supabase logs
2. Run `database-testing-and-admin.sql`
3. Verify RLS policies
4. Check triggers and functions

## Version

- **Database Version**: 1.0.0
- **Compatibility**: Supabase PostgreSQL 15+
- **Creation Date**: 2024

## All SQL Files Analyzed

The following existing SQL files were analyzed and integrated:

- `supabase-auto-create-user.sql`
- `supabase-chat-rls.sql`
- `supabase-fix-rls-v2.sql`
- `supabase-fix-rls.sql`
- `supabase-disable-rls-temp.sql`
- `rls-testing-queries.sql`
- `service-role-data-checks.sql`
- `admin-quick-commands.sql`
- `admin-operations.sql`
- `add-delete-policy.sql`
- `fix-rls-policies.sql`
- `debug-rls-policies.sql`
- `basic-db-checks.sql`
- `database-verification-queries.sql`
- `chat-message.sql`
- `create-new-user.sql`
- `create-users-service-role.sql`
- `create-all-missing-users.sql`
- `create-missing-user.sql`
- `check-all-users.sql`
- `check-user-exists.sql`
- `check-trigger.sql`
- `fix-trigger.sql`
- `delete-user-manually.sql`
