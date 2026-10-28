@echo off
title Lyricalens Fullstack App
cd /d "%~dp0"
set NODE_ENV=production

REM Free port 3000 if occupied
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr ":3000 "') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo ========================================================
echo   Starting Lyricalens Fullstack Server...
echo   Open in browser: http://localhost:3000
echo   Database: SQLite (WAL Mode active)
echo ========================================================

node dist/server.cjs
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server exited with code %errorlevel%.
    pause
)
