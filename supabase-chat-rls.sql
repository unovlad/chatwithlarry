-- Enable RLS for chats and messages tables
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chats table
-- Users can view their own chats
CREATE POLICY "Users can view own chats" ON public.chats
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own chats
CREATE POLICY "Users can create own chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own chats
CREATE POLICY "Users can update own chats" ON public.chats
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own chats
CREATE POLICY "Users can delete own chats" ON public.chats
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for messages table
-- Users can view messages from their own chats
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- Users can create messages in their own chats
CREATE POLICY "Users can create own messages" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- Users can update messages in their own chats
CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- Users can delete messages from their own chats
CREATE POLICY "Users can delete own messages" ON public.messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('chats', 'messages')
ORDER BY tablename, policyname;
