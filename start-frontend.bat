@echo off
echo ========================================
echo  WeDonate Frontend — Starting...
echo ========================================
cd /d "%~dp0wedonate-frontend"
echo.
echo Starting frontend on http://localhost:5173
echo.
npm run dev
pause
