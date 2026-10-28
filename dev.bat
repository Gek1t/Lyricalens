@echo off
title Lyricalens Fullstack Dev
cd /d "%~dp0"
set NODE_ENV=development

REM Free port 3000 if occupied
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr ":3000 "') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo ========================================================
echo   Starting Lyricalens Fullstack Dev (Hot Reload)...
echo   Open in browser: http://localhost:3000
echo ========================================================

corepack pnpm dev
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Dev server exited with code %errorlevel%.
    pause
)
