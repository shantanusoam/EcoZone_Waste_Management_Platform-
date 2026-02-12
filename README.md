# EcoZone - Smart Waste Management Platform

A comprehensive IoT-enabled waste management system using real-time data and route optimization to improve collection efficiency and citizen engagement.

## 🌍 Overview

EcoZone is a three-tier waste management platform connecting admins, drivers, and citizens:

- **Admin Dashboard** (Port 3000): Monitor bins, view analytics, manage routes, and handle reported issues
- **Driver App** (Port 3001): Mobile PWA for drivers to track assigned routes and mark collections
- **Customer PWA** (Port 3002): Citizens can find nearby bins, report issues, and get collection updates

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI, React-Leaflet, Recharts
- **Backend**: Supabase (PostgreSQL + PostGIS), Auth, Edge Functions
- **State**: TanStack Query, Zustand
- **Maps**: Leaflet, Google Maps API
- **Monorepo**: pnpm workspaces, Turborepo

### Project Structure up

```
.
├── apps/
│   ├── admin-web/     (Port 3000) - Admin dashboard
│   ├── driver-app/    (Port 3001) - Driver PWA
│   └── customer-web/  (Port 3002) - Customer PWA
├── packages/
│   ├── types/         - Shared TypeScript types
│   └── ui/            - Shared utilities (cn function)
├── supabase/
│   └── migrations/    - Database migrations
├── scripts/
│   └── simulate-sensors.ts - IoT sensor simulator
└── pnpm-workspace.yaml, turbo.json, etc.
```

## 📦 Database Schema

### Core Tables

- **profiles**: User accounts and roles (admin, driver, citizen)
- **bins**: Waste bins with location (PostGIS), fill level, waste type, battery level
- **sensor_readings**: Historical fill level and battery data from IoT sensors
- **routes**: Driver routes with assigned stops and schedule
- **pickups**: Individual bin collections with fill level at time of pickup
- **issues**: Citizen-reported problems (overflow, damage, missed collection)

### Key Features

- **PostGIS Integration**: Spatial queries for nearest bin search and route optimization
- **Real-time Updates**: Supabase Realtime subscriptions for live bin status
- **Row-Level Security**: RLS policies for role-based access control
- **Storage Buckets**: Photos for issue reports

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker (for Supabase)
- pnpm 9+

### Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start Supabase locally**
   ```bash
   docker compose up -d
   pnpm exec supabase start
   ```

3. **Set environment variables**
   
   For each app (admin-web, driver-app, customer-web), create `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase>
   ```

4. **Start dev servers** (using pm2)
   ```bash
   pm2 start "pnpm --filter @ecozone/admin-web dev" --name admin
   pm2 start "pnpm --filter @ecozone/driver-app dev" --name driver
   pm2 start "pnpm --filter @ecozone/customer-web dev" --name customer
   ```

   Access:
   - Admin: http://localhost:3000
   - Driver: http://localhost:3001
   - Customer: http://localhost:3002

## 🎯 Complete Features

### Admin Dashboard
- Live map view with color-coded bin markers (Green/Yellow/Red by fill level)
- Bin management (CRUD) with search/filter
- Route management and generation with greedy nearest-neighbor algorithm
- Analytics dashboard (Recharts): avg fill at pickup, fill distribution, bins by status
- Issue tracking and resolution
- Dark mode support
- Real-time updates via Supabase

### Driver App
- View assigned collection routes
- Navigate to bins via Google Maps
- Mark collections with optional photos
- Offline-capable mobile PWA

### Customer PWA
- Find nearby bins using geolocation
- Filter by waste type (general, recycling, organic, hazardous)
- Toggle between map and list views
- Report issues with photo upload

## 📊 Analytics Dashboard

The analytics page (`/dashboard/analytics`) provides:

- **Average Fill at Pickup**: Efficiency metric showing when collections occur
- **Fill Level Distribution**: Bar chart showing bins by capacity (0-33%, 33-66%, 66-100%)
- **Bin Status Distribution**: Pie chart of active/inactive/maintenance bins
- **Recent Pickups**: Line chart of last 30 collections

## 🗺️ Route Optimization

The route generator uses a **greedy nearest-neighbor algorithm**:

1. Select bins with fill level ≥ 80%
2. Start from depot (coordinates 0, 0)
3. Repeatedly visit the nearest unvisited bin
4. Calculate distances using Haversine formula
5. Output ordered route with lat/lng for each stop

Available at: `/dashboard/routes` in admin dashboard

## 🔒 Security

### RLS Policies

- **bins**: Authenticated users read; admins modify
- **issues**: Anonymous citizens create; admins read/update
- **routes**: Drivers view assigned; admins manage
- **sensor_readings**: Auto-insert via telemetry
- **storage.objects**: Public photos in `issue-photos`

## 📱 PWA Support

Both driver and customer apps are configured as installable PWAs:

- Standalone display mode
- Custom icons (192x512px)
- Maskable icons for adaptive display
- Service workers for offline support
- Theme colors (#10b981 - green)

## 🧪 Testing

### Sensor Simulation

Generate test data with incremental fill updates:

```bash
node scripts/simulate-sensors.ts
```

This creates realistic sensor readings for testing collection workflows.

## 📚 API Reference

### Telemetry Endpoint

**POST** `/api/telemetry`

```bash
curl -X POST http://localhost:3000/api/telemetry \
  -H "X-API-Key: YOUR_SENSOR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sensor_id":"s1","fill_level":75,"battery":95}'
```

### RPC Functions

#### `get_nearby_bins(lat, lng, max_distance, limit)`

Find bins within distance using PostGIS:

```sql
SELECT * FROM get_nearby_bins(40.7128, -74.0060, 5000, 20);
```

## 🚢 Deployment

### Vercel (Frontend)

1. Push to GitHub
2. Create Vercel projects for each app
3. Set environment variables
4. Deploy with continuous integration

### Supabase (Backend)

1. Create project on supabase.com
2. Run migrations: `supabase db push`
3. Configure storage buckets
4. Set up Auth providers

## 📄 License

MIT
