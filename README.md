# Modern Assyrian GPT Chat Client

A modern, responsive web chat interface for the Modern Assyrian GPT API with customizable Modern Assyrian fonts.

## Features

- 🎨 Modern, responsive dark-themed UI
- 🔤 Multiple Modern Assyrian font options (Noto Sans Syriac, Scheherazade New, etc.)
- ⚙️ Adjustable font size
- 🎛️ Configurable generation parameters (temperature, max tokens, top-k)
- 🤖 **Dynamic model selection** - Choose between available GPT models
- 📋 **Copy to clipboard** - One-click copy for generated text
- 📊 **Model indicator** - Shows active model in status bar and message metrics
- 💬 Real-time chat interface
- 📱 Mobile-friendly design
- 🔄 Automatic reconnection
- 💾 Settings persistence (localStorage)
- ✨ Smooth animations and transitions

## Quick Start (Standalone)

### 1. Ensure the API Server is Running

```bash
cd ../syriac-gpt-api
./run_local_cpu.sh
```

The API should be running on `http://localhost:8000`

### 2. Open the Chat Client (Static Mode)

Simply open `index.html` in your web browser:

```bash
# On Linux
xdg-open index.html

# On macOS
open index.html

# On Windows
start index.html
```

Or use a local web server (recommended):

```bash
# Python 3
python3 -m http.server 8080

# Or using Node.js
npx http-server -p 8080
```

Then navigate to: `http://localhost:8080`

## Docker Deployment (Nginx)

You can serve the client via an Nginx container that also proxies API requests to the model backend.

**Prerequisites for API GPU acceleration:**
- NVIDIA GPU with CUDA support
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) installed
- Docker configured with `nvidia` runtime

### 1. Build the image

```bash
cd syriac-gpt-client
docker build -t modern-assyrian-client:latest .
```

### 2. Run with existing API container

Assuming the API container is named `assyrian-api` exposing port 8000 on a user-defined bridge network `assyrian-net`:

```bash
# Create network if not exists
docker network create assyrian-net || true

# Run API (example) - requires NVIDIA GPU and nvidia-docker runtime
docker run -d --name api --network assyrian-net --gpus all -p 8000:8000 syriac-gpt-api:latest

# Run client (nginx)
docker run -d --name client --network assyrian-net -p 8080:80 modern-assyrian-client:latest
```

Visit: `http://localhost:8080`

The client fetches `/health`, `/generate`, `/metrics` as relative paths which Nginx proxies to the API service (`api:8000`).

### Enhanced Security & Performance

The image and `nginx.conf` include:

- **Content-Security-Policy (CSP)** limiting external origins to Google Fonts only.
- **Permissions-Policy** disabling geolocation and microphone.
- **X-Frame-Options**, **X-Content-Type-Options**, **Referrer-Policy** hardening.
- **Gzip + Brotli compression** (Brotli activates if module present in base image).
- **Granular caching rules**: long-lived immutable caching for `*.css`/`*.js` (30 days), short cache for HTML (5 minutes), moderate cache for images (7 days).
- **Version query parameters** (`style.css?v=1`, `app.js?v=1`) for simple cache busting without renaming files.

To bump asset versions, increment the `?v=1` parameter in `index.html` and optionally adjust cache durations.

### docker-compose example

```yaml
version: '3.8'
services:
  api:
    image: syriac-gpt-api:latest
    ports:
      - "8000:8000"
    networks: [assyrian-net]
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  client:
    image: modern-assyrian-client:latest
    ports:
      - "8080:80"
    depends_on: [api]
    networks: [assyrian-net]

networks:
  assyrian-net: {}
```Bring everything up:

```bash
docker compose up -d
```

## Usage

### Chatting

1. Type your Modern Assyrian message in the input box at the bottom
2. Press Enter or click the send button
3. Wait for the GPT model to generate a response
4. Hover over any message to reveal the copy button (📋) and click to copy text to clipboard
5. View model name and performance metrics below each response
6. Continue the conversation naturally

### Settings

Click the gear icon (⚙️) in the top-right to access settings:

- **Model**: Select from available GPT models (fetched from API)
- **Modern Assyrian Font**: Choose from multiple Modern Assyrian fonts
- **Font Size**: Adjust text size (12-32px)
- **Temperature**: Control randomness (0.1-2.0)
- **Max Tokens**: Set response length (10-200)
- **Top-K**: Configure sampling (1-100)
- **API URL**: Change the backend API endpoint

All settings are automatically saved to your browser's localStorage.

### Status Bar

The bottom status bar displays:
- **Connection status**: Green dot when connected to API
- **Model indicator**: Shows currently selected model (or API default)
- **Reconnect button**: Appears when disconnected

### Message Metrics

Each assistant response includes:
- 🤖 **Model name**: Which model generated the response
- ⚡ **Tokens/second**: Generation speed
- ⏱️ **Latency**: Response time
- 📊 **Total tokens**: Cumulative tokens generated

## Keyboard Shortcuts

- `Enter`: Send message
- `Shift + Enter`: New line in message input
- `Esc`: Close settings panel (when focused)

## Customization

### Adding More Fonts

To add additional Modern Assyrian fonts:

1. Add the font link in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=YourFont&display=swap" rel="stylesheet">
```

2. Add the option in the font selector:
```html
<option value="YourFont">Your Font Name</option>
```

### Changing Theme Colors

Edit the CSS variables in `style.css`:

```css
:root {
    --primary-color: #6366f1;  /* Main theme color */
    --background: #0f172a;     /* Main background */
    --surface: #1e293b;        /* Card background */
    /* ... other colors */
}
```

### Modifying API Endpoint

In containerized mode the default `apiUrl` is empty string (`''`), causing the client to use relative paths (`/generate`, etc.) which Nginx proxies. For standalone usage (no proxy) set a full URL in settings or edit `app.js`.

Or change it through the Settings panel in the UI.

## File Structure

```
syriac-gpt-client/
├── index.html          # Main HTML structure
├── style.css           # All styling and animations
├── app.js              # Application logic and API calls
└── README.md           # This file
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Troubleshooting

### "Disconnected" Status
- Ensure the API server is running on the configured URL
- Check CORS settings if using a different domain
- Verify the API URL in settings matches your server

### Messages Not Sending
- Check browser console for errors (F12)
- Verify API server logs for issues
- Ensure the API is not rate-limited or overloaded

### Fonts Not Loading
- Check internet connection (fonts load from Google Fonts)
- Try a different browser
- Check browser console for font loading errors

## Development

To modify the client:

1. Edit HTML structure in `index.html`
2. Modify styles in `style.css`
3. Change logic in `app.js`
4. Test in multiple browsers and screen sizes

No build process required - pure HTML/CSS/JavaScript!

## API Integration

The client expects the API to have these endpoints:

- `GET /health` - Check API status
- `GET /models` - List available models (returns active, default, and models list)
- `POST /generate` - Generate text (optionally accepts `model_id` to override active model)

Request format for `/generate`:
```json
{
    "prompt": "ܡܪܝܐ",
    "max_new_tokens": 50,
    "temperature": 0.8,
    "top_k": 40,
    "model_id": "Assur-SPM8K-Scribes-4M"
}
```

The `model_id` field is optional - if omitted, the API's currently active model is used.

### Model Selection

The client fetches available models from `GET /models` on startup and populates a dropdown in the settings panel. When a user selects a model:

1. The selection is saved to localStorage
2. All subsequent generation requests include the selected `model_id`
3. The API uses that model for generation (per-request override)

Models marked as `disabled: true` in the API's manifest are shown as "(unavailable)" and cannot be selected.

## License

Same as the Modern Assyrian GPT API project.
