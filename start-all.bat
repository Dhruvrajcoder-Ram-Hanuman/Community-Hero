@echo off
title Community Hero Launcher
echo ========================================================
echo         🛡️ COMMUNITY HERO PLATFORM LAUNCHER 🛡️
echo ========================================================
echo.
echo [1/3] Launching Express + Node API backend on http://localhost:5000 ...
start "Community Hero - API Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul

echo [2/3] Launching Citizen Web Application on http://localhost:5173 ...
start "Community Hero - Citizen Frontend" cmd /k "cd citizen-portal && npm run dev"
timeout /t 1 /nobreak > nul

echo [3/3] Launching Government Official Portal on http://localhost:5174 ...
start "Community Hero - Official Dashboard" cmd /k "cd official-portal && npm run dev"

echo.
echo ========================================================
echo  All three services launched in separate windows!
echo  - Backend API: http://localhost:5000
echo  - Citizen Site: http://localhost:5173
echo  - Official Portal: http://localhost:5174
echo.
echo  Note: You can close this window now. Keep the opened 
echo  terminal windows running to keep the app alive.
echo ========================================================
pause
