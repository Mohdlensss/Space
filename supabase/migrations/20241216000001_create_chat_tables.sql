-- DOO Chat - Channels and Messages Tables
-- This migration creates the tables needed for the native DOO Chat feature

-- Channels table
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_direct BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for channels
-- All authenticated users can view channels
CREATE POLICY "Authenticated users can view channels" ON public.channels
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for messages
-- All authenticated users can view messages
CREATE POLICY "Authenticated users can view messages" ON public.messages
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can insert messages
CREATE POLICY "Authenticated users can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own messages
CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages" ON public.messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Insert default channels if they don't exist
INSERT INTO public.channels (name, description, is_direct)
VALUES 
  ('general', 'General discussions for the whole DOO team', false),
  ('engineering', 'Engineering team discussions', false),
  ('product', 'Product updates and discussions', false),
  ('random', 'Off-topic conversations and fun', false)
ON CONFLICT (name) DO NOTHING;

