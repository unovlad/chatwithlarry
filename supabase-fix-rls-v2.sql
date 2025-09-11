-- Видаляємо старі політики для users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

-- Створюємо нові політики для users
-- Дозволяємо користувачам переглядати тільки свої дані
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Дозволяємо користувачам оновлювати тільки свої дані
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Дозволяємо створювати записи тільки з власним ID
CREATE POLICY "Users can create own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Дозволяємо видаляти тільки свої дані
CREATE POLICY "Users can delete own profile" ON public.users
  FOR DELETE USING (auth.uid() = id);

-- Додаткова політика для системних операцій (якщо потрібно)
-- CREATE POLICY "Service role can manage users" ON public.users
--   FOR ALL USING (auth.role() = 'service_role');

-- Перевіряємо поточні політики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';
