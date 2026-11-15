@echo off
rem Refreshes every posted reel's Instagram stats in the Google Sheet, if the last refresh was 7+ days ago.
rem The weekly Windows scheduled task runs this. Double-click to run it by hand (it then refreshes now).
cd /d "%~dp0"
if "%1"=="--if-due" (node studio\ig-stats.mjs --if-due) else (node studio\ig-stats.mjs & pause)
