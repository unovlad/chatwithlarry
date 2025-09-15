# Database Documentation - Larry AI

## Overview

Larry AI використовує Supabase як backend-as-a-service з PostgreSQL базою даних. Система включає авторизацію користувачів, збереження чатів та повідомлень, а також управління підписками.

## Database Schema

### 1. Users Table (`public.users`)

Основна таблиця користувачів, яка розширює стандартну таблицю `auth.users` Supabase.

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

- **id**: UUID, що посилається на `auth.users(id)`
- **email**: Email користувача (унікальний)
- **full_name**: Повне ім'я користувача (опціональне)
- **subscription_plan**: Тип підписки ('free', 'premium', 'enterprise')
- **subscription_status**: Статус підписки ('active', 'inactive', 'cancelled', 'past_due')
- **messages_used**: Кількість використаних повідомлень
- **messages_limit**: Ліміт повідомлень (30 для free, безліміт для premium)
- **monthly_reset_date**: Дата скидання лічильника повідомлень
- **trial_used**: Чи використовував користувач пробний період
- **onboarding_completed**: Чи завершив користувач онбординг

### 2. Chats Table (`public.chats`)

Таблиця для збереження чатів користувачів.

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

- **id**: Унікальний ідентифікатор чату
- **user_id**: ID користувача-власника чату
- **title**: Назва чату
- **created_at**: Дата створення
- **updated_at**: Дата останнього оновлення

### 3. Messages Table (`public.messages`)

Таблиця для збереження повідомлень в чатах.

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

- **id**: Унікальний ідентифікатор повідомлення
- **chat_id**: ID чату, до якого належить повідомлення
- **role**: Роль відправника ('user', 'assistant', 'system')
- **content**: Текст повідомлення
- **created_at**: Дата створення

## Indexes

Для оптимізації продуктивності створені наступні індекси:

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

Всі таблиці мають увімкнений RLS для забезпечення безпеки даних.

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

При реєстрації нового користувача через Supabase Auth автоматично створюється профіль в таблиці `public.users`.

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
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      ''
    ),
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

1. **Користувач заповнює форму реєстрації** (email, password, full_name)
2. **Supabase Auth створює запис в `auth.users`**
3. **Автоматично спрацьовує trigger `on_auth_user_created`**
4. **Trigger створює запис в `public.users`** з усіма необхідними полями
5. **AuthContext отримує готовий профіль користувача**

### 2. Default Values for New Users

При створенні нового користувача встановлюються наступні значення за замовчуванням:

- **subscription_plan**: 'free'
- **subscription_status**: 'active'
- **messages_used**: 0
- **messages_limit**: 30
- **monthly_reset_date**: поточна дата + 1 місяць
- **trial_used**: false
- **onboarding_completed**: false
- **timezone**: 'UTC'
- **language**: 'en'
- **notification_settings**: '{}'
- **user_preferences**: '{}'

## Message Limits System

### Free Plan

- **Ліміт**: 30 повідомлень на місяць
- **Скидання**: щомісяця (monthly_reset_date)
- **Перевірка**: через `userService.canSendMessage()`

### Premium Plan

- **Ліміт**: безліміт
- **Перевірка**: `subscription_plan === 'premium'`

### Anonymous Users

- **Ліміт**: 3 повідомлення (зберігається в localStorage)
- **Перевірка**: через `localStorage` функції

## Security Considerations

1. **RLS Enabled**: Всі таблиці мають увімкнений Row Level Security
2. **User Isolation**: Користувачі можуть бачити тільки свої дані
3. **Secure Triggers**: Trigger функції використовують `SECURITY DEFINER`
4. **Input Validation**: Всі поля мають відповідні constraints та checks

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

1. **Stripe Integration**: Повна інтеграція з Stripe для підписок
2. **Message Analytics**: Додаткові метрики використання
3. **Chat Export**: Функція експорту чатів
4. **Advanced RLS**: Більш складні політики для enterprise користувачів
5. **Database Migrations**: Система міграцій для оновлень схеми

## Troubleshooting

### Common Issues

1. **RLS Policy Violations**: Перевірте, чи правильно налаштовані політики
2. **Trigger Not Firing**: Переконайтеся, що trigger активний
3. **User Profile Not Created**: Перевірте логіку trigger функції
4. **Permission Denied**: Перевірте RLS політики та права доступу

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
