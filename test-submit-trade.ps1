# Test script to submit trades to the frontend API
# Usage: .\test-submit-trade.ps1 [buy|sell] [amount] [price] [tokenPair]

param(
    [string]$side = "sell",
    [string]$amount = "1.5",
    [string]$price = "3200",
    [string]$tokenPair = "ETH/USDC"
)

$tradeData = @{
    worldIdProof = @{
        merkle_root = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        nullifier_hash = "0x$(Get-Random -Minimum 1000000 -Maximum 9999999)abcdefabcdefabcdefabcdefabcdef"
        proof = "0xproof_$(Get-Date -Format 'yyyyMMddHHmmss')"
        verification_level = "orb"
    }
    zkProof = @{
        pi_a = @("0x1", "0x2")
        pi_b = @(@("0x3", "0x4"), @("0x5", "0x6"))
        pi_c = @("0x7", "0x8")
        publicSignals = @(
            "1000000000000000000"  # Balance (1 ETH)
            "0x123abc$(Get-Random -Minimum 100000 -Maximum 999999)"  # Wallet commitment
            "$($price)000000"  # Price
            "$($amount -replace '\.', '')00000000000000000"  # Amount
            "1"  # Token ID
        )
    }
    trade = @{
        side = $side
        tokenPair = $tokenPair
        amount = $amount
        price = $price
    }
    timestamp = [int64](([datetime]::UtcNow)-(Get-Date "1/1/1970")).TotalMilliseconds
}

Write-Host "Submitting $side trade: $amount $tokenPair @ price $price" -ForegroundColor Cyan

$json = $tradeData | ConvertTo-Json -Depth 10
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/trade" `
    -Method POST `
    -Body $json `
    -ContentType "application/json"

Write-Host "Response:" -ForegroundColor Green
$response | ConvertTo-Json -Depth 5 | Write-Host

Write-Host ""
Write-Host "Test the CRE workflow to pull this trade:" -ForegroundColor Yellow
Write-Host "   cd privotc-cre" -ForegroundColor Gray
Write-Host "   cre workflow simulate my-workflow --trigger-index 2 --target privotc-staging --non-interactive" -ForegroundColor Gray
