@echo off
echo ========================================
echo  WeDonate -- Database Setup
echo ========================================
cd /d "%~dp0wedonate-backend"
echo.
echo [1] Running database migrations...
npx prisma migrate dev --name init
if %errorlevel% neq 0 (
  echo.
  echo ERROR: Migration failed.
  echo Make sure PostgreSQL is running and DATABASE_URL in .env is correct.
  echo.
  echo Default .env DATABASE_URL:
  echo   postgresql://postgres:postgres@localhost:5432/wedonate_db
  pause
  exit /b 1
)
echo.
echo [2] Seeding demo data...
npm run db:seed
echo.
echo ========================================
echo  Database ready!
echo.
echo  Demo Accounts:
echo    Super Admin : superadmin@wedonate.et  / superadmin123
echo    City Admin  : cityadmin@adama.et      / cityadmin123
echo    User        : abebe@example.com       / user123
echo ========================================
pause
