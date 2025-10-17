# Simple single test to see the full error
$baseUrl = "http://localhost:4000"

$headers = @{
    "x-dev-email" = "test@example.com"
    "x-dev-role" = "mediator"
    "Content-Type" = "application/json"
}

$body = @{
    content = "Test message"
    case_id = 4
} | ConvertTo-Json

Write-Host "Testing POST message..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/chat/channels/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/messages" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ Success!" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($_.Exception.Message)"
    
    # Try to get response body
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body:" -ForegroundColor Gray
        Write-Host $responseBody
    }
}
