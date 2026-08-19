@echo off
echo ========================================
echo  WeDonate Backend — Starting...
echo ========================================
cd /d "%~dp0wedonate-backend"
echo.
echo [1] Checking environment...
if not exist ".env" (
  echo ERROR: .env file not found!
  echo Please copy .env.example to .env and configure it.
  pause
  exit /b 1
)
echo [2] Starting backend server on http://localhost:5000
echo.
npm run dev
pause
