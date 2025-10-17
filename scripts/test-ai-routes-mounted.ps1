# Simple test to verify AI routes are mounted (no OpenAI key required)

$baseUrl = "http://localhost:4000"

# Dev auth headers
$headers = @{
    "Content-Type" = "application/json"
    "x-dev-email" = "mediator@example.com"
    "x-dev-role" = "mediator"
    "x-dev-user-id" = "11111111-2222-3333-4444-555555555555"
}

Write-Host "`n=== Testing AI Routes (Route Mounting Check) ===" -ForegroundColor Cyan

# Test: Health endpoint (will fail if no API key, but route should exist)
Write-Host "`n[TEST] GET /api/ai/health - Check if route exists" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/ai/health" -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "   ✅ Route exists - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 503) {
        Write-Host "   ✅ Route exists (503 = AI service unavailable, which is expected without API key)" -ForegroundColor Green
    } elseif ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   ❌ Route not found (404) - Routes may not be mounted" -ForegroundColor Red
    } else {
        Write-Host "   ⚠️  Route exists but returned: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# Test: Summarize endpoint with validation (should fail with 400 for missing text)
Write-Host "`n[TEST] POST /api/ai/summarize - Check validation" -ForegroundColor White
try {
    $body = @{
        case_id = "0782ec41-1250-41c6-9c38-764f1139e8f1"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/ai/summarize" -Method POST -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "   ❌ Should have failed validation" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ✅ Validation working (400 = TEXT_REQUIRED)" -ForegroundColor Green
    } elseif ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   ❌ Route not found (404)" -ForegroundColor Red
    } else {
        Write-Host "   ⚠️  Unexpected status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Route Mounting Check Complete ===" -ForegroundColor Cyan
Write-Host "`nTo run full AI tests with OpenAI:" -ForegroundColor Yellow
Write-Host "1. Get an OpenAI API key from https://platform.openai.com/api-keys" -ForegroundColor Gray
Write-Host "2. Add it to backend/.env: OPENAI_API_KEY=sk-..." -ForegroundColor Gray
Write-Host "3. Run: .\scripts\test-ai-endpoints.ps1" -ForegroundColor Gray
