# Migration from Nixpacks to Railpack

## What Changed

Railway has deprecated Nixpacks in favor of **Railpack**, a zero-config application builder that automatically analyzes your code and creates optimized container images.

## Updates Made

1. **Updated `railway.json`:**
   - Changed `"builder": "NIXPACKS"` → `"builder": "RAILPACK"`
   - Build and start commands remain the same (Railpack respects these)

2. **Removed `nixpacks.toml`:**
   - Railpack uses a different configuration approach
   - Configuration is now handled through `railway.json` and auto-detection

## How Railpack Works

Railpack automatically:
- Detects your project type (Node.js, in this case)
- Analyzes your `package.json` to determine dependencies
- Uses BuildKit for efficient caching
- Creates optimized container images

## Benefits of Railpack

- **Smaller builds:** Reduced image sizes for faster deployments
- **Better caching:** Direct BuildKit integration for improved cache efficiency
- **Granular versioning:** More precise control over package versions
- **Auto-detection:** Zero-config setup for most projects

## Configuration

The build process is configured in `railway.json`:
- **Build command:** Builds shared package, then API with Prisma generation
- **Start command:** Starts the API server from `apps/api`

Railpack will automatically:
- Detect Node.js from `package.json`
- Install dependencies using npm workspaces
- Run the build commands specified in `railway.json`

## References

- [Railpack Documentation](https://railpack.com)
- [Railway Railpack Guide](https://docs.railway.com/reference/railpack)
- [Railpack GitHub](https://github.com/railwayapp/railpack)

