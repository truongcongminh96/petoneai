# PetOne AI

PetOne AI is a desktop inventory and sales management app for small pet shops and veterinary businesses.

The app is built with Tauri, React, TypeScript, and Supabase Postgres. The desktop app connects to a cloud Supabase database so inventory data can be shared across devices later.

## Features

- Dashboard with high-level business metrics.
- Product inventory management.
- Add, edit, and delete products.
- Export product data to `.xlsx`.
- Local SQLite persistence.
- Navigation placeholders for sales, expenses, and settings.

## Tech Stack

- Desktop runtime: Tauri v2, Rust
- Frontend: React, TypeScript, Vite
- Styling: Tailwind CSS, shadcn-style UI components, Base UI primitives
- Database: Supabase Postgres
- Icons: Lucide React
- Spreadsheet export: SheetJS (`xlsx`)

## Requirements

- Node.js 20 or newer
- pnpm
- Rust toolchain with Cargo
- macOS build tools, if developing on macOS

Install Rust:

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

Install macOS command line tools, if needed:

```sh
xcode-select --install
```

## Getting Started

Install dependencies:

```sh
pnpm install
```

Create a Supabase project, then run the SQL in:

```text
supabase/schema.sql
```

Create `.env.local` from `.env.example`:

```sh
cp .env.example .env.local
```

Fill in the values from Supabase Project Settings > API:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Run the Tauri desktop app in development mode:

```sh
pnpm tauri dev
```

Run only the Vite frontend dev server:

```sh
pnpm dev
```

Build the frontend:

```sh
pnpm build
```

Build the desktop app:

```sh
pnpm tauri build
```

## Available Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Starts the Vite dev server on port `1420`. |
| `pnpm build` | Type-checks the frontend and creates a production Vite build. |
| `pnpm preview` | Serves the production frontend build locally. |
| `pnpm tauri dev` | Starts the full Tauri desktop app in development mode. |
| `pnpm tauri build` | Builds the distributable desktop app. |

## Database

The cloud schema lives in:

- `supabase/schema.sql`

The Supabase client lives in:

- `src/db/supabase.ts`

The current MVP connects directly from the Tauri frontend to Supabase using the anon key. Before distributing to real customers, add authentication, shop ownership, and Row Level Security policies so each shop can only access its own data.

## Project Structure

```text
src/
  app/                 App shell and main layout
  components/ui/       Reusable UI components
  db/                  Drizzle schema, SQLite adapter, and migrations
  features/dashboard/  Dashboard screen
  features/products/   Product inventory screen
  lib/                 Shared utilities

src-tauri/
  src/                 Rust entrypoint and Tauri setup
  Cargo.toml           Rust package configuration
  tauri.conf.json      Tauri app configuration
```

## Troubleshooting

If `pnpm tauri dev` fails with `cargo metadata` or `cargo: command not found`, Rust is not installed or Cargo is not available in the current shell:

```sh
source "$HOME/.cargo/env"
cargo --version
```

If the UI appears unstyled, make sure Tailwind is scanning the app files in `tailwind.config.js` and that `src/index.css` is imported by `src/main.tsx`.

## License

Private project.
