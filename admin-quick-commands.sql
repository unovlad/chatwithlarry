-- ========================================
-- ШВИДКІ АДМІНІСТРАТИВНІ КОМАНДИ
-- ========================================

-- Встановлюємо service_role для повного доступу
SET LOCAL role TO service_role;

-- 1. ПЕРЕГЛЯД ВСІХ КОРИСТУВАЧІВ
-- ========================================
SELECT 
    'All Users Overview' as action,
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

-- 2. ПОШУК КОРИСТУВАЧА ПО EMAIL
-- ========================================
-- Замініть 'example@email.com' на потрібний email
SELECT 
    'User Search by Email' as action,
    id,
    email,
    full_name,
    subscription_plan,
    messages_used,
    messages_limit,
    created_at
FROM public.users 
WHERE email LIKE '%example@email.com%';

-- 3. ПОШУК КОРИСТУВАЧА ПО ID
-- ========================================
-- Замініть 'user-id-here' на потрібний ID
SELECT 
    'User Search by ID' as action,
    id,
    email,
    full_name,
    subscription_plan,
    messages_used,
    messages_limit,
    created_at
FROM public.users 
WHERE id = 'user-id-here';

-- 4. ЗБІЛЬШИТИ ЛІМІТ ПОВІДОМЛЕНЬ
-- ========================================
-- Розкоментуйте та замініть email та новий ліміт
/*
UPDATE public.users 
SET 
    messages_limit = 100,
    updated_at = NOW()
WHERE email = 'example@email.com';
*/

-- 5. ЗМІНИТИ ПЛАН ПІДПИСКИ
-- ========================================
-- Розкоментуйте та замініть email та новий план
/*
UPDATE public.users 
SET 
    subscription_plan = 'premium',
    subscription_status = 'active',
    updated_at = NOW()
WHERE email = 'example@email.com';
*/

-- 6. СКИНУТИ ЛІЧИЛЬНИК ПОВІДОМЛЕНЬ
-- ========================================
-- Розкоментуйте та замініть email
/*
UPDATE public.users 
SET 
    messages_used = 0,
    monthly_reset_date = NOW() + INTERVAL '1 month',
    updated_at = NOW()
WHERE email = 'example@email.com';
*/

-- 7. ДОДАТИ ПОВІДОМЛЕННЯ ДО ЛІМІТУ
-- ========================================
-- Розкоментуйте та замініть email та кількість повідомлень
/*
UPDATE public.users 
SET 
    messages_used = messages_used + 5,
    updated_at = NOW()
WHERE email = 'example@email.com';
*/

-- 8. ВИДАЛИТИ КОРИСТУВАЧА
-- ========================================
-- УВАГА: Це видалить користувача назавжди!
-- Розкоментуйте та замініть email
/*
DELETE FROM public.users 
WHERE email = 'example@email.com';
*/

-- 9. СТАТИСТИКА ВИКОРИСТАННЯ
-- ========================================
SELECT 
    'Usage Statistics' as action,
    subscription_plan,
    count(*) as total_users,
    avg(messages_used) as avg_messages_used,
    max(messages_used) as max_messages_used,
    sum(case when messages_used >= messages_limit then 1 else 0 end) as users_at_limit
FROM public.users 
GROUP BY subscription_plan;

-- 10. КОРИСТУВАЧІ НА МЕЖІ ЛІМІТУ
-- ========================================
SELECT 
    'Users Near Limit' as action,
    id,
    email,
    subscription_plan,
    messages_used,
    messages_limit,
    (messages_limit - messages_used) as remaining_messages
FROM public.users 
WHERE messages_used >= (messages_limit * 0.8) -- 80% від ліміту
AND subscription_plan = 'free'
ORDER BY messages_used DESC;

-- 11. ПЕРЕВІРКА ЧАТІВ КОРИСТУВАЧА
-- ========================================
-- Замініть 'user-id-here' на потрібний ID
SELECT 
    'User Chats' as action,
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

-- 12. ПЕРЕВІРКА ПОВІДОМЛЕНЬ В ЧАТІ
-- ========================================
-- Замініть 'chat-id-here' на потрібний ID чату
SELECT 
    'Chat Messages' as action,
    id,
    role,
    left(content, 100) as content_preview,
    created_at
FROM public.messages 
WHERE chat_id = 'chat-id-here'
ORDER BY created_at ASC;

-- 13. ОЧИСТКА СТАРИХ ДАНИХ
-- ========================================
-- Видалити чати старші за 90 днів (обережно!)
/*
DELETE FROM public.chats 
WHERE created_at < NOW() - INTERVAL '90 days'
AND user_id IN (
    SELECT id FROM public.users 
    WHERE subscription_plan = 'free'
    AND messages_used = 0
);
*/

-- 14. РЕЗЕРВНЕ КОПІЮВАННЯ ДАНИХ
-- ========================================
-- Експорт всіх користувачів
SELECT 
    'Backup Users' as action,
    id,
    email,
    full_name,
    subscription_plan,
    subscription_status,
    messages_used,
    messages_limit,
    created_at,
    updated_at
FROM public.users 
ORDER BY created_at;

-- 15. ПЕРЕВІРКА СИСТЕМИ БЕЗПЕКИ
-- ========================================
-- Перевірка RLS статусу
SELECT 
    'Security Check' as action,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ Secure'
        ELSE '❌ Vulnerable'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages');

-- 16. ПЕРЕВІРКА TRIGGER СТАТУСУ
-- ========================================
SELECT 
    'Trigger Status' as action,
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- 17. МОНІТОРИНГ ПРОДУКТИВНОСТІ
-- ========================================
-- Розмір таблиць
SELECT 
    'Performance Check' as action,
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as table_size,
    (SELECT count(*) FROM public.users) as users_count,
    (SELECT count(*) FROM public.chats) as chats_count,
    (SELECT count(*) FROM public.messages) as messages_count
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'messages')
ORDER BY pg_total_relation_size('public.'||tablename) DESC;

-- 18. ПЕРЕВІРКА ЦІЛІСНОСТІ ДАНИХ
-- ========================================
-- Orphaned records
SELECT 
    'Data Integrity Check' as action,
    'Orphaned Chats' as issue_type,
    count(*) as count
FROM public.chats c
LEFT JOIN public.users u ON c.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'Data Integrity Check' as action,
    'Orphaned Messages' as issue_type,
    count(*) as count
FROM public.messages m
LEFT JOIN public.chats c ON m.chat_id = c.id
WHERE c.id IS NULL;

-- 19. НАЛАШТУВАННЯ ПОВІДОМЛЕНЬ
-- ========================================
-- Скинути всі лічильники повідомлень (обережно!)
/*
UPDATE public.users 
SET 
    messages_used = 0,
    monthly_reset_date = NOW() + INTERVAL '1 month',
    updated_at = NOW()
WHERE subscription_plan = 'free';
*/

-- 20. ЕКСПОРТ ДАНИХ ДЛЯ АНАЛІЗУ
-- ========================================
-- Експорт статистики використання
SELECT 
    'Export Data' as action,
    date_trunc('day', created_at) as date,
    count(*) as new_users,
    sum(messages_used) as total_messages_used
FROM public.users 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY date_trunc('day', created_at)
ORDER BY date DESC;
