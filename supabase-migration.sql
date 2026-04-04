-- ============================================================
-- USM Registration: Events Table Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create the events table
CREATE TABLE IF NOT EXISTS events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT 'Unending Spirit Meeting',
  date date NOT NULL,
  time text NOT NULL DEFAULT '10:00 AM',
  theme text NOT NULL,
  venue text NOT NULL,
  venue_address text,
  map_query text,
  description text,
  flyer_url text,
  is_active boolean DEFAULT false,
  is_registration_open boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Add event_id to attendance_logs
ALTER TABLE attendance_logs
ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id);

-- 3. Create the March 2026 event (past event)
INSERT INTO events (title, date, time, theme, venue, venue_address, map_query, description, flyer_url, is_active, is_registration_open)
VALUES (
  'Unending Spirit Meeting',
  '2026-03-28',
  '10:00 AM',
  'The Gift of Healing',
  '3rd floor ORA black star building, Opposite Ofankor Shell filling station',
  'Ofankor, Accra',
  'Chatime+Ghana+Ofankor',
  'We know you waited. We know you anticipated. Well, now it''s here again. The Unending Spirit meeting returns. Get ready🔥',
  '/USM.jpeg',
  false,
  false
);

-- 4. Backfill ALL existing registrations with the March event ID
UPDATE attendance_logs
SET event_id = (SELECT id FROM events WHERE date = '2026-03-28' LIMIT 1)
WHERE event_id IS NULL;

-- 5. Create the April 2026 event (upcoming, active)
INSERT INTO events (title, date, time, theme, venue, venue_address, map_query, description, flyer_url, is_active, is_registration_open)
VALUES (
  'Unending Spirit Meeting',
  '2026-04-25',
  '10:00 AM',
  'TBD — Update from Admin Panel',
  '3rd floor ORA black star building, Opposite Ofankor Shell filling station',
  'Ofankor, Accra',
  'Chatime+Ghana+Ofankor',
  'The Unending Spirit meeting returns. Get ready🔥',
  '/USM.jpeg',
  true,
  true
);

-- 6. RLS Policies for events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Public can read events (needed for the registration page)
CREATE POLICY "Anyone can read events"
  ON events FOR SELECT
  USING (true);

-- Authenticated users (admins) can manage events
CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (true);

-- 7. Ensure attendance_logs RLS allows reading event_id
-- (existing policies should already cover this since event_id is just a column)

-- ============================================================
-- DONE! Verify by running:
-- SELECT * FROM events;
-- SELECT id, full_name, event_id FROM attendance_logs LIMIT 5;
-- ============================================================
