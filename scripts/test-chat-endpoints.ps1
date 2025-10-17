# Test Chat API Endpoints
# Run with: powershell -ExecutionPolicy Bypass -File .\test-chat-endpoints.ps1

$baseUrl = "http://localhost:4000"

# Use dev auth headers
$headers = @{
    "x-dev-email" = "test@example.com"
    "x-dev-user-id" = "11111111-2222-3333-4444-555555555555"
    "x-dev-role" = "mediator"
    "Content-Type" = "application/json"
}

Write-Host "`n=== Testing Chat API Endpoints ===" -ForegroundColor Cyan

# Test 1: Create a test message
Write-Host "`n[TEST 1] POST /api/chat/channels/:channelId/messages - Create message" -ForegroundColor Yellow
$testChannelId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
$testCaseId = "0782ec41-1250-41c6-9c38-764f1139e8f1"  # Using actual UUID from database

$messageBody = @{
    content = "This is a test message from the chat API"
    case_id = $testCaseId
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/chat/channels/$testChannelId/messages" `
        -Method POST `
        -Headers $headers `
        -Body $messageBody `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Message created successfully" -ForegroundColor Green
    Write-Host "   Message ID: $($result.message.id)" -ForegroundColor Gray
    Write-Host "   Sender: $($result.message.sender_name)" -ForegroundColor Gray
    Write-Host "   Content: $($result.message.content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get messages for channel
Write-Host "`n[TEST 2] GET /api/chat/channels/:channelId/messages - Fetch messages" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/chat/channels/$testChannelId/messages" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Fetched messages successfully" -ForegroundColor Green
    Write-Host "   Total messages: $($result.count)" -ForegroundColor Gray
    
    if ($result.messages.Count -gt 0) {
        Write-Host "   Latest message: $($result.messages[-1].content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get messages for case
Write-Host "`n[TEST 3] GET /api/chat/cases/:caseId/messages - Fetch case messages" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/chat/cases/$testCaseId/messages?limit=50" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Fetched case messages successfully" -ForegroundColor Green
    Write-Host "   Total messages: $($result.count)" -ForegroundColor Gray
    Write-Host "   Case ID: $($result.case_id)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Create another message
Write-Host "`n[TEST 4] POST message with validation" -ForegroundColor Yellow

$shortMessage = @{
    content = "Short"
    case_id = $testCaseId
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/chat/channels/$testChannelId/messages" `
        -Method POST `
        -Headers $headers `
        -Body $shortMessage `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Short message accepted" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Test empty message (should fail)
Write-Host "`n[TEST 5] POST empty message (should fail with 400)" -ForegroundColor Yellow

$emptyMessage = @{
    content = "   "
    case_id = $testCaseId
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/chat/channels/$testChannelId/messages" `
        -Method POST `
        -Headers $headers `
        -Body $emptyMessage `
        -ErrorAction Stop
    
    Write-Host "❌ Should have failed but didn't" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Correctly rejected empty message (400)" -ForegroundColor Green
    } else {
        Write-Host "❌ Wrong error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`n=== Chat API Tests Complete ===" -ForegroundColor Cyan
