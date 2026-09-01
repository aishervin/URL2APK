# Deploying Web2APK Pro to Cloudflare Pages

This project is fully structured for seamless deployment on **Cloudflare Pages** with **Cloudflare Pages Functions** (serverless backend endpoints supporting GitHub Actions dispatch and artifact downloading).

## Repository Structure for Cloudflare Pages

- `dist/` - Static frontend build output (Vite + React)
- `functions/api/` - Cloudflare Pages Serverless Functions (auto-routed by Cloudflare):
  - `health.ts` → `/api/health`
  - `build-apk.ts` → `/api/build-apk`
  - `build-status/[runId].ts` → `/api/build-status/:runId`
  - `download-artifact.ts` → `/api/download-artifact`
- `wrangler.toml` - Cloudflare Wrangler configuration file
- `public/_redirects` - SPA routing and API proxy rules

---

## Deployment Steps

### Method 1: Deploy via Cloudflare Dashboard (Recommended)
1. Push your repository to GitHub (`aishervin/URL2APK` or your fork).
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository.
4. Configure build settings:
   - **Framework preset**: `Vite` (or `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)
5. (Optional) Add Environment Variables in Cloudflare Pages settings:
   - `GITHUB_TOKEN`: Your GitHub Personal Access Token (with `repo` & `workflow` scopes)
   - `GITHUB_REPO`: `your-username/URL2APK`
6. Click **Save and Deploy**.

### Method 2: Deploy via Wrangler CLI
If you have Wrangler CLI installed and authenticated:
```bash
npm run build
npx wrangler pages deploy dist
```
