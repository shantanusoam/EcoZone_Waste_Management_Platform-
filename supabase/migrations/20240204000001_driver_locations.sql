-- Driver location tracking for active routes (GPS updates from driver app)
-- One row per driver per route; updated on each location ping
CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (driver_id, route_id)
);

CREATE INDEX driver_locations_route_id_idx ON driver_locations (route_id);
CREATE INDEX driver_locations_updated_at_idx ON driver_locations (updated_at DESC);

-- RLS: drivers can insert/update own location; admins can read all
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can insert own location"
  ON driver_locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update own location"
  ON driver_locations FOR UPDATE
  TO authenticated
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Admins can read all driver locations"
  ON driver_locations FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Drivers can read own location"
  ON driver_locations FOR SELECT
  TO authenticated
  USING (auth.uid() = driver_id);
