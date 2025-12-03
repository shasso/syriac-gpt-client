# syntax=docker/dockerfile:1
# Multi-stage optional (here single stage is enough because assets are static)
FROM nginx:1.27-alpine

# Install brotli module (if available in Alpine repository)
# Install brotli module (if available) and curl for healthcheck
RUN apk add --no-cache nginx-mod-http-brotli curl || echo "brotli module not available" && \
      mkdir -p /usr/share/nginx/html

# Set build-time metadata
LABEL org.opencontainers.image.title="Modern Assyrian GPT Client" \
      org.opencontainers.image.description="Static chat client served by Nginx proxying to GPT API" \
      org.opencontainers.image.source="https://github.com/shasso/Modern-Assyrian-GPT-API" \
      maintainer="shasso"

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static assets
COPY index.html /usr/share/nginx/html/index.html
COPY app.js /usr/share/nginx/html/app.js
COPY style.css /usr/share/nginx/html/style.css
COPY test.html /usr/share/nginx/html/test.html
COPY logo_mimalt_small.png /usr/share/nginx/html/logo_mimalt_small.png
COPY README.md /usr/share/nginx/html/README.client.md
COPY TROUBLESHOOTING.md /usr/share/nginx/html/TROUBLESHOOTING.client.md

# Healthcheck: rely on upstream API health or static file availability
# Use curl for a simple 200 check on the root
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
      CMD curl -fsS http://localhost/ || exit 1

EXPOSE 80

# Use default nginx entrypoint/cmd
