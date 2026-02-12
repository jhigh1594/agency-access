# Dev Auth Bypass & Browser Automation Setup

This guide covers two development tools:
1. **Auth Bypass** - Skip Clerk sign-in for browser automation
2. **Chrome CDP** - Connect browser tools to your authenticated session

---

## 1. Dev Auth Bypass

### Enable Auth Bypass

Add to your `apps/web/.env.local`:

```bash
NEXT_PUBLIC_BYPASS_AUTH=true
```

### What It Does

- Mocks Clerk authentication with a dev user
- Bypasses all auth redirects and loading states
- Shows a "Dev Mode" badge in the sidebar
- Works for all authenticated routes (`/dashboard`, `/connections`, etc.)

### Mock User Details

```
User ID: dev_user_test_123456789
Org ID:  dev_org_test_987654321
```

### When to Use

- Browser automation testing
- Visual regression testing
- Screenshot-based debugging
- Any headless browser workflow

### When NOT to Use

- Testing actual Clerk integration
- Testing auth flows
- Production builds (enforced via `NODE_ENV` check)

---

## 2. Chrome CDP Connection

### What Is CDP?

Chrome DevTools Protocol (CDP) lets external tools connect to an existing browser session. This means your AI tools see exactly what you see — same auth, same state, same cookies.

### Launch Chrome with CDP

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# Linux
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\chrome-debug"
```

**Flags explained:**
- `--remote-debugging-port=9222` - Enable CDP on port 9222
- `--user-data-dir=/tmp/chrome-debug` - Isolated profile (doesn't affect your main Chrome)

### Connect Your Browser Tool

Configure your browser MCP/automation tool to connect via CDP:

```json
{
  "browser": {
    "cdpUrl": "http://localhost:9222"
  }
}
```

Or with Playwright MCP:
```js
const browser = await chromium.connectOverCDP('http://localhost:9222');
```

### Workflow

1. **Start Chrome with CDP** (above command)
2. **Sign in to AuthHub** normally in that Chrome window
3. **Connect your tool** via CDP
4. **Tool sees authenticated session** - no cookies/storage management needed

---

## Combined Workflow (Recommended)

For the smoothest browser automation experience:

1. **Enable auth bypass** (`NEXT_PUBLIC_BYPASS_AUTH=true`)
2. **Start dev server** (`npm run dev:web`)
3. **Run your automation** - no auth required

For visual debugging/inspection:
1. **Start Chrome with CDP**
2. **Sign in manually** once
3. **Connect tools via CDP**
4. **Tools stay authenticated** as long as Chrome session lasts

---

## Troubleshooting

### Bypass Not Working

- Ensure `NEXT_PUBLIC_BYPASS_AUTH=true` in `.env.local` (NOT `.env.example`)
- Restart dev server after changing env vars
- Check that `NODE_ENV=development`

### CDP Connection Refused

- Verify Chrome started with CDP flag
- Check port 9222 isn't already in use: `lsof -ti:9222`
- Try accessing `http://localhost:9222/json` in browser — should see JSON

### Already Running Chrome

Use a separate user data dir to avoid conflicts:
```bash
--user-data-dir=/tmp/chrome-debug
```

---

## Security Notes

⚠️ **Development Only**
- Auth bypass is disabled in production builds
- Never deploy with `NEXT_PUBLIC_BYPASS_AUTH=true`
- CDP exposes browser to localhost only (not externally accessible)

---

## See Also

- [Clerk Testing Guide](https://clerk.com/docs/testing/overview)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Playwright CDPLaunchOptions](https://playwright.dev/docs/api/class-cdplaunchoptions/)
