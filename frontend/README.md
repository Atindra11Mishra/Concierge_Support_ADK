# Concierge Support ADK Frontend

Next.js demo UI for the Concierge Support ADK backend.

## Local Development

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

The app reads the backend URL from:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Open `http://localhost:3000`.

## Deployment

Deploy this `frontend/` directory to Vercel or Netlify.

Set:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.onrender.com
```

Then update the backend `ALLOWED_ORIGINS` environment variable with the deployed
frontend URL so browser requests are allowed.
