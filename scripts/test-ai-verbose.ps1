# More verbose route test with error details

$baseUrl = "http://localhost:4000"

$headers = @{
    "Content-Type" = "application/json"
    "x-dev-email" = "mediator@example.com"
    "x-dev-role" = "mediator"
    "x-dev-user-id" = "11111111-2222-3333-4444-555555555555"
}

Write-Host "`n=== Verbose AI Route Test ===" -ForegroundColor Cyan

# Test health endpoint
Write-Host "`n[TEST] GET /api/ai/health" -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/health" -Method GET -Headers $headers
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Green
} catch {
    Write-Host "   Status Code: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Yellow
    
    try {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
        Write-Host "   Error Body: $errorBody" -ForegroundColor Red
    } catch {
        Write-Host "   Could not read error body" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
