# Deployment Guide

This guide covers deploying the Inventory Manager app to Vercel or Netlify with proper environment variable configuration.

## Required Environment Variables

### Frontend (Build-time)

These are **public** variables embedded in the build - safe to expose:

| Variable | Description | Value |
|----------|-------------|-------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://zviyodwzhpucwguptekp.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Your anon key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | `zviyodwzhpucwguptekp` |

### Backend Secrets (Edge Functions)

These are **private** and managed in Lovable Cloud - NOT needed for frontend deployment:

| Secret | Description |
|--------|-------------|
| `RESEND_API_KEY` | Email service API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin access to Supabase |
| `LOVABLE_API_KEY` | AI capabilities |

> ⚠️ **Important**: Backend secrets remain in Lovable Cloud. Edge functions run on Supabase, not your deployment platform.

---

## Deploying to Vercel

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Select "Vite" as the framework preset

### 2. Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://zviyodwzhpucwguptekp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=zviyodwzhpucwguptekp
```

### 3. Build Settings

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`

### 4. Deploy

Click "Deploy" and Vercel will build and deploy your app.

---

## Deploying to Netlify

### 1. Connect Repository

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository

### 2. Configure Build Settings

- **Build command**: `npm run build`
- **Publish directory**: `dist`

### 3. Configure Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://zviyodwzhpucwguptekp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=zviyodwzhpucwguptekp
```

### 4. Create `netlify.toml` (Optional)

Add this file to your repository root for SPA routing:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## GitHub Actions CI/CD

### Required GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret:

| Secret Name | Value |
|-------------|-------|
| `VITE_SUPABASE_URL` | `https://zviyodwzhpucwguptekp.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | `zviyodwzhpucwguptekp` |

### Optional: Platform-Specific Secrets

**For Vercel deployment:**
| Secret Name | How to Get |
|-------------|------------|
| `VERCEL_TOKEN` | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after `vercel link` |

**For Netlify deployment:**
| Secret Name | How to Get |
|-------------|------------|
| `NETLIFY_AUTH_TOKEN` | Netlify → User Settings → Applications → Personal access tokens |
| `NETLIFY_SITE_ID` | Netlify → Site Settings → General → Site ID |

---

## Architecture Notes

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Deployment                          │
│              (Vercel / Netlify / etc.)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Static Frontend (Vite)                  │   │
│  │                                                      │   │
│  │  Environment Variables:                              │   │
│  │  • VITE_SUPABASE_URL                                │   │
│  │  • VITE_SUPABASE_PUBLISHABLE_KEY                    │   │
│  │  • VITE_SUPABASE_PROJECT_ID                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Lovable Cloud                           │
│                (Supabase Backend)                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Database (PostgreSQL)                            │   │
│  │  • Authentication                                    │   │
│  │  • Edge Functions (with private secrets)            │   │
│  │  • File Storage                                      │   │
│  │                                                      │   │
│  │  Secrets (NOT in your deployment):                  │   │
│  │  • RESEND_API_KEY                                   │   │
│  │  • SUPABASE_SERVICE_ROLE_KEY                        │   │
│  │  • LOVABLE_API_KEY                                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

The frontend is static and can be deployed anywhere. All backend logic runs on Lovable Cloud (Supabase), so you don't need to migrate backend secrets to your hosting platform.

---

## Troubleshooting

### Build Fails with Missing Environment Variables

Ensure all `VITE_*` variables are set in your deployment platform's environment settings.

### API Calls Fail After Deployment

1. Check browser console for CORS errors
2. Verify the Supabase URL and keys are correct
3. Ensure your deployment domain is allowed in Supabase (usually automatic)

### SPA Routing Returns 404

Add redirect rules to serve `index.html` for all routes:
- **Vercel**: Automatic for Vite projects
- **Netlify**: Add `netlify.toml` with redirects (see above)
