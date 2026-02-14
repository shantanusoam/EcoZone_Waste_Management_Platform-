-- Data retention: optional cleanup of old sensor_readings
-- Run periodically (e.g. via cron or Edge Function) to keep table size manageable.
-- Default: keep last 90 days of sensor_readings.

CREATE OR REPLACE FUNCTION delete_old_sensor_readings(days_to_keep integer DEFAULT 90)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count bigint;
  cutoff timestamptz;
BEGIN
  cutoff := now() - (days_to_keep || ' days')::interval;
  WITH deleted AS (
    DELETE FROM sensor_readings
    WHERE timestamp < cutoff
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;
  RETURN deleted_count;
END;
$$;

-- Grant execute to service role only (admin/cron)
-- Revoke from anon/authenticated so only backend can run it
COMMENT ON FUNCTION delete_old_sensor_readings(integer) IS
  'Deletes sensor_readings older than days_to_keep. Run periodically for data retention.';
