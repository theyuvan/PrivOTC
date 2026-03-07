# Start CRE Webhook Server
# Keep this running in a terminal while using the frontend

Write-Host "`n🚀 Starting CRE Webhook Server...`n" -ForegroundColor Cyan

# Check if node modules exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install express cors
}

Write-Host "🌐 Server will run on http://localhost:4001`n" -ForegroundColor Green

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Instructions:" -ForegroundColor White
Write-Host "  1. Keep this terminal open" -ForegroundColor White
Write-Host "  2. Go to https://chain-phi-seven.vercel.app/trade" -ForegroundColor White
Write-Host "  3. Click '🚀 Run Matching' button to trigger matching" -ForegroundColor White
Write-Host "  4. Watch this terminal for matching logs" -ForegroundColor White  
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

node cre-webhook-server.js
