# EcoZone Waste Management Platform

Smart waste management system using IoT sensors and data-driven routing to optimize collection operations.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Supabase (PostgreSQL + PostGIS), Supabase Auth
- **Maps**: React-Leaflet with OpenStreetMap
- **State**: TanStack Query, Zustand

## Project Structure

```
├── apps/
│   ├── admin-web/       # Admin dashboard (Next.js)
│   ├── driver-app/      # Driver PWA (planned)
│   └── customer-web/    # Customer PWA (planned)
├── packages/
│   ├── types/           # Shared TypeScript types
│   └── ui/              # Shared UI components
└── supabase/
    └── migrations/      # Database migrations
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- Docker (for local Supabase)
- Supabase CLI

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start local Supabase:
   ```bash
   supabase start
   ```

3. Copy environment variables:
   ```bash
   cp apps/admin-web/.env.example apps/admin-web/.env.local
   ```
   Update with your Supabase URL and keys from `supabase status`.

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Database

Run migrations:
```bash
supabase db reset
```

Generate TypeScript types:
```bash
pnpm db:gen-types
```

## Features

### Admin Dashboard
- Live map view with color-coded bin markers (Green/Yellow/Red by fill level)
- Bin management (CRUD)
- Route generation and assignment
- Analytics dashboard
- Issue tracking

### Driver App (Planned)
- View assigned routes
- Mark bins as collected
- Navigation integration

### Customer App (Planned)
- Find nearby bins
- Report issues (overflow, damage)

## License

MIT
