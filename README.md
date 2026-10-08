# EcoTool Research Collector

A phone-first survey site for collecting environmental-news awareness, waste knowledge, and household-practice responses. Survey records are saved in Supabase, shown in a private admin dashboard, and downloadable as a flat CSV for Google Sheets.

## What is included

- Four short survey steps with English and Kinyarwanda labels, answer choices, and waste picture prompts.
- Anonymous participant codes so first and follow-up survey responses can be compared without collecting names or phone numbers.
- Admin sign-in, response summaries, matched knowledge-score comparison, barriers and news-source charts, and expandable individual records.
- Protected CSV export with one row per survey response.
- Vercel-ready Next.js project and Supabase SQL setup.

## Set up the database

1. Create a Supabase project.
2. Open its SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy the Project URL and a server-side secret key from the project API settings. Never use the secret key in browser code.

The response table has row-level security enabled and denies access to browser roles. The site sends validated submissions through its server routes; only the authenticated admin routes can read or export records.

## Run locally

1. Install Node.js 20.9 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and enter the Supabase Project URL and secret key.
4. Run `npm run dev` and open `http://localhost:3000`.

The example local admin credentials are:

- Email: `admin@ecotool.local`
- Password: `EcoTool-demo-2026!`

These are for local preview only. Production code rejects these example credentials.

## Deploy to Vercel

Create a Vercel project from this folder or connect its Git repository, then add these environment variables in the Vercel project settings:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `ADMIN_EMAIL` — choose the admin email address
- `ADMIN_PASSWORD` — choose a unique, strong password
- `SESSION_SECRET` — a separate random secret of at least 32 characters

Deploy after saving the variables. If a variable changes, redeploy so the deployment receives the new value. Do not commit `.env.local` or place the Supabase secret key in a `NEXT_PUBLIC_` variable.

The public survey does not collect participant names, phone numbers, or addresses. Each first survey shows a participant code; write it on a private card for the participant to use in the follow-up. Keep those cards separate from identifying information.

## CSV

The admin dashboard’s **Download CSV** button downloads every saved response. Array answers are kept in one cell separated by semicolons, and waste-item answers are stored as JSON in one cell. Google Sheets can import the file directly.

