# Mortgage Payment Tracker

A simple mortgage payment tracker using Supabase as a backend, hosted on GitHub Pages. Built with TypeScript and Vite.

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Get your credentials:
   - **Project URL**: Go to **Project Settings > Data API** and copy the URL
   - **Publishable Key**: Go to **Project Settings > API Keys** and copy the Publishable key

### 2. Create the Database Table

In your Supabase dashboard, go to **SQL Editor** and run the contents of [schema.sql](schema.sql):

```sql
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  principal DECIMAL(12, 2),
  interest DECIMAL(12, 2),
  extra_payment DECIMAL(12, 2) DEFAULT 0,
  remaining_balance DECIMAL(12, 2),
  payment_number INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON payments
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_payments_date ON payments(payment_date DESC);
```

### 3. Deploy to GitHub Pages

1. Build the project: `npm run build`
2. Deploy the `dist` folder to GitHub Pages, or use GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 4. Configure the App

1. Open your deployed site
2. Enter your Supabase URL and Publishable key
3. Start tracking payments!

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── src/
│   ├── main.ts      # App entry point
│   ├── supabase.ts  # Supabase client and operations
│   ├── ui.ts        # UI helper functions
│   └── types.ts     # TypeScript types
├── index.html
├── styles.css
├── schema.sql       # Database schema
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Security Note

This demo uses a permissive RLS policy for simplicity. For production:

- Implement proper authentication
- Use restrictive RLS policies
- Never expose sensitive data via anon key
