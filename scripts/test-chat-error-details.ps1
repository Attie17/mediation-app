# Test chat POST to get detailed error response

$baseUrl = "http://localhost:4000"
$channelId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
$testCaseId = "0782ec41-1250-41c6-9c38-764f1139e8f1"

$headers = @{
    "Content-Type" = "application/json"
    "x-dev-email" = "mediator@example.com"
    "x-dev-role" = "mediator"
    "x-dev-user-id" = "11111111-2222-3333-4444-555555555555"
}

$body = @{
    content = "Test message for error details"
    case_id = $testCaseId
} | ConvertTo-Json

Write-Host "`n=== Sending POST request to get error details ===" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest `
        -Uri "$baseUrl/api/chat/channels/$channelId/messages" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ Success: $($response.StatusCode)" -ForegroundColor Green
    $content = $response.Content | ConvertFrom-Json
    Write-Host "Response:" -ForegroundColor Yellow
    $content | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host "`nError Response Body:" -ForegroundColor Yellow
        try {
            $errorJson = $errorBody | ConvertFrom-Json
            $errorJson | ConvertTo-Json -Depth 5
        } catch {
            Write-Host $errorBody
        }
    }
}
