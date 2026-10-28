# Deploying Yushe Bites

Four pieces: **MongoDB Atlas** (database) → **Render** (server) → **Netlify/Vercel** (admin dashboard) and **Netlify/Vercel** (customer ordering app).

## 1. Database: MongoDB Atlas
1. Create a free cluster at mongodb.com/atlas.
2. Database Access → add a database user (save the password).
3. Network Access → allow `0.0.0.0/0` (Render's addresses change).
4. Connect → Drivers → copy the connection string, e.g.
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/yushebites`

## 2. Server: Render
New → Web Service → connect this GitHub repo.

| Setting | Value |
|---|---|
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `node index.js` |
| Health Check Path | `/api/health` |

Environment variables:
- `MONGO_URI` = your Atlas string
- `JWT_SECRET` = a long random text
- `CLIENT_ORIGINS` = *(fill in at step 5)*

You get an address like `https://yushebites-api.onrender.com`.
Free services sleep after 15 minutes idle; the next request takes ~1 minute.

## 3. Admin dashboard: Netlify (or Vercel)
Import this repo.

| Setting | Value |
|---|---|
| Base / Root directory | `frontend` |
| Build command | `npm run build` |
| Publish / Output directory | `dist` |
| Environment variable | `VITE_API_URL` = your Render address |

`public/_redirects` (Netlify) and `vercel.json` (Vercel) are already included so page refresh works.

## 4. Customer ordering app: Netlify (or Vercel)
Create a second site from the same repo.

| Setting | Value |
|---|---|
| Base / Root directory | `app` |
| Build command | *(none)* |
| Publish / Output directory | `app` (Vercel: leave default) |

Before deploying, open `app/config.js` and set `API_URL` to your Render address, then commit.

## 5. Lock down the server
In Render, set `CLIENT_ORIGINS` to both site addresses, comma-separated, no trailing slash:

`https://your-admin.netlify.app,https://your-order.netlify.app`

Save; Render redeploys.

## 6. Test
1. Open the admin site, log in as admin, open **Orders**.
2. Open the customer site on your phone, place an order.
3. The order should appear on the dashboard instantly.

## Local development
- Server: `cd server && npm install && npm start` (needs `server/.env`, see `server/.env.example`)
- Admin: `cd frontend && npm install && npm run dev`
- Customer: open `app/index.html`

## Troubleshooting
- **Customer app says "Could not send order"**: wrong `API_URL` in `app/config.js`, server asleep (wait a minute and retry), or `CLIENT_ORIGINS` missing that site.
- **Admin login fails / CORS error in browser console**: `VITE_API_URL` wrong, or `CLIENT_ORIGINS` doesn't exactly match the site address.
- **Orders don't update live**: not logged in as admin, or token expired; log in again.
- Never commit `.env` files (already in `.gitignore`).
