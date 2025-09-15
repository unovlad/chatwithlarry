-- Додавання політики DELETE для користувачів
-- Виконайте цей запит в Supabase SQL Editor якщо потрібно дозволити користувачам видаляти свої профілі

-- Додати політику для DELETE (видалення власного профілю)
CREATE POLICY "Users can delete own profile" ON public.users
    FOR DELETE
    USING (auth.uid() = id);

-- Перевірити всі політики
SELECT 
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as condition,
    with_check as with_check_condition
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Тест політики DELETE
-- Користувач зможе видалити тільки свій профіль:
-- DELETE FROM public.users WHERE id = auth.uid();

