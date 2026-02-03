-- Seed data for development and testing
-- Insert sample bins (using San Francisco coordinates)
INSERT INTO bins (location, address, capacity_liters, waste_type, status, fill_level, battery_level, sensor_id) VALUES
    (ST_Point(-122.4194, 37.7749)::geography, '123 Market St, San Francisco, CA', 240, 'general', 'active', 75, 85, 'SENSOR-001'),
    (ST_Point(-122.4184, 37.7759)::geography, '456 Mission St, San Francisco, CA', 240, 'recycling', 'active', 45, 92, 'SENSOR-002'),
    (ST_Point(-122.4174, 37.7769)::geography, '789 Howard St, San Francisco, CA', 360, 'general', 'active', 90, 78, 'SENSOR-003'),
    (ST_Point(-122.4164, 37.7739)::geography, '321 Folsom St, San Francisco, CA', 240, 'organic', 'active', 30, 95, 'SENSOR-004'),
    (ST_Point(-122.4204, 37.7729)::geography, '654 Harrison St, San Francisco, CA', 240, 'general', 'active', 85, 88, 'SENSOR-005'),
    (ST_Point(-122.4004, 37.7899)::geography, '100 California St, San Francisco, CA', 240, 'recycling', 'active', 60, 90, 'SENSOR-006'),
    (ST_Point(-122.4014, 37.7889)::geography, '200 Pine St, San Francisco, CA', 240, 'general', 'active', 25, 99, 'SENSOR-007'),
    (ST_Point(-122.4024, 37.7879)::geography, '300 Bush St, San Francisco, CA', 360, 'general', 'active', 95, 75, 'SENSOR-008'),
    (ST_Point(-122.4034, 37.7869)::geography, '400 Sutter St, San Francisco, CA', 240, 'recycling', 'active', 55, 82, 'SENSOR-009'),
    (ST_Point(-122.4044, 37.7859)::geography, '500 Post St, San Francisco, CA', 240, 'hazardous', 'active', 40, 91, 'SENSOR-010'),
    (ST_Point(-122.4094, 37.8049)::geography, '600 Columbus Ave, San Francisco, CA', 240, 'general', 'active', 70, 87, 'SENSOR-011'),
    (ST_Point(-122.4084, 37.8039)::geography, '700 Grant Ave, San Francisco, CA', 240, 'organic', 'active', 15, 96, 'SENSOR-012'),
    (ST_Point(-122.4054, 37.7849)::geography, '800 Geary St, San Francisco, CA', 240, 'general', 'damaged', 50, 65, 'SENSOR-013'),
    (ST_Point(-122.4064, 37.7839)::geography, '900 Larkin St, San Francisco, CA', 240, 'recycling', 'maintenance_required', 35, 20, 'SENSOR-014'),
    (ST_Point(-122.4074, 37.7829)::geography, '1000 Hyde St, San Francisco, CA', 360, 'general', 'active', 82, 80, 'SENSOR-015');
