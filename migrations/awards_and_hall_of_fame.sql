-- =============================================================
-- Hekayaty Awards & Hall of Fame Migration
-- Run this in your Supabase SQL Editor
-- =============================================================

-- Table 1: Annual Awards Events
CREATE TABLE IF NOT EXISTS hekayaty_awards (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT 'جوائز حكايتي',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published
  created_by UUID NOT NULL REFERENCES users(id),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Award Winners per Category per Year
CREATE TABLE IF NOT EXISTS hekayaty_award_winners (
  id SERIAL PRIMARY KEY,
  award_id INTEGER NOT NULL REFERENCES hekayaty_awards(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'best_novel', 'best_writer', 'best_publisher'
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 10),
  winner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  winner_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  special_note TEXT,
  badge_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(award_id, category, rank)
);

-- Table 3: Permanent Hall of Fame Writers
CREATE TABLE IF NOT EXISTS hall_of_fame_writers (
  id SERIAL PRIMARY KEY,
  writer_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  featured_reason TEXT,
  achievement_note TEXT,
  badge_label TEXT DEFAULT 'كاتب نخبة',
  display_order INTEGER DEFAULT 0,
  added_by UUID NOT NULL REFERENCES users(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================
-- Row Level Security
-- =============================================================

-- Awards table: public read, admin write
ALTER TABLE hekayaty_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "awards_public_read" ON hekayaty_awards
  FOR SELECT USING (true);

CREATE POLICY "awards_admin_all" ON hekayaty_awards
  FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Award winners table: public read, admin write
ALTER TABLE hekayaty_award_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "award_winners_public_read" ON hekayaty_award_winners
  FOR SELECT USING (true);

CREATE POLICY "award_winners_admin_all" ON hekayaty_award_winners
  FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Hall of fame table: public read, admin write
ALTER TABLE hall_of_fame_writers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hof_public_read" ON hall_of_fame_writers
  FOR SELECT USING (true);

CREATE POLICY "hof_admin_all" ON hall_of_fame_writers
  FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =============================================================
-- Indexes for performance
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_awards_year ON hekayaty_awards(year DESC);
CREATE INDEX IF NOT EXISTS idx_awards_status ON hekayaty_awards(status);
CREATE INDEX IF NOT EXISTS idx_award_winners_award_id ON hekayaty_award_winners(award_id);
CREATE INDEX IF NOT EXISTS idx_award_winners_category ON hekayaty_award_winners(category);
CREATE INDEX IF NOT EXISTS idx_hof_display_order ON hall_of_fame_writers(display_order ASC);
