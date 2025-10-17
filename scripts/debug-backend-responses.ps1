# Debug script to test backend responses
$base = "http://localhost:4000"

Write-Host "=== Backend Response Debug ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health endpoint
Write-Host "[1] Testing /healthz" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$base/healthz" -Method Get
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  Content-Type: $($response.Headers.'Content-Type')" -ForegroundColor Gray
    Write-Host "  Body: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Register endpoint
Write-Host ""
Write-Host "[2] Testing /api/auth/register" -ForegroundColor Yellow
try {
    $body = @{ email = "debug-$(Get-Random)@test.com"; password = "Test123!"; name = "Debug User"; role = "divorcee" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType "application/json" -Body $body
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  Content-Type: $($response.Headers.'Content-Type')" -ForegroundColor Gray
    Write-Host "  Body length: $($response.Content.Length) chars" -ForegroundColor Gray
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  Has token: $($null -ne $data.token)" -ForegroundColor Gray
    Write-Host "  Token preview: $($data.token.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "  Response body: $responseBody" -ForegroundColor Red
    }
}

# Test 3: Login endpoint (will fail - user doesn't exist, but we can see response format)
Write-Host ""
Write-Host "[3] Testing /api/auth/login (expect failure)" -ForegroundColor Yellow
try {
    $body = @{ email = "nonexistent@test.com"; password = "wrong" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body $body
    Write-Host "  Unexpected success" -ForegroundColor Red
} catch {
    Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Gray
    Write-Host "  Content-Type: $($_.Exception.Response.ContentType)" -ForegroundColor Gray
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "  Body: $responseBody" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Debug Complete ===" -ForegroundColor Cyan
