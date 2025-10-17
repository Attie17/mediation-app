# Simplified Phase 4.2.1 Verification Test
Write-Host "========================================"
Write-Host "PHASE 4.2.1 VERIFICATION TEST"
Write-Host "========================================"
Write-Host ""

$channelId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
$caseId = "0782ec41-1250-41c6-9c38-764f1139e8f1"
$uri = "http://localhost:4000/api/chat/channels/$channelId/messages"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer dev-fake-token-123"
    "x-dev-email" = "dev@example.com"
    "x-dev-user-id" = "01234567-89ab-cdef-0123-456789abcdef"
    "x-dev-role" = "mediator"
}

Write-Host "Step 1: Creating test message..." -ForegroundColor Yellow

$body = @{
    content = "I'm extremely frustrated! This is completely unacceptable and infuriating!"
    case_id = $caseId
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body -ErrorAction Stop
    $messageId = $response.message.id
    
    Write-Host "Message created: $messageId"
    Write-Host ""
    
    Write-Host "Step 2: Waiting 10 seconds for AI analysis..." -ForegroundColor Yellow
    1..10 | ForEach-Object {
        Write-Host "  $_ seconds..."
        Start-Sleep 1
    }
    Write-Host ""
    
    Write-Host "Step 3: Checking database..." -ForegroundColor Yellow
    
    # Update the check script with the message ID
    $content = Get-Content "check-ai-insights.js" -Raw
    $content = $content -replace "const messageId = '[^']+';", "const messageId = '$messageId';"
    $content | Set-Content "temp-check-insights.js"
    
    $dbOutput = node temp-check-insights.js 2>&1 | Out-String
    Remove-Item "temp-check-insights.js" -ErrorAction SilentlyContinue
    
    Write-Host $dbOutput
    
    if ($dbOutput -match "Found (\d+) insights") {
        $count = [int]$Matches[1]
        if ($count -gt 0) {
            Write-Host ""
            Write-Host "SUCCESS! Phase 4.2.1 is COMPLETE!" -ForegroundColor Green
            Write-Host "AI insights are being generated automatically!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "No insights found - server may need restart" -ForegroundColor Yellow
            Write-Host "Restart the server and try again" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "Test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""