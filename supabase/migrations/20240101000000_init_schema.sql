-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create custom enum types
CREATE TYPE user_role AS ENUM ('admin', 'driver', 'customer');
CREATE TYPE waste_type AS ENUM ('general', 'recycling', 'organic', 'hazardous');
CREATE TYPE bin_status AS ENUM ('active', 'damaged', 'maintenance_required');
CREATE TYPE route_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE pickup_status AS ENUM ('pending', 'collected', 'skipped');
CREATE TYPE issue_type AS ENUM ('overflow', 'damage', 'missed');
CREATE TYPE issue_status AS ENUM ('open', 'resolved');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'customer',
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bins table (waste collection bins with sensors)
CREATE TABLE bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address TEXT NOT NULL,
    capacity_liters INTEGER NOT NULL DEFAULT 240 CHECK (capacity_liters > 0),
    waste_type waste_type NOT NULL DEFAULT 'general',
    status bin_status NOT NULL DEFAULT 'active',
    fill_level INTEGER NOT NULL DEFAULT 0 CHECK (fill_level >= 0 AND fill_level <= 100),
    battery_level INTEGER NOT NULL DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
    last_pickup TIMESTAMPTZ,
    predicted_full TIMESTAMPTZ,
    sensor_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create spatial index on bins location
CREATE INDEX bins_location_idx ON bins USING GIST (location);
CREATE INDEX bins_fill_level_idx ON bins (fill_level DESC);
CREATE INDEX bins_status_idx ON bins (status);

-- Sensor readings table (time-series data from IoT sensors)
CREATE TABLE sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    bin_id UUID NOT NULL REFERENCES bins(id) ON DELETE CASCADE,
    fill_level INTEGER NOT NULL CHECK (fill_level >= 0 AND fill_level <= 100),
    battery_level INTEGER NOT NULL CHECK (battery_level >= 0 AND battery_level <= 100),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX sensor_readings_bin_id_idx ON sensor_readings (bin_id);
CREATE INDEX sensor_readings_timestamp_idx ON sensor_readings (timestamp DESC);

-- Routes table (collection routes for drivers)
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status route_status NOT NULL DEFAULT 'pending',
    scheduled_date DATE NOT NULL,
    stops JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX routes_driver_id_idx ON routes (driver_id);
CREATE INDEX routes_status_idx ON routes (status);
CREATE INDEX routes_scheduled_date_idx ON routes (scheduled_date);

-- Pickups table (individual bin pickups within a route)
CREATE TABLE pickups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    bin_id UUID NOT NULL REFERENCES bins(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    status pickup_status NOT NULL DEFAULT 'pending',
    collected_at TIMESTAMPTZ,
    fill_level_at_pickup INTEGER CHECK (fill_level_at_pickup >= 0 AND fill_level_at_pickup <= 100),
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX pickups_route_id_idx ON pickups (route_id);
CREATE INDEX pickups_bin_id_idx ON pickups (bin_id);

-- Issues table (citizen reports)
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    bin_id UUID NOT NULL REFERENCES bins(id) ON DELETE CASCADE,
    type issue_type NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    status issue_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX issues_bin_id_idx ON issues (bin_id);
CREATE INDEX issues_status_idx ON issues (status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bins_updated_at BEFORE UPDATE ON bins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
