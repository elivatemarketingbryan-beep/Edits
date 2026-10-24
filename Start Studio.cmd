@echo off
rem Double-click to open Video Studio in your browser. Close this window to stop it.
cd /d "%~dp0"
start "" http://localhost:4747
node studio\server.mjs
pause
