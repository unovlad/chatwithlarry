-- Швидкі адміністративні команди
-- Виконайте цей запит в Supabase SQL Editor

-- Встановлюємо service_role
SET LOCAL role TO service_role;

-- 1. ПЕРЕГЛЯД ВСІХ КОРИСТУВАЧІВ
SELECT 
    id,
    email,
    full_name,
    messages_limit,
    messages_used,
    subscription_plan,
    created_at
FROM public.users 
ORDER BY created_at DESC;

-- 2. ЗБІЛЬШИТИ ЛІМІТ ПОВІДОМЛЕНЬ (приклад)
-- UPDATE public.users 
-- SET messages_limit = 100 
-- WHERE email = 'hestamp@gmail.com';

-- 3. ЗМІНИТИ ПЛАН ПІДПИСКИ (приклад)
-- UPDATE public.users 
-- SET subscription_plan = 'premium' 
-- WHERE email = 'hestamp@gmail.com';

-- 4. СКИНУТИ ЛІЧИЛЬНИК ПОВІДОМЛЕНЬ (приклад)
-- UPDATE public.users 
-- SET messages_used = 0 
-- WHERE email = 'hestamp@gmail.com';

-- 5. ВИДАЛИТИ КОРИСТУВАЧА (приклад)
-- DELETE FROM public.users 
-- WHERE email = 'hestamp@gmail.com';

-- 6. ДОДАТИ ПОВІДОМЛЕННЯ (приклад)
-- UPDATE public.users 
-- SET messages_used = messages_used + 1 
-- WHERE email = 'hestamp@gmail.com';

-- 7. ПОШУК КОРИСТУВАЧА ПО EMAIL
-- SELECT * FROM public.users WHERE email LIKE '%hestamp%';

-- 8. ПОШУК КОРИСТУВАЧА ПО ID
-- SELECT * FROM public.users WHERE id = 'ed90f4b8-9c4f-4072-b610-4c0c15fd7d39';

