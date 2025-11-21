# Troubleshooting Network Connection Issues

## Problem
Getting "Not connected to API server" error when accessing from iPad at `http://10.0.0.205:8080`

## Quick Diagnostics

### 1. Test the diagnostic page
Open this URL on your iPad:
```
http://10.0.0.205:8080/test.html
```

This will:
- Show your device info
- Auto-test the API connection
- Show detailed error messages
- Test both `/health` and `/generate` endpoints

### 2. Check browser console
On iPad Safari:
1. Settings → Safari → Advanced → Enable "Web Inspector"
2. Connect iPad to Mac via USB
3. Open Safari on Mac → Develop menu → Select your iPad → Select the page
4. Check Console tab for errors

Or use iPad's built-in console (iOS 15+):
1. On the page, press and hold the refresh button
2. Select "Show Web Inspector"

### 3. Verify servers are running

On the Linux server, check:
```bash
# API server (should show port 8000)
lsof -i :8000

# Web server (should show port 8080)
lsof -i :8080

# Test API from server
curl http://10.0.0.205:8000/health
```

### 4. Common issues and fixes

#### A. Browser cache
Force refresh on iPad:
- Safari: Tap address bar → long press refresh button → "Reload Without Content Blockers"
- Or: Settings → Safari → Clear History and Website Data

#### B. HTTP vs HTTPS
The app uses HTTP (not HTTPS). Some browsers block mixed content. Solution:
- Make sure you're accessing via `http://` not `https://`
- Check if Safari has "Prevent Cross-Site Tracking" enabled (try disabling it)

#### C. CORS issues
Already handled - API allows all origins with:
```python
allow_origins=["*"]
```

#### D. Network/Firewall
Test connectivity:
```bash
# From the server
ping 10.0.0.205

# Check firewall (should be inactive)
sudo ufw status
```

#### E. API URL mismatch
The client is hardcoded to `http://10.0.0.205:8000`. To change:
1. Open Settings (gear icon)
2. Change API URL
3. Click Reconnect button

### 5. Force clear and reload

If still not working:
1. Open `http://10.0.0.205:8080`
2. Add `?nocache=` + random number to URL: `http://10.0.0.205:8080/?nocache=12345`
3. Open browser dev tools (if available)
4. Look for error messages in Console
5. Check Network tab to see failed requests

### 6. Server-side logs

Check what the API server sees:
```bash
# Find the API process
ps aux | grep 'main.py'

# The process should show CORS and request logs in its terminal
# Look for any 403, 404, or 500 errors
```

### 7. Test from another device

Try accessing from:
- Another phone/tablet on the same network
- A laptop on the same network
- The server itself via `http://localhost:8080`

This helps determine if it's iPad-specific or network-wide.

## What's been fixed

✅ Added connection timeout (5 seconds)
✅ Added detailed error logging to console
✅ Added auto-retry (every 10 seconds)
✅ Added manual Reconnect button
✅ Better error messages showing connection status
✅ Created diagnostic test page

## Next steps

1. Visit `http://10.0.0.205:8080/test.html` on your iPad
2. Check what error appears
3. Look at browser console for details
4. Report back the exact error message

The diagnostic page will show exactly what's failing and why!
