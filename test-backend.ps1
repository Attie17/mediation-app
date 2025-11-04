# Test Backend Health
# Run this script after adding environment variables to Render

Write-Host "Testing Backend Health..." -ForegroundColor Yellow
Write-Host ""

$backendUrl = "https://mediation-app.onrender.com"

# Test 1: Health Check
Write-Host "1. Testing /healthz endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/healthz" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Health check passed!" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Root Endpoint
Write-Host "2. Testing / endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Root endpoint passed!" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Root endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Register Test User
Write-Host "3. Testing user registration..." -ForegroundColor Cyan
$registerBody = @{
    email = "test-$(Get-Random -Minimum 1000 -Maximum 9999)@test.com"
    password = "Test123!"
    full_name = "Test User"
    role = "divorcee"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "   ✅ Registration passed!" -ForegroundColor Green
    Write-Host "   User ID: $($response.user.id)" -ForegroundColor Gray
    Write-Host "   Email: $($response.user.email)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "Test Complete!" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow
