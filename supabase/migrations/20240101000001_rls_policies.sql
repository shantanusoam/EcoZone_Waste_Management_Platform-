-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (get_user_role() = 'admin');

-- BINS POLICIES
CREATE POLICY "Anyone can view active bins" ON bins FOR SELECT USING (status = 'active' OR get_user_role() IN ('admin', 'driver'));
CREATE POLICY "Admins can insert bins" ON bins FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Admins can update bins" ON bins FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "Drivers can update bin fill level" ON bins FOR UPDATE USING (get_user_role() = 'driver');
CREATE POLICY "Admins can delete bins" ON bins FOR DELETE USING (get_user_role() = 'admin');

-- SENSOR_READINGS POLICIES
CREATE POLICY "Admins can view sensor readings" ON sensor_readings FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Service role can insert readings" ON sensor_readings FOR INSERT WITH CHECK (true);

-- ROUTES POLICIES
CREATE POLICY "Admins can view all routes" ON routes FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Drivers can view own routes" ON routes FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Admins can insert routes" ON routes FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Admins can update routes" ON routes FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "Drivers can update own route" ON routes FOR UPDATE USING (auth.uid() = driver_id);

-- PICKUPS POLICIES
CREATE POLICY "Admins can view all pickups" ON pickups FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Drivers can view own pickups" ON pickups FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Admins can insert pickups" ON pickups FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Drivers can update own pickups" ON pickups FOR UPDATE USING (auth.uid() = driver_id);

-- ISSUES POLICIES
CREATE POLICY "Admins can view all issues" ON issues FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Users can view own issues" ON issues FOR SELECT USING (auth.uid() = reported_by);
CREATE POLICY "Authenticated users can create issues" ON issues FOR INSERT WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Admins can update issues" ON issues FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "Users can update own open issues" ON issues FOR UPDATE USING (auth.uid() = reported_by AND status = 'open');
