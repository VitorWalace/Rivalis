#!/bin/bash
# Render.com build script
echo "🚀 Starting Render deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Show environment
echo "🔧 Environment variables:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL configured: $([ -n "$DATABASE_URL" ] && echo "✅" || echo "❌")"

echo "✅ Build completed successfully!"