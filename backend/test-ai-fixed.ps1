# Test AI Auto-Analysis with Fixed Implementation
Write-Host "`n=== Testing AI Auto-Analysis (Fixed) ===" -ForegroundColor Cyan

$channelId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
$token = "dev-fake-token"

# Step 1: Send a message with emotional content
Write-Host "`n1. Sending message with emotional content..." -ForegroundColor Yellow

$body = @{
    content = "I'm extremely frustrated! This is completely unacceptable and unfair!"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:4000/api/chat/channels/$channelId/messages" `
    -Method Post `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -Body $body

$messageId = $response.message.id
Write-Host "   Message created: $messageId" -ForegroundColor Green

# Step 2: Wait for AI processing
Write-Host "`n2. Waiting 8 seconds for AI processing..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Step 3: Check for AI insights
Write-Host "`n3. Checking AI insights..." -ForegroundColor Yellow
node check-ai-insights.js $messageId

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
