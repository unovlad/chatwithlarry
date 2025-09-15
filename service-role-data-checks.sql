-- ========================================
-- ПЕРЕВІРКА ДАНИХ З SERVICE_ROLE
-- ========================================

-- ВАЖЛИВО: Запускайте ці запити з service_role для доступу до даних

-- Встановлюємо service_role
SET LOCAL role TO service_role;

-- 1. ПЕРЕГЛЯД ВСІХ КОРИСТУВАЧІВ
-- ========================================
SELECT 
    'All Users' as check_type,
    id,
    email,
    full_name,
    subscription_plan,
    subscription_status,
    messages_used,
    messages_limit,
    created_at
FROM public.users 
ORDER BY created_at DESC;

-- 2. СТАТИСТИКА КОРИСТУВАЧІВ
-- ========================================
SELECT 
    'User Statistics' as check_type,
    subscription_plan,
    count(*) as user_count,
    avg(messages_used) as avg_messages_used,
    max(messages_used) as max_messages_used
FROM public.users 
GROUP BY subscription_plan;

-- 3. КОРИСТУВАЧІ НА МЕЖІ ЛІМІТУ
-- ========================================
SELECT 
    'Users Near Limit' as check_type,
    id,
    email,
    subscription_plan,
    messages_used,
    messages_limit,
    (messages_limit - messages_used) as remaining_messages
FROM public.users 
WHERE messages_used >= (messages_limit * 0.8)
AND subscription_plan = 'free'
ORDER BY messages_used DESC;

-- 4. ПЕРЕГЛЯД ВСІХ ЧАТІВ
-- ========================================
SELECT 
    'All Chats' as check_type,
    id,
    user_id,
    title,
    created_at,
    updated_at
FROM public.chats 
ORDER BY created_at DESC;

-- 5. СТАТИСТИКА ЧАТІВ
-- ========================================
SELECT 
    'Chat Statistics' as check_type,
    count(*) as total_chats,
    count(distinct user_id) as unique_users_with_chats,
    avg(length(title)) as avg_title_length
FROM public.chats;

-- 6. ПЕРЕГЛЯД ВСІХ ПОВІДОМЛЕНЬ
-- ========================================
SELECT 
    'All Messages' as check_type,
    id,
    chat_id,
    role,
    length(content) as content_length,
    created_at
FROM public.messages 
ORDER BY created_at DESC;

-- 7. СТАТИСТИКА ПОВІДОМЛЕНЬ
-- ========================================
SELECT 
    'Message Statistics' as check_type,
    role,
    count(*) as message_count,
    avg(length(content)) as avg_content_length
FROM public.messages 
GROUP BY role;

-- 8. ПЕРЕВІРКА AUTH.USERS
-- ========================================
SELECT 
    'Auth Users' as check_type,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC;

-- 9. ПОРІВНЯННЯ AUTH.USERS ТА PUBLIC.USERS
-- ========================================
SELECT 
    'User Sync Check' as check_type,
    'Users in auth but not in public' as issue_type,
    count(*) as count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL

UNION ALL

SELECT 
    'User Sync Check' as check_type,
    'Users in public but not in auth' as issue_type,
    count(*) as count
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;

-- 10. ПЕРЕВІРКА ЦІЛІСНОСТІ ДАНИХ
-- ========================================
SELECT 
    'Data Integrity' as check_type,
    'Orphaned Chats' as issue_type,
    count(*) as count
FROM public.chats c
LEFT JOIN public.users u ON c.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'Data Integrity' as check_type,
    'Orphaned Messages' as issue_type,
    count(*) as count
FROM public.messages m
LEFT JOIN public.chats c ON m.chat_id = c.id
WHERE c.id IS NULL;

-- 11. ЗАГАЛЬНА СТАТИСТИКА СИСТЕМИ
-- ========================================
SELECT 
    'System Overview' as check_type,
    'Total Users' as metric,
    count(*) as value
FROM public.users

UNION ALL

SELECT 
    'System Overview' as check_type,
    'Total Chats' as metric,
    count(*) as value
FROM public.chats

UNION ALL

SELECT 
    'System Overview' as check_type,
    'Total Messages' as metric,
    count(*) as value
FROM public.messages

UNION ALL

SELECT 
    'System Overview' as check_type,
    'Users at Limit' as metric,
    count(*) as value
FROM public.users 
WHERE messages_used >= messages_limit
AND subscription_plan = 'free';

-- 12. ПОШУК КОРИСТУВАЧА ПО EMAIL
-- ========================================
-- Замініть 'example@email.com' на потрібний email
SELECT 
    'User Search' as check_type,
    id,
    email,
    full_name,
    subscription_plan,
    messages_used,
    messages_limit,
    created_at
FROM public.users 
WHERE email LIKE '%example@email.com%';

-- 13. ПОШУК КОРИСТУВАЧА ПО ID
-- ========================================
-- Замініть 'user-id-here' на потрібний ID
SELECT 
    'User by ID' as check_type,
    id,
    email,
    full_name,
    subscription_plan,
    messages_used,
    messages_limit,
    created_at
FROM public.users 
WHERE id = 'user-id-here';

-- 14. ЧАТИ КОНКРЕТНОГО КОРИСТУВАЧА
-- ========================================
-- Замініть 'user-id-here' на потрібний ID
SELECT 
    'User Chats' as check_type,
    c.id,
    c.title,
    c.created_at,
    c.updated_at,
    count(m.id) as message_count
FROM public.chats c
LEFT JOIN public.messages m ON c.id = m.chat_id
WHERE c.user_id = 'user-id-here'
GROUP BY c.id, c.title, c.created_at, c.updated_at
ORDER BY c.created_at DESC;

-- 15. ПОВІДОМЛЕННЯ В КОНКРЕТНОМУ ЧАТІ
-- ========================================
-- Замініть 'chat-id-here' на потрібний ID чату
SELECT 
    'Chat Messages' as check_type,
    id,
    role,
    left(content, 100) as content_preview,
    created_at
FROM public.messages 
WHERE chat_id = 'chat-id-here'
ORDER BY created_at ASC;
