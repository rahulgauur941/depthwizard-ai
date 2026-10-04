@echo off
REM DepthWizard AI - Production Stopper
echo Stopping DepthWizard AI services...
taskkill /F /IM cloudflared.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
echo DepthWizard AI stopped.
