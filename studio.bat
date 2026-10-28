@echo off
title Prisma Studio (Database Visualizer)
cd /d "%~dp0"

echo ========================================================
echo   Starting Prisma Studio Database Visualizer...
echo   Working Directory: %~dp0
echo   URL: http://localhost:5555
echo ========================================================

corepack pnpm exec prisma studio --port 5555
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Prisma Studio failed to start.
    pause
)
