@echo off
echo 🛒 Starting 1-Click Shop API Setup for Windows...

REM 1. Setup Environment
if not exist .env (
    echo 📄 Creating default .env file from .env.example...
    copy .env.example .env
    echo ✅ .env created. (Note: Running natively uses DB_HOST=localhost)
) else (
    echo ℹ️  .env file already exists, skipping creation.
)

REM 2. Install Dependencies
echo 📦 Installing npm dependencies...
call npm install

REM 3. Boot Database
echo 🐳 Starting PostgreSQL via Docker (in background)...
docker-compose up db -d

REM 4. Wait for DB to be healthy
echo ⏳ Waiting 10s for Database to initialize...
timeout /t 10 /nobreak >nul

REM 5. Run Migrations
echo 🔄 Running Database Migrations (Knex)...
call npm run migrate

REM 6. Seed Data
echo 🌱 Seeding Initial Data...
call npm run seed

echo.
echo 🎉 Setup Complete!
echo 🚀 To start the server, run: npm run dev
echo.
pause
