# Database Documentation - Larry AI

## Overview

Larry AI uses Supabase as a backend-as-a-service with PostgreSQL database. The system includes user authentication, chat and message storage, and subscription management.

## Database Schema

### 1. Users Table (`public.users`)

Main users table that extends the standard Supabase `auth.users` table.

```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Subscription fields
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'premium', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,

  -- Stripe fields
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_payment_method_id TEXT,
  stripe_default_payment_method TEXT,
  stripe_invoice_settings JSONB DEFAULT '{}',
  stripe_metadata JSONB DEFAULT '{}',

  -- Usage tracking
  messages_used INTEGER DEFAULT 0,
  messages_limit INTEGER DEFAULT 30,
  last_message_date TIMESTAMP WITH TIME ZONE,
  monthly_reset_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),

  -- Business logic
  trial_used BOOLEAN DEFAULT FALSE,
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  onboarding_completed BOOLEAN DEFAULT FALSE,

  -- User preferences
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  notification_settings JSONB DEFAULT '{}',
  user_preferences JSONB DEFAULT '{}'
);
```

#### Fields Description:

- **id**: UUID referencing `auth.users(id)`
- **email**: User's email address (unique)
- **full_name**: User's full name (optional)
- **subscription_plan**: Subscription type ('free', 'premium', 'enterprise')
- **subscription_status**: Subscription status ('active', 'inactive', 'cancelled', 'past_due')
- **messages_used**: Number of messages used
- **messages_limit**: Message limit (30 for free, unlimited for premium)
- **monthly_reset_date**: Date to reset message counter
- **trial_used**: Whether user has used trial period
- **onboarding_completed**: Whether user completed onboarding

### 2. Chats Table (`public.chats`)

Table for storing user chats.

```sql
CREATE TABLE public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Fields Description:

- **id**: Unique chat identifier
- **user_id**: ID of the chat owner
- **title**: Chat title
- **created_at**: Creation date
- **updated_at**: Last update date

### 3. Messages Table (`public.messages`)

Table for storing messages in chats.

```sql
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Fields Description:

- **id**: Unique message identifier
- **chat_id**: ID of the chat this message belongs to
- **role**: Sender role ('user', 'assistant', 'system')
- **content**: Message text
- **created_at**: Creation date

## Indexes

For performance optimization, the following indexes are created:

```sql
-- Users indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX idx_users_subscription_plan ON public.users(subscription_plan);
CREATE INDEX idx_users_subscription_status ON public.users(subscription_status);

-- Chats indexes
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_chats_created_at ON public.chats(created_at);

-- Messages indexes
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
```

## Row Level Security (RLS)

All tables have RLS enabled to ensure data security.

### RLS Policies

#### Users Table Policies:

```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

#### Chats Table Policies:

```sql
-- Users can view own chats
CREATE POLICY "Users can view own chats" ON public.chats
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create own chats
CREATE POLICY "Users can create own chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own chats
CREATE POLICY "Users can update own chats" ON public.chats
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete own chats
CREATE POLICY "Users can delete own chats" ON public.chats
  FOR DELETE USING (auth.uid() = user_id);
```

#### Messages Table Policies:

```sql
-- Users can view messages in own chats
CREATE POLICY "Users can view messages in own chats" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

-- Users can create messages in own chats
CREATE POLICY "Users can create messages in own chats" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

-- Users can update messages in own chats
CREATE POLICY "Users can update messages in own chats" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

-- Users can delete messages in own chats
CREATE POLICY "Users can delete messages in own chats" ON public.messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );
```

## Database Triggers

### Automatic User Profile Creation

When a new user registers through Supabase Auth, a profile is automatically created in the `public.users` table.

#### Trigger Function:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    subscription_plan,
    subscription_status,
    messages_used,
    messages_limit,
    monthly_reset_date,
    trial_used,
    onboarding_completed,
    timezone,
    language,
    notification_settings,
    user_preferences
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'free',
    'active',
    0,
    30,
    NOW() + INTERVAL '1 month',
    false,
    false,
    'UTC',
    'en',
    '{}',
    '{}'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Trigger:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## User Creation Flow

### 1. Registration Process

1. **User fills registration form** (email, password, full_name)
2. **Supabase Auth creates record in `auth.users`**
3. **Trigger `on_auth_user_created` automatically fires**
4. **Trigger creates record in `public.users`** with all necessary fields
5. **AuthContext receives ready user profile**

### 2. Default Values for New Users

When creating a new user, the following default values are set:

- **subscription_plan**: 'free'
- **subscription_status**: 'active'
- **messages_used**: 0
- **messages_limit**: 30
- **monthly_reset_date**: current date + 1 month
- **trial_used**: false
- **onboarding_completed**: false
- **timezone**: 'UTC'
- **language**: 'en'
- **notification_settings**: '{}'
- **user_preferences**: '{}'

## Message Limits System

### Free Plan

- **Limit**: 30 messages per month
- **Reset**: monthly (monthly_reset_date)
- **Check**: via `userService.canSendMessage()`

### Premium Plan

- **Limit**: unlimited
- **Check**: `subscription_plan === 'premium'`

### Anonymous Users

- **Limit**: 3 messages (stored in localStorage)
- **Check**: via `localStorage` functions

## Security Considerations

1. **RLS Enabled**: All tables have Row Level Security enabled
2. **User Isolation**: Users can only see their own data
3. **Secure Triggers**: Trigger functions use `SECURITY DEFINER`
4. **Input Validation**: All fields have appropriate constraints and checks

## API Integration

### Supabase Client Configuration

```typescript
// Browser client
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Server client
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Ignore errors in server components
          }
        },
      },
    },
  );
}
```

## Future Enhancements

1. **Stripe Integration**: Full Stripe integration for subscriptions
2. **Message Analytics**: Additional usage metrics
3. **Chat Export**: Chat export functionality
4. **Advanced RLS**: More complex policies for enterprise users
5. **Database Migrations**: Migration system for schema updates

## Troubleshooting

### Common Issues

1. **RLS Policy Violations**: Check if policies are properly configured
2. **Trigger Not Firing**: Ensure trigger is active
3. **User Profile Not Created**: Check trigger function logic
4. **Permission Denied**: Check RLS policies and access rights

### Useful Queries

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check active policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public';

-- Check trigger status
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```
