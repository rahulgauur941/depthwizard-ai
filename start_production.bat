@echo off
REM DepthWizard AI - Production Background Launcher
REM Runs independently of any IDE or terminal

cd /d "%~dp0"

echo Stopping any existing instances...
taskkill /F /IM cloudflared.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

timeout /t 2 /nobreak >nul

echo Starting FastAPI Production ASGI Server on port 8000...
start /b "" "%~dp0backend\venv\Scripts\python.exe" -m uvicorn app.main:app --app-dir "%~dp0backend" --host 0.0.0.0 --port 8000 > "%~dp0backend\production.log" 2>&1

timeout /t 3 /nobreak >nul

echo Starting Cloudflare HTTPS Production Tunnel...
del /f /q "%~dp0tunnel.log" >nul 2>&1
start /b "" "C:\Users\GTBOOK\.local\bin\cloudflared.exe" tunnel --url http://127.0.0.1:8000 --logfile "%~dp0tunnel.log"

echo DepthWizard AI started in background.
