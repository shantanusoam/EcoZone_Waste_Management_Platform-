-- RPC to fetch nearby bins using PostGIS distance calculation
create or replace function public.get_nearby_bins(
  user_lat double precision,
  user_lng double precision,
  max_distance integer default 5000,
  result_limit integer default 20
)
returns table (
  id uuid,
  address text,
  fill_level integer,
  waste_type text,
  status text,
  lat double precision,
  lng double precision,
  distance_meters double precision
)
language sql
stable
as $$
  select
    b.id,
    b.address,
    b.fill_level,
    b.waste_type,
    b.status,
    ST_Y(b.location::geometry) as lat,
    ST_X(b.location::geometry) as lng,
    ST_DistanceSphere(
      b.location::geometry,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)
    ) as distance_meters
  from bins b
  where b.status = 'active'
    and ST_DistanceSphere(
      b.location::geometry,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)
    ) <= max_distance
  order by distance_meters
  limit result_limit;
$$;

-- Grant execute to anon (for public customer-web)
grant execute on function public.get_nearby_bins(double precision, double precision, integer, integer) to anon, authenticated;