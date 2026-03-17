-- =============================================================
-- AzubiHub – Migration: Features 2, 3, 5
-- Sicher ausführbar auf bestehender Datenbank (idempotent)
-- =============================================================
-- Reihenfolge:
--   1. profiles  – Rolle hinzufügen
--   2. weekly_reports – Status-Daten migrieren, Constraint tauschen
--   3. Neue Tabellen: report_comments, report_approvals,
--                     report_status_history, push_subscriptions
--   4. RLS aktivieren + Policies
--   5. Storage Policies aktualisieren
-- =============================================================

BEGIN;

-- =============================================================
-- 1. PROFILES – Rolle
-- =============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'apprentice';

-- Constraint nur hinzufügen wenn noch nicht vorhanden
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('apprentice', 'trainer'));
  END IF;
END $$;


-- =============================================================
-- 2. WEEKLY_REPORTS – Status-Migration + Constraint-Tausch
-- =============================================================

-- Schritt 1: Alten Constraint ZUERST entfernen (bevor Daten geändert werden!)
ALTER TABLE weekly_reports
  DROP CONSTRAINT IF EXISTS weekly_reports_status_check;

-- Schritt 2: Bestehende Zeilen auf neue Status-Werte mappen
--   completed  → submitted   (Bericht war fertig, wartete auf Freigabe)
--   exported   → approved    (Bericht war finalisiert / als PDF raus)
UPDATE weekly_reports SET status = 'submitted'  WHERE status = 'completed';
UPDATE weekly_reports SET status = 'approved'   WHERE status = 'exported';

-- Schritt 3: Neuen Constraint mit erweitertem Status-Set hinzufügen
ALTER TABLE weekly_reports
  ADD CONSTRAINT weekly_reports_status_check
  CHECK (status IN (
    'draft',          -- Entwurf (Azubi schreibt noch)
    'submitted',      -- Eingereicht (Azubi hat abgeschlossen)
    'in_review',      -- In Prüfung (Ausbilder schaut sich an)
    'approved',       -- Freigegeben (Ausbilder hat unterschrieben)
    'needs_revision'  -- Überarbeitung nötig (Ausbilder schickt zurück)
  ));

-- Schritt 4: exported_at umnutzen als approved_at (bleibt Spalte, andere Bedeutung)
-- Neue Spalte submitted_at hinzufügen
ALTER TABLE weekly_reports
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;


-- =============================================================
-- 3. NEUE TABELLE: report_comments
--    Kommentare von Ausbilder oder Azubi zu einem Bericht
-- =============================================================
CREATE TABLE IF NOT EXISTS report_comments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id    UUID        NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
  author_id    UUID        NOT NULL REFERENCES profiles(id)       ON DELETE CASCADE,
  section      TEXT        NOT NULL DEFAULT 'general',
  -- 'general' = allgemeiner Kommentar
  -- 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' = Tages-Kommentar
  content      TEXT        NOT NULL,
  is_resolved  BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================
-- 4. NEUE TABELLE: report_approvals
--    Freigaben inkl. digitaler Signatur
-- =============================================================
CREATE TABLE IF NOT EXISTS report_approvals (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id        UUID        NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
  trainer_id       UUID        NOT NULL REFERENCES profiles(id)       ON DELETE CASCADE,
  trainer_name     TEXT        NOT NULL,
  signature_data   TEXT,
  -- Base64-PNG der handschriftlichen Unterschrift
  -- NULL = nur Text-Freigabe ohne Signatur
  approved_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  report_snapshot  JSONB,
  -- Snapshot des Berichtsinhalts zum Zeitpunkt der Freigabe (Versionierung)
  notes            TEXT
  -- Optionaler Prüfvermerk / Kommentar zur Freigabe
);


-- =============================================================
-- 5. NEUE TABELLE: report_status_history  (Audit-Log)
--    Wer hat wann welchen Status gesetzt?
-- =============================================================
CREATE TABLE IF NOT EXISTS report_status_history (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id    UUID        NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
  changed_by   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  old_status   TEXT,
  new_status   TEXT        NOT NULL,
  comment      TEXT,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================
-- 6. NEUE TABELLE: push_subscriptions  (Feature 5 – Push-Erinnerungen)
-- =============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint       TEXT        NOT NULL,
  p256dh         TEXT        NOT NULL,
  auth_key       TEXT        NOT NULL,
  reminder_day   INTEGER     NOT NULL DEFAULT 5
                             CHECK (reminder_day BETWEEN 1 AND 7),
  -- 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa, 7=So
  reminder_time  TEXT        NOT NULL DEFAULT '14:00',
  -- HH:MM im Format "14:00"
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, endpoint)
);


-- =============================================================
-- 7. ROW LEVEL SECURITY aktivieren
-- =============================================================
ALTER TABLE report_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_approvals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions    ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- 8. RLS POLICIES – report_comments
-- =============================================================

-- Bestehende Policies entfernen (idempotent)
DROP POLICY IF EXISTS "Azubi liest Kommentare eigener Berichte"  ON report_comments;
DROP POLICY IF EXISTS "Ausbilder liest alle Kommentare"          ON report_comments;
DROP POLICY IF EXISTS "Nutzer schreibt Kommentar"                ON report_comments;
DROP POLICY IF EXISTS "Autor aktualisiert Kommentar"             ON report_comments;
DROP POLICY IF EXISTS "Autor löscht Kommentar"                   ON report_comments;

-- Azubi darf Kommentare zu seinen eigenen Berichten lesen
CREATE POLICY "Azubi liest Kommentare eigener Berichte"
  ON report_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM weekly_reports wr
      WHERE wr.id = report_comments.report_id
        AND wr.profile_id = auth.uid()
    )
    OR author_id = auth.uid()
  );

-- Ausbilder darf alle Kommentare lesen
CREATE POLICY "Ausbilder liest alle Kommentare"
  ON report_comments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer')
  );

-- Kommentar erstellen: Azubi zu eigenem Bericht ODER Ausbilder
CREATE POLICY "Nutzer schreibt Kommentar"
  ON report_comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM weekly_reports wr
        WHERE wr.id = report_comments.report_id
          AND wr.profile_id = auth.uid()
      )
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer')
    )
  );

CREATE POLICY "Autor aktualisiert Kommentar"
  ON report_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Autor löscht Kommentar"
  ON report_comments FOR DELETE
  USING (author_id = auth.uid());


-- =============================================================
-- 9. RLS POLICIES – report_approvals
-- =============================================================

DROP POLICY IF EXISTS "Azubi liest Freigabe eigener Berichte" ON report_approvals;
DROP POLICY IF EXISTS "Ausbilder liest alle Freigaben"        ON report_approvals;
DROP POLICY IF EXISTS "Ausbilder erstellt Freigabe"           ON report_approvals;

-- Azubi: Freigabe des eigenen Berichts lesen
CREATE POLICY "Azubi liest Freigabe eigener Berichte"
  ON report_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM weekly_reports wr
      WHERE wr.id = report_approvals.report_id
        AND wr.profile_id = auth.uid()
    )
  );

-- Ausbilder: alle Freigaben lesen
CREATE POLICY "Ausbilder liest alle Freigaben"
  ON report_approvals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer')
  );

-- Ausbilder: Freigabe erstellen
CREATE POLICY "Ausbilder erstellt Freigabe"
  ON report_approvals FOR INSERT
  WITH CHECK (
    trainer_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer')
  );


-- =============================================================
-- 10. RLS POLICIES – report_status_history
-- =============================================================

DROP POLICY IF EXISTS "Azubi liest Status-History eigener Berichte" ON report_status_history;
DROP POLICY IF EXISTS "Ausbilder liest alle Status-Histories"        ON report_status_history;
DROP POLICY IF EXISTS "Nutzer trägt Status-Änderung ein"             ON report_status_history;

CREATE POLICY "Azubi liest Status-History eigener Berichte"
  ON report_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM weekly_reports wr
      WHERE wr.id = report_status_history.report_id
        AND wr.profile_id = auth.uid()
    )
  );

CREATE POLICY "Ausbilder liest alle Status-Histories"
  ON report_status_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer')
  );

CREATE POLICY "Nutzer trägt Status-Änderung ein"
  ON report_status_history FOR INSERT
  WITH CHECK (changed_by = auth.uid());


-- =============================================================
-- 11. RLS POLICIES – push_subscriptions
-- =============================================================

DROP POLICY IF EXISTS "Nutzer verwaltet eigene Push-Subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Service liest alle Push-Subscriptions"       ON push_subscriptions;

-- Nutzer: eigene Subscriptions lesen, erstellen, aktualisieren, löschen
CREATE POLICY "Nutzer verwaltet eigene Push-Subscriptions"
  ON push_subscriptions FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Service Role: alle Subscriptions lesen (für den Cron-Job / Scheduler)
CREATE POLICY "Service liest alle Push-Subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.role() = 'service_role');


-- =============================================================
-- 12. WEEKLY_REPORTS – neue RLS Policies für Ausbilder
--     (Ausbilder muss Berichte der Azubis lesen/aktualisieren können)
-- =============================================================

-- Nur hinzufügen wenn noch nicht vorhanden
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'weekly_reports'
      AND policyname = 'Ausbilder kann alle Berichte lesen'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Ausbilder kann alle Berichte lesen"
        ON weekly_reports FOR SELECT
        USING (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer')
        );
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'weekly_reports'
      AND policyname = 'Ausbilder kann Status aktualisieren'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Ausbilder kann Status aktualisieren"
        ON weekly_reports FOR UPDATE
        USING (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer')
        );
    $policy$;
  END IF;
END $$;


-- =============================================================
-- 13. DAILY_ENTRIES – Ausbilder-Leserecht
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_entries'
      AND policyname = 'Ausbilder kann alle Einträge lesen'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Ausbilder kann alle Einträge lesen"
        ON daily_entries FOR SELECT
        USING (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer')
        );
    $policy$;
  END IF;
END $$;


-- =============================================================
-- 14. STORAGE – PDF-Bucket Policies aktualisieren
-- =============================================================

-- Ausbilder darf alle PDFs lesen (für die Freigabe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename  = 'objects'
      AND schemaname = 'storage'
      AND policyname = 'Ausbilder kann alle PDFs lesen'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Ausbilder kann alle PDFs lesen"
        ON storage.objects FOR SELECT
        USING (
          bucket_id = 'berichtsheft-pdfs'
          AND EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer'
          )
        );
    $policy$;
  END IF;
END $$;


COMMIT;

-- =============================================================
-- FERTIG
-- Neue Tabellen: report_comments, report_approvals,
--                report_status_history, push_subscriptions
-- Geänderte Tabellen: profiles (+ role),
--                     weekly_reports (+ submitted_at, neuer Status-Constraint)
-- Status-Mapping: completed → submitted | exported → approved
-- =============================================================
