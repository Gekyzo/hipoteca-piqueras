# Supabase + GitHub Pages Demo

A simple demo showing how to use Supabase as a backend for a GitHub Pages static site. Built with TypeScript and Vite.

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Settings > API** and copy:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon` public key

### 2. Create the Database Table

In your Supabase dashboard, go to **SQL Editor** and run:

```sql
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users (for demo purposes)
CREATE POLICY "Allow all operations" ON items
  FOR ALL
  USING (true)
  WITH CHECK (true);
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
2. Enter your Supabase URL and anon key
3. Start adding items!

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
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Security Note

This demo uses a permissive RLS policy for simplicity. For production:

- Implement proper authentication
- Use restrictive RLS policies
- Never expose sensitive data via anon key
