# Production Repository Setup Guide

This document outlines the steps to create a separate production repository from the current sandbox-only codebase.

## Overview

- **Current Repository (Sandbox)**: Hardcoded to use `sandbox` environment
- **Production Repository**: Will be hardcoded to use `production` environment
- Both repositories share the same codebase, but with different environment configurations

## Steps to Create Production Repository

### 1. Create New Repository

1. Create a new repository (e.g., `portal-frontend-production` or `medofficehq-frontend-production`)
2. Copy all files from the current sandbox repository

### 2. Required Code Changes for Production

After cloning the repository, make the following changes:

#### A. Update `lib/foundation-kit/axiosInstance.js`

**Current (Sandbox):**
```javascript
// Hardcoded to sandbox for sandbox portal
// For production portal, change this to "production"
const getEnvironment = () => {
  return "sandbox";
};
```

**Change to (Production):**
```javascript
// Hardcoded to production for production portal
const getEnvironment = () => {
  return "production";
};
```

#### B. Update `lib/foundation-kit/atoms.js`

**Current (Sandbox):**
```javascript
// Environment atom - hardcoded to sandbox for sandbox portal
// For production portal, change this to always return "production"
export const athenaEnvironmentAtom = atom("sandbox");
```

**Change to (Production):**
```javascript
// Environment atom - hardcoded to production for production portal
export const athenaEnvironmentAtom = atom("production");
```

#### C. Verify `app/(med-office-hq)/layout.js`

Ensure the `EnvironmentToggle` component is **NOT** imported or used (it should already be removed).

**Should be:**
```javascript
import { Separator } from "@/components/ui/separator";
// NO EnvironmentToggle import

export default function DashboardLayout({ children }) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              {/* ... */}
            </Breadcrumb>
            {/* NO EnvironmentToggle here */}
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
```

### 3. Azure Static Web App Configuration

#### Create New Azure Static Web App

1. Go to Azure Portal
2. Create a new Static Web App resource (e.g., `medofficehq-frontend-prod`)
3. Configure GitHub Actions workflow

#### Update GitHub Actions Workflow

The workflow file should be similar to the sandbox one, but with:
- Different Azure Static Web App token
- Potentially different environment variables (if needed)

**File:** `.github/workflows/azure-static-web-apps-{your-app-name}.yml`

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
      - uses: actions/checkout@v3
        with:
          submodules: true
          lfs: false
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_YOUR_PROD_APP }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          api_location: ""
          output_location: ".next"
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_YOUR_PROD_APP }}
          action: "close"
```

### 4. Environment Variables

Ensure the following secrets are configured in GitHub:

- `AZURE_STATIC_WEB_APPS_API_TOKEN_YOUR_PROD_APP` - Azure Static Web App deployment token
- `NEXT_PUBLIC_API_URL` - Backend API URL (should be the same as sandbox)

### 5. Verification Checklist

After setup, verify:

- [ ] `getEnvironment()` in `axiosInstance.js` returns `"production"`
- [ ] `athenaEnvironmentAtom` in `atoms.js` is set to `"production"`
- [ ] `EnvironmentToggle` component is NOT used in layout
- [ ] All API calls to `/rules/`, `/filters/`, `/patients/`, `/medofficehq/athena/`, `/v1/logs` include `X-Athena-Environment: production` header
- [ ] Azure Static Web App is deployed and accessible
- [ ] GitHub Actions workflow is working

### 6. Testing

1. Deploy the production repository
2. Login to the production portal
3. Check browser DevTools → Network tab
4. Verify that API requests include header: `X-Athena-Environment: production`
5. Test a rule execution to ensure it's using production environment

## Key Differences Summary

| Aspect | Sandbox Repository | Production Repository |
|--------|-------------------|----------------------|
| `getEnvironment()` | Returns `"sandbox"` | Returns `"production"` |
| `athenaEnvironmentAtom` | `atom("sandbox")` | `atom("production")` |
| Environment Toggle | Removed | Removed |
| API Header | `X-Athena-Environment: sandbox` | `X-Athena-Environment: production` |
| Azure App Name | `medofficehq-frontend` | `medofficehq-frontend-prod` (or similar) |

## Notes

- Both repositories share the same codebase structure
- Only 2 files need to be changed: `axiosInstance.js` and `atoms.js`
- The environment toggle component can remain in the codebase but won't be used
- Consider adding a visual indicator (badge/header) to distinguish sandbox vs production portals
- Keep both repositories in sync for feature updates, but maintain separate environment configurations

