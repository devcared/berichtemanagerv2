-- 1. Tabellen anlegen

-- Ersetze eventuelle Namenskonflikte (optional, je nachdem ob die Tabelle schon existiert)
-- DROP TABLE IF EXISTS daily_entries, weekly_reports, activity_templates, profiles CASCADE;

-- Tabelle: profiles (verknüpft mit Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  occupation TEXT NOT NULL,
  company_name TEXT NOT NULL,
  trainer_name TEXT NOT NULL,
  department TEXT,
  training_start DATE NOT NULL,
  training_end DATE NOT NULL,
  current_year INTEGER NOT NULL DEFAULT 1,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly')),
  weekly_hours NUMERIC NOT NULL DEFAULT 40,
  school_days INTEGER[] NOT NULL DEFAULT '{}',
  school_hours_per_day NUMERIC NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabelle: weekly_reports
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  calendar_week INTEGER NOT NULL,
  year INTEGER NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  training_year INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'completed', 'exported')) DEFAULT 'draft',
  total_hours NUMERIC NOT NULL DEFAULT 0,
  is_pdf_report BOOLEAN NOT NULL DEFAULT false,
  pdf_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exported_at TIMESTAMPTZ,
  -- Ein Profil kann pro Jahr und Kalenderwoche nur einen Report haben
  UNIQUE(profile_id, year, calendar_week)
);

-- Tabelle: daily_entries
CREATE TABLE daily_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES weekly_reports(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('company', 'vocationalSchool', 'interCompany', 'vacation', 'sick', 'holiday')),
  activities TEXT NOT NULL,
  school_content TEXT,
  hours NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabelle: activity_templates
CREATE TABLE activity_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('company', 'vocationalSchool', 'interCompany', 'vacation', 'sick', 'holiday')),
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 2. Row Level Security (RLS) aktivieren
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_templates ENABLE ROW LEVEL SECURITY;


-- 3. RLS Policies (Zugriffsrechte) definieren

-- Policies für profiles: Nutzer dürfen nur ihr eigenes Profil lesen und bearbeiten
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies für weekly_reports:
CREATE POLICY "Users can view their own reports"
  ON weekly_reports FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own reports"
  ON weekly_reports FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own reports"
  ON weekly_reports FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own reports"
  ON weekly_reports FOR DELETE USING (profile_id = auth.uid());

-- Policies für daily_entries:
-- Zugriff erfolgt über die Verbindungstabelle (weekly_reports) zum Benutzer
CREATE POLICY "Users can view their own entries"
  ON daily_entries FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weekly_reports
      WHERE weekly_reports.id = daily_entries.report_id
      AND weekly_reports.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own entries"
  ON daily_entries FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekly_reports
      WHERE weekly_reports.id = daily_entries.report_id
      AND weekly_reports.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own entries"
  ON daily_entries FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM weekly_reports
      WHERE weekly_reports.id = daily_entries.report_id
      AND weekly_reports.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own entries"
  ON daily_entries FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM weekly_reports
      WHERE weekly_reports.id = daily_entries.report_id
      AND weekly_reports.profile_id = auth.uid()
    )
  );

-- Policies für activity_templates:
CREATE POLICY "Users can view their own templates"
  ON activity_templates FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own templates"
  ON activity_templates FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own templates"
  ON activity_templates FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own templates"
  ON activity_templates FOR DELETE USING (profile_id = auth.uid());
