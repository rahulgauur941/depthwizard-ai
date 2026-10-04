# DepthWizard AI - Detached Production Starter
# Starts backend and Cloudflare tunnel via WMI so they run independently of Antigravity

$root = "D:\SIH Project"
Set-Location $root

Write-Output "Stopping existing processes..."
Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Find process on port 8000
$netstat = netstat -ano | Select-String ":8000.*LISTENING"
foreach ($line in $netstat) {
    $parts = ($line -split '\s+') | Where-Object { $_ -ne '' }
    if ($parts.Count -ge 5) {
        $pidToKill = [int]$parts[-1]
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 2

# Remove old logs
if (Test-Path "$root\tunnel.log") { Remove-Item "$root\tunnel.log" -Force }
if (Test-Path "$root\backend\production.log") { Remove-Item "$root\backend\production.log" -Force }

# Launch FastAPI ASGI server via WMI
$pythonExe = "$root\backend\venv\Scripts\python.exe"
$backendCmd = "`"$pythonExe`" -m uvicorn app.main:app --app-dir `"$root\backend`" --host 0.0.0.0 --port 8000"
$uvicornResult = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = "cmd.exe /c `"$backendCmd > `"$root\backend\production.log`" 2>&1`""
    CurrentDirectory = "$root\backend"
}
Write-Output "Uvicorn launched via WMI with ReturnValue $($uvicornResult.ReturnValue), ProcessId $($uvicornResult.ProcessId)"

Start-Sleep -Seconds 3

# Launch Cloudflared tunnel via WMI
$cfExe = "C:\Users\GTBOOK\.local\bin\cloudflared.exe"
$cfCmd = "`"$cfExe`" tunnel --url http://127.0.0.1:8000 --logfile `"$root\tunnel.log`""
$cfResult = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = "cmd.exe /c `"$cfCmd`""
    CurrentDirectory = $root
}
Write-Output "Cloudflared launched via WMI with ReturnValue $($cfResult.ReturnValue), ProcessId $($cfResult.ProcessId)"

Start-Sleep -Seconds 6

# Extract public tunnel URL
if (Test-Path "$root\tunnel.log") {
    $tunnelUrl = Get-Content "$root\tunnel.log" | Select-String -Pattern "https://[a-zA-Z0-9-]+\.trycloudflare\.com" | Select-Object -First 1
    if ($tunnelUrl) {
        $url = $matches[0]
        Write-Output "PUBLIC_URL: $url"
    } else {
        Write-Output "Tunnel log initialized; waiting for DNS propagation..."
    }
}
