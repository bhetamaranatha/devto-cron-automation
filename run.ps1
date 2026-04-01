# Start Dashboard + Automation Worker
Write-Host "Starting Dev.to Automation..." -ForegroundColor Cyan

Set-Location -Path $PSScriptRoot

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Start Dashboard server in background
Write-Host "Starting Dashboard server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node src/server.js" -WorkingDirectory $PSScriptRoot

Start-Sleep -Seconds 2

# Open browser
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Dashboard is running at http://localhost:3000" -ForegroundColor Green
Write-Host "To trigger an article manually: node src/index.js --now" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

# Keep this window running the cron worker
node src/index.js
