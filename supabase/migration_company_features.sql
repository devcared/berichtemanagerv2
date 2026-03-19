-- ============================================================
-- Company Features Migration
-- 1. Abteilungs-Rotationsplan
-- 2. Strukturiertes Ausbilder-Feedback
-- 3. Firmeninterner Chat
-- 4. Mehrere Ausbilder pro Unternehmen
-- ============================================================

-- ── 1. Department Rotations ──────────────────────────────────
CREATE TABLE IF NOT EXISTS department_rotations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  apprentice_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department    TEXT NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE,
  notes         TEXT,
  created_by    UUID NOT NULL REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rotations_apprentice ON department_rotations(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_rotations_company    ON department_rotations(company_id);

ALTER TABLE department_rotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rotation_read" ON department_rotations;
CREATE POLICY "rotation_read" ON department_rotations FOR SELECT
  USING (
    apprentice_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
        AND p.role IN ('trainer','admin')
        AND p.company_id = department_rotations.company_id
    )
  );

DROP POLICY IF EXISTS "rotation_write" ON department_rotations;
CREATE POLICY "rotation_write" ON department_rotations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
        AND p.role IN ('trainer','admin')
        AND p.company_id = department_rotations.company_id
    )
  );

-- ── 2. Trainer Feedback ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS trainer_feedback (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  trainer_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  apprentice_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_label          TEXT NOT NULL,
  rating_punctuality    SMALLINT CHECK (rating_punctuality BETWEEN 1 AND 5),
  rating_effort         SMALLINT CHECK (rating_effort BETWEEN 1 AND 5),
  rating_expertise      SMALLINT CHECK (rating_expertise BETWEEN 1 AND 5),
  rating_social         SMALLINT CHECK (rating_social BETWEEN 1 AND 5),
  comment               TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_apprentice ON trainer_feedback(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_feedback_trainer    ON trainer_feedback(trainer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_company    ON trainer_feedback(company_id);

ALTER TABLE trainer_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedback_read" ON trainer_feedback;
CREATE POLICY "feedback_read" ON trainer_feedback FOR SELECT
  USING (
    apprentice_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
        AND p.role IN ('trainer','admin')
        AND p.company_id = trainer_feedback.company_id
    )
  );

DROP POLICY IF EXISTS "feedback_write" ON trainer_feedback;
CREATE POLICY "feedback_write" ON trainer_feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
        AND p.role IN ('trainer','admin')
        AND p.company_id = trainer_feedback.company_id
    )
  );

-- ── 3. Company Chat ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_company_created ON chat_messages(company_id, created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_read" ON chat_messages;
CREATE POLICY "chat_read" ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
        AND p.company_id = chat_messages.company_id
    )
  );

DROP POLICY IF EXISTS "chat_insert" ON chat_messages;
CREATE POLICY "chat_insert" ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
        AND p.company_id = chat_messages.company_id
    )
  );

-- Enable Realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ── 4. Apprentice–Trainer assignments ───────────────────────
CREATE TABLE IF NOT EXISTS apprentice_trainers (
  apprentice_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assigned_by   UUID NOT NULL REFERENCES profiles(id),
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (apprentice_id, trainer_id)
);

CREATE INDEX IF NOT EXISTS idx_apt_apprentice ON apprentice_trainers(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_apt_trainer    ON apprentice_trainers(trainer_id);
CREATE INDEX IF NOT EXISTS idx_apt_company    ON apprentice_trainers(company_id);

ALTER TABLE apprentice_trainers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "apt_read" ON apprentice_trainers;
CREATE POLICY "apt_read" ON apprentice_trainers FOR SELECT
  USING (
    apprentice_id = auth.uid()
    OR trainer_id  = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
        AND p.role IN ('trainer','admin')
        AND p.company_id = apprentice_trainers.company_id
    )
  );

DROP POLICY IF EXISTS "apt_write" ON apprentice_trainers;
CREATE POLICY "apt_write" ON apprentice_trainers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
        AND p.role IN ('trainer','admin')
        AND p.company_id = apprentice_trainers.company_id
    )
  );
