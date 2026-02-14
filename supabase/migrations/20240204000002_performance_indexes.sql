-- Performance indexes for common query patterns

-- Routes: filter by driver and date/status (driver app, admin routes list)
CREATE INDEX IF NOT EXISTS routes_driver_date_status_idx
  ON routes (driver_id, scheduled_date DESC, status);

-- Issues: time-based queries (admin issues list, analytics)
CREATE INDEX IF NOT EXISTS issues_created_at_idx
  ON issues (created_at DESC);

-- Bins: predicted_full for route planning (optional)
CREATE INDEX IF NOT EXISTS bins_predicted_full_idx
  ON bins (predicted_full)
  WHERE predicted_full IS NOT NULL;

-- Pickups: route progress (driver app, admin)
CREATE INDEX IF NOT EXISTS pickups_route_order_idx
  ON pickups (route_id, order_index);
