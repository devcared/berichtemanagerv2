-- ============================================================
-- Chat: Reactions, Reply-to, Image uploads
-- ============================================================

-- 1. Extend chat_messages with reply_to and image_url
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_url   TEXT;

-- 2. Reactions table
CREATE TABLE IF NOT EXISTS chat_reactions (
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id)      ON DELETE CASCADE,
  emoji      TEXT NOT NULL CHECK (char_length(emoji) <= 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id, emoji)
);

ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions_read"   ON chat_reactions;
DROP POLICY IF EXISTS "reactions_insert" ON chat_reactions;
DROP POLICY IF EXISTS "reactions_delete" ON chat_reactions;

-- Read: same company only
CREATE POLICY "reactions_read" ON chat_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN profiles p ON p.id = auth.uid()
      WHERE cm.id = chat_reactions.message_id
        AND cm.company_id = p.company_id
    )
  );

-- Insert / Delete: own reactions only
CREATE POLICY "reactions_insert" ON chat_reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reactions_delete" ON chat_reactions FOR DELETE
  USING (user_id = auth.uid());

-- Add reactions to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_reactions;

-- 3. Supabase Storage bucket for chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images', 'chat-images', true,
  10485760,  -- 10 MB max
  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
DROP POLICY IF EXISTS "chat_images_read"   ON storage.objects;
DROP POLICY IF EXISTS "chat_images_insert" ON storage.objects;

CREATE POLICY "chat_images_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

CREATE POLICY "chat_images_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-images' AND auth.uid() IS NOT NULL);
