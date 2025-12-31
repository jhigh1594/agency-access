# Setting Root Directory in Railway

## Option 1: Via Dashboard (If Available)

1. Go to your Railway project: https://railway.app/project/adequate-curiosity
2. Click on the `@agency-platform/api` service
3. Go to **Settings** tab
4. Look for **Source** section
5. Find **Root Directory** field
6. Enter: `apps/api`
7. Save changes

**Note:** If you don't see this option, Railway may have moved it or it might be auto-detected.

## Option 2: Via railway.json (Already Configured)

I've added the `source.rootDirectory` field to `railway.json`. Railway should pick this up automatically.

The file now includes:
```json
{
  "source": {
    "rootDirectory": "apps/api"
  }
}
```

## Option 3: Not Required (Current Setup)

Actually, **you might not need to set root directory at all!**

Our `railway.json` already has explicit `cd apps/api` commands in:
- Build command: `cd apps/api && npm run build`
- Start command: `cd apps/api && npm start`

So Railway will work from the repo root and navigate to `apps/api` as needed.

## Verification

After pushing the updated `railway.json`, Railway should:
1. Detect the root directory from the config
2. Or use the explicit `cd` commands in build/start

Either way, it should work! The build logs will show which directory Railway is using.

