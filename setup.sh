#!/bin/bash

echo "🛒 Starting 1-Click Shop API Setup..."

# 1. Setup Environment
if [ ! -f .env ]; then
  echo "📄 Creating default .env file from .env.example..."
  cp .env.example .env
  echo "✅ .env created. (Note: Running natively uses DB_HOST=localhost)"
else
  echo "ℹ️  .env file already exists, skipping creation."
fi

# 2. Install Dependencies
echo "📦 Installing npm dependencies..."
npm install

# 3. Boot Database
echo "🐳 Starting PostgreSQL via Docker (in background)..."
docker-compose up db -d

# 4. Wait for Database
echo "⏳ Waiting 5 seconds for Database to start accepting connections..."
sleep 5

# 5. Run Migrations
echo "🏗  Deploying Knex Migrations..."
npm run migrate

# 6. Seed Database
echo "🌱 Populating Data (Seed)..."
npm run seed

# 7. Run Verification Tests
echo "🧪 Running Integration Tests to verify architecture..."
npm run test

echo "✅ Setup Complete!"
echo "🚀 Booting Development Server..."
npm run dev
