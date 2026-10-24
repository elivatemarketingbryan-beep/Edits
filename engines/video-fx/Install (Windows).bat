@echo off
REM Double-click to install Claude Video FX (Windows).
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Get the LTS version from https://nodejs.org and run this again. & pause & exit /b 1)
node install.mjs
pause
