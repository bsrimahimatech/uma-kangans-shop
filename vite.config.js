# Uma Kangans and Fancy — Shop Website

A jewellery catalog site with WhatsApp/email checkout, backed by Supabase.

## What's inside
- `src/App.jsx` — the whole site: customer catalog + admin panel
- `src/supabaseClient.js` — connects to your Supabase `products` table
- Admin password: `uma1gram` (change this in `src/App.jsx`, look for `ADMIN_PASSWORD`)

## Run locally (optional, only if you want to preview before deploying)
```
npm install
npm run dev
```

## Deploy to Vercel
1. Push this folder to a GitHub repository
2. Go to vercel.com → **Add New Project** → import that GitHub repo
3. Vercel auto-detects Vite — just click **Deploy**
4. You'll get a live URL like `uma-kangans-shop.vercel.app`

## Notes
- Product photos are stored as embedded images in the database (simplest setup). If the catalog grows very large and feels slow, switching to Supabase Storage for photos is the next upgrade.
- Row Level Security (RLS) is currently OFF on the `products` table for simplicity. This means the API key (already in this code) could theoretically be used to read/write the table directly, not just through the site. Low risk for a small catalog, but worth locking down later with RLS policies if it matters to you.
