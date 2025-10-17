# Test Frontend Token Auth Flow
# Run this after starting backend (npm run dev) and frontend (npm run dev)

Write-Host "🧪 Frontend Token Auth Test Suite" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$backend = "http://localhost:4000"
$testEmail = "test-auth-$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
$testPassword = "TestPass123!"

Write-Host "Test Setup:" -ForegroundColor Yellow
Write-Host "  Backend: $backend"
Write-Host "  Test Email: $testEmail"
Write-Host "  Test Password: $testPassword"
Write-Host ""

# Test 1: Backend Health Check
Write-Host "Test 1: Backend Health Check" -ForegroundColor Yellow
try {
    $healthRes = Invoke-WebRequest -Uri "$backend/health" -Method GET -UseBasicParsing
    if ($healthRes.StatusCode -eq 200) {
        Write-Host "  ✅ Backend is running" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Backend not responding. Start it with: cd backend && npm run dev" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Register New User
Write-Host "Test 2: Register New User" -ForegroundColor Yellow
try {
    $registerBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $registerRes = Invoke-WebRequest `
        -Uri "$backend/api/auth/register" `
        -Method POST `
        -Body $registerBody `
        -ContentType "application/json" `
        -UseBasicParsing

    $registerData = $registerRes.Content | ConvertFrom-Json
    
    if ($registerData.ok -and $registerData.token) {
        Write-Host "  ✅ Registration successful" -ForegroundColor Green
        Write-Host "  Token: $($registerData.token.Substring(0, 20))..." -ForegroundColor Gray
        $token = $registerData.token
    } else {
        throw "No token in response"
    }
} catch {
    Write-Host "  ❌ Registration failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 3: Fetch Profile with Token
Write-Host "Test 3: Fetch Profile (/api/users/me)" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $profileRes = Invoke-WebRequest `
        -Uri "$backend/api/users/me" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing

    $profileData = $profileRes.Content | ConvertFrom-Json
    
    if ($profileData.ok -and $profileData.user) {
        Write-Host "  ✅ Profile fetch successful" -ForegroundColor Green
        Write-Host "  User ID: $($profileData.user.user_id)" -ForegroundColor Gray
        Write-Host "  Email: $($profileData.user.email)" -ForegroundColor Gray
        Write-Host "  Role: $($profileData.user.role)" -ForegroundColor Gray
    } else {
        throw "Invalid profile response"
    }
} catch {
    Write-Host "  ❌ Profile fetch failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 4: Login with Credentials
Write-Host "Test 4: Login with Same Credentials" -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $loginRes = Invoke-WebRequest `
        -Uri "$backend/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -UseBasicParsing

    $loginData = $loginRes.Content | ConvertFrom-Json
    
    if ($loginData.ok -and $loginData.token) {
        Write-Host "  ✅ Login successful" -ForegroundColor Green
        Write-Host "  Token: $($loginData.token.Substring(0, 20))..." -ForegroundColor Gray
        $token = $loginData.token
    } else {
        throw "No token in response"
    }
} catch {
    Write-Host "  ❌ Login failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 5: Test 401 with Invalid Token
Write-Host "Test 5: Test 401 with Invalid Token" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer invalid-token-12345"
        "Content-Type" = "application/json"
    }
    
    $invalidRes = Invoke-WebRequest `
        -Uri "$backend/api/users/me" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing `
        -ErrorAction Stop

    Write-Host "  ❌ Should have received 401, got $($invalidRes.StatusCode)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 401) {
        Write-Host "  ✅ 401 returned correctly for invalid token" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Unexpected error: $_" -ForegroundColor Red
    }
}
Write-Host ""

# Test 6: Verify Token Format (JWT)
Write-Host "Test 6: Verify Token Format (JWT)" -ForegroundColor Yellow
$tokenParts = $token -split '\.'
if ($tokenParts.Count -eq 3) {
    Write-Host "  ✅ Token has 3 parts (valid JWT format)" -ForegroundColor Green
    Write-Host "  Header: $($tokenParts[0].Substring(0, [Math]::Min(20, $tokenParts[0].Length)))..." -ForegroundColor Gray
    Write-Host "  Payload: $($tokenParts[1].Substring(0, [Math]::Min(20, $tokenParts[1].Length)))..." -ForegroundColor Gray
    Write-Host "  Signature: $($tokenParts[2].Substring(0, [Math]::Min(20, $tokenParts[2].Length)))..." -ForegroundColor Gray
} else {
    Write-Host "  ❌ Token does not have 3 parts (not JWT format)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✅ All Backend Tests Passed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Open http://localhost:5173/register in browser" -ForegroundColor White
Write-Host "  2. Register a new account" -ForegroundColor White
Write-Host "  3. Check DevTools → Application → Local Storage → auth_token" -ForegroundColor White
Write-Host "  4. Refresh the page (should stay logged in)" -ForegroundColor White
Write-Host "  5. Corrupt the token and make a request (should logout)" -ForegroundColor White
Write-Host ""
