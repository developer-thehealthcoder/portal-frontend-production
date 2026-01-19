# Sandbox vs Production Login Issue - Root Cause Analysis

## The Problem
- **Sandbox**: Login works ✅
- **Production**: Login fails with 404 on `/auth/user-exists` ❌
- Both are exact copies of the same codebase
- Both use the same backend URL

## Most Likely Causes (Ranked by Probability)

### 1. **Environment Variable Not Set During Build** (90% Likely)

**Issue:** `NEXT_PUBLIC_API_URL` is `undefined` in the production build.

**Why this happens:**
- Next.js embeds `NEXT_PUBLIC_*` variables **at build time** into the static JavaScript files
- If the variable isn't available during build, it becomes `undefined` in the code
- When `baseURL` is `undefined`, axios makes requests relative to the current page URL
- So `/auth/user-exists` becomes `https://production-site.azurestaticapps.net/auth/user-exists` (404)

**How to check:**
1. Open production site in browser
2. Open DevTools → Console
3. Type: `console.log(process.env.NEXT_PUBLIC_API_URL)`
4. If it shows `undefined`, this is the issue

**Why sandbox works:**
- Sandbox might have the environment variable set in Azure Portal → Configuration
- Or sandbox workflow might be building differently
- Or sandbox was set up manually with proper build steps

**Fix:**
- Ensure `NEXT_PUBLIC_API_URL` is set in GitHub Secrets for production repo
- Update workflow to build manually with the environment variable (see below)

---

### 2. **GitHub Secret Missing or Different** (80% Likely)

**Issue:** Production repo doesn't have `NEXT_PUBLIC_API_URL` secret, or it's set to wrong value.

**How to check:**
1. Go to Production Repo → Settings → Secrets and variables → Actions
2. Check if `NEXT_PUBLIC_API_URL` exists
3. Compare its value with sandbox repo's secret

**Fix:**
- Add/update the secret to match sandbox backend URL

---

### 3. **Azure Static Web Apps Build Process Difference** (70% Likely)

**Issue:** Azure's auto-build might not be passing environment variables correctly.

**Current workflow problem:**
```yaml
- name: Build And Deploy
  uses: Azure/static-web-apps-deploy@v1
  with:
    output_location: ".next"  # Wrong for static export
  env:
    NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}  # Might not be used by Azure's build
```

**Why sandbox works:**
- Sandbox might have been set up with Azure Portal configuration
- Or sandbox has environment variables set in Azure Portal → Configuration → Application settings

**Fix:**
- Build manually before deploying (see workflow fix below)
- OR set environment variable in Azure Portal → Configuration

---

### 4. **Next.js Config Difference** (60% Likely)

**Issue:** `output: "standalone"` is for server-side rendering, not static hosting.

**Current config:**
```javascript
output: "standalone"  // Wrong for Azure Static Web Apps
```

**Why sandbox might work:**
- Sandbox might have been deployed before this config was added
- Or sandbox has different `next.config.mjs`
- Or Azure is handling it differently for sandbox

**Fix:**
- Change to `output: "export"` for static hosting

---

### 5. **CORS Configuration** (30% Likely)

**Issue:** Backend might not allow requests from production frontend domain.

**How to check:**
- Look for CORS errors in browser console
- Check backend CORS configuration

**Fix:**
- Add production frontend URL to backend CORS allowed origins

---

### 6. **Build Output Location Mismatch** (50% Likely)

**Issue:** Workflow says `output_location: ".next"` but static export creates `out` folder.

**Why sandbox works:**
- Sandbox might have different `output_location` setting
- Or sandbox workflow was updated differently

**Fix:**
- Change `output_location` to `"out"` if using `output: "export"`

---

## Diagnostic Steps

### Step 1: Check Environment Variable in Production Build

1. Open production site
2. Open DevTools → Console
3. Run: `console.log(process.env.NEXT_PUBLIC_API_URL)`
4. **Expected:** Should show the backend URL
5. **If undefined:** Environment variable wasn't set during build

### Step 2: Check Network Tab

1. Open production site
2. Open DevTools → Network tab
3. Try to login
4. Check the `/auth/user-exists` request
5. Look at the **full URL** in the request
6. **If it's relative** (starts with `/`): `baseURL` is undefined
7. **If it's wrong domain**: Environment variable is set to wrong value

### Step 3: Compare GitHub Secrets

**Sandbox Repo:**
- Settings → Secrets → `NEXT_PUBLIC_API_URL` = ?

**Production Repo:**
- Settings → Secrets → `NEXT_PUBLIC_API_URL` = ?

**They should match!**

### Step 4: Check Azure Portal Configuration

**Sandbox Azure Static Web App:**
- Configuration → Application settings → `NEXT_PUBLIC_API_URL` = ?

**Production Azure Static Web App:**
- Configuration → Application settings → `NEXT_PUBLIC_API_URL` = ?

**Note:** Azure Portal settings override GitHub secrets for runtime, but build-time variables need to be in GitHub secrets.

---

## Most Likely Root Cause

**90% probability:** The `NEXT_PUBLIC_API_URL` environment variable is not being set during the build process in production, making it `undefined` in the static JavaScript files.

**Why sandbox works:**
- Sandbox might have been set up with Azure Portal configuration
- Or sandbox workflow builds differently
- Or sandbox has the secret properly configured

**Why production fails:**
- Production workflow relies on Azure's auto-build
- Azure's auto-build might not be using the `env` section properly
- Or the GitHub secret is missing/different

---

## Complete Fix

### 1. Update Production Workflow

Replace the workflow with manual build:

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          submodules: true
          lfs: false
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Build Next.js app
        run: yarn build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
      
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          api_location: ""
          output_location: "out"  # For static export
          skip_app_build: true  # We build manually

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
```

### 2. Update `next.config.mjs` in Production Repo

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",  // Change from "standalone"
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
```

### 3. Verify GitHub Secret

- Production Repo → Settings → Secrets → `NEXT_PUBLIC_API_URL`
- Should match sandbox backend URL exactly

---

## Quick Test

After fixing, verify:

1. **Build logs:** Check GitHub Actions logs to see if `NEXT_PUBLIC_API_URL` is being used
2. **Browser console:** `console.log(process.env.NEXT_PUBLIC_API_URL)` should show the URL
3. **Network tab:** API calls should go to the correct backend domain
4. **Login:** Should work without 404 errors
