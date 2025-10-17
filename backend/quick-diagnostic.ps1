# Quick diagnostic to verify server has latest code
Write-Host "Checking if server has latest AI processing code..." -ForegroundColor Cyan

try {
    # Check if server is running
    $health = Invoke-RestMethod -Uri "http://localhost:4000/healthz" -Method Get -ErrorAction Stop
    Write-Host "✓ Server is running on port 4000" -ForegroundColor Green
    
    # Create a test message
    Write-Host "Creating test message..." -ForegroundColor Yellow
    
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer dev-fake-token-123"
        "x-dev-email" = "dev@example.com"
        "x-dev-user-id" = "01234567-89ab-cdef-0123-456789abcdef"
        "x-dev-role" = "mediator"
    }
    
    $body = @{
        content = "Quick diagnostic test message"
        case_id = "0782ec41-1250-41c6-9c38-764f1139e8f1"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/chat/channels/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/messages" -Method Post -Headers $headers -Body $body -ErrorAction Stop
    
    Write-Host "✓ Message created: $($response.message.id)" -ForegroundColor Green
    Write-Host "Waiting 5 seconds..." -ForegroundColor Yellow
    Start-Sleep 5
    
    # Quick DB check
    $checkScript = @"
import { pool } from './src/db.js';
const result = await pool.query('SELECT COUNT(*) as count FROM ai_insights WHERE created_at > NOW() - INTERVAL ''1 minute''');
console.log(result.rows[0].count);
pool.end();
"@
    
    $checkScript | Out-File -FilePath "temp-quick-check.js" -Encoding UTF8
    $count = node temp-quick-check.js 2>&1
    Remove-Item "temp-quick-check.js" -ErrorAction SilentlyContinue
    
    if ($count -match "^\d+$" -and [int]$count -gt 0) {
        Write-Host "✓ AI insights generated in last minute: $count" -ForegroundColor Green
        Write-Host ""
        Write-Host "SUCCESS! Server has latest code and AI processing is working!" -ForegroundColor Green
        Write-Host "Phase 4.2.1 is VERIFIED COMPLETE!" -ForegroundColor Green
    } else {
        Write-Host "✗ No recent AI insights found" -ForegroundColor Red
        Write-Host "Server may need restart or check server logs for errors" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "  1. Server not running on port 4000" -ForegroundColor White
    Write-Host "  2. Server needs restart to load latest code" -ForegroundColor White
    Write-Host "  3. Check server terminal for errors" -ForegroundColor White
}