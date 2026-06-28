# Vercel Deployment Setup

## What Changed

### New Structure
- `/api` directory contains Vercel serverless functions
  - `/api/breakdown/index.js` - Assignment breakdown endpoint
  - `/api/assignments/index.js` - List/create assignments
  - `/api/assignments/[assignmentId].js` - Get/update/delete single assignment
  - `/api/assignments/[assignmentId]/tasks/index.js` - List/create tasks
  - `/api/assignments/[assignmentId]/tasks/[taskId].js` - Get/update/delete single task
  - `/api/lib/` - Shared utilities (database, validators, error handling)

### Configuration Files
- `vercel.json` - Deployment config (build command, function settings, env vars)
- `.vercelignore` - Files to exclude from Vercel build

### Updated Build
- Root `package.json` now includes `build` and `build:api` scripts
- `client/vite.config.js` includes build output configuration

## Deployment Steps

### 1. Environment Variables
Set these in Vercel project settings under "Environment Variables":
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `OPENAI_API_KEY` - Your OpenAI API key

### 2. Deploy to Vercel
```bash
npm install -g vercel
vercel
```

Follow prompts:
- Link existing project or create new one
- Select root directory
- Framework preset: "Other" (monorepo)

### 3. First Deploy
```bash
vercel deploy
```

Vercel will:
1. Install dependencies
2. Run `npm run build` (client build)
3. Package `/api` functions as serverless endpoints
4. Deploy client to `/` and APIs to `/api/*`

### 4. Verify
- Visit your Vercel URL
- Check `/api/health` should return `{"status":"ok",...}` if added
- Submit an assignment - should hit `/api/breakdown`
- View assignments - should fetch from `/api/breakdown`

## Local Development

Dev still works the same:
```bash
npm run dev
```

This runs:
- Client Vite dev server on port 5173
- Server Express on port 3001
- API proxy routes `/api` to port 3001

## Differences from Original

| Aspect | Before | After |
|--------|--------|-------|
| Deployment | Separate client/server | Single Vercel deployment |
| API | Express server (port 3001) | Vercel serverless functions |
| Backend hosting | Needs separate host (Railway, etc) | Vercel |
| Database | Supabase | Supabase (unchanged) |
| Client | Vite SPA | Vite SPA (unchanged) |

## Troubleshooting

### 404 on API calls
- Check `/api` routes are properly deployed
- Verify environment variables are set in Vercel
- Check Vercel build logs for errors

### Supabase connection fails
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Check Supabase project is active and accessible
- Review Vercel function logs

### Build fails
- Ensure all dependencies are in root or client `package.json`
- Check for missing npm packages
- Review Vercel build output for specific errors

