# Test frontend token flow end-to-end
$base = "http://localhost:4000"
$testEmail = "e2e-test-$(Get-Random -Maximum 9999)@example.com"
$testPassword = "TestPass123!"
$testName = "E2E Test User"

Write-Host ""
Write-Host "=== Frontend Token Flow E2E Test ===" -ForegroundColor Cyan
Write-Host "Test user: $testEmail" -ForegroundColor Gray
Write-Host ""

# 1. Health check
Write-Host "[1/6] Health check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$base/healthz" -Method Get
    if ($health.ok) {
        Write-Host "  OK Backend is healthy" -ForegroundColor Green
    } else {
        Write-Host "  FAIL Backend health check failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  FAIL Backend not running on port 4000" -ForegroundColor Red
    Write-Host "    Run: npm run dev --prefix backend" -ForegroundColor Gray
    exit 1
}

# 2. Register new user
Write-Host ""
Write-Host "[2/6] Register new user..." -ForegroundColor Yellow
try {
    $registerBody = @{
        email = $testEmail
        password = $testPassword
        name = $testName
        role = "divorcee"
    } | ConvertTo-Json -Compress

    $registerResp = Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType "application/json" -Body $registerBody

    if ($registerResp.ok -and $registerResp.token) {
        $token = $registerResp.token
        $userId = $registerResp.userId
        Write-Host "  OK Registration successful" -ForegroundColor Green
        Write-Host "    Token: $($token.Substring(0,20))..." -ForegroundColor Gray
        Write-Host "    User ID: $userId" -ForegroundColor Gray
    } else {
        Write-Host "  FAIL Registration failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  FAIL Registration error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Fetch profile with token
Write-Host ""
Write-Host "[3/6] Fetch profile with token..." -ForegroundColor Yellow
try {
    $profileResp = Invoke-RestMethod -Uri "$base/api/users/me" -Method Get -Headers @{ Authorization = "Bearer $token" }

    if ($profileResp.ok -and $profileResp.user) {
        $user = $profileResp.user
        Write-Host "  OK Profile fetched" -ForegroundColor Green
        Write-Host "    Name: $($user.name)" -ForegroundColor Gray
        Write-Host "    Email: $($user.email)" -ForegroundColor Gray
        Write-Host "    Role: $($user.role)" -ForegroundColor Gray
    } else {
        Write-Host "  FAIL Profile fetch failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  FAIL Profile fetch error" -ForegroundColor Red
    exit 1
}

# 4. Update profile
Write-Host ""
Write-Host "[4/6] Update profile..." -ForegroundColor Yellow
try {
    $updateBody = @{ preferredName = "E2E Tester"; phone = "+1-555-0123" } | ConvertTo-Json -Compress
    $updateResp = Invoke-RestMethod -Uri "$base/api/users/me" -Method Put -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body $updateBody

    if ($updateResp.ok) {
        Write-Host "  OK Profile updated" -ForegroundColor Green
        Write-Host "    Preferred name: $($updateResp.user.preferred_name)" -ForegroundColor Gray
        Write-Host "    Phone: $($updateResp.user.phone)" -ForegroundColor Gray
    } else {
        Write-Host "  FAIL Profile update failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  FAIL Update error" -ForegroundColor Red
    exit 1
}

# 5. Login with credentials
Write-Host ""
Write-Host "[5/6] Login with credentials..." -ForegroundColor Yellow
try {
    $loginBody = @{ email = $testEmail; password = $testPassword } | ConvertTo-Json -Compress
    $loginResp = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody

    if ($loginResp.ok -and $loginResp.token) {
        Write-Host "  OK Login successful" -ForegroundColor Green
        Write-Host "    New token: $($loginResp.token.Substring(0,20))..." -ForegroundColor Gray
    } else {
        Write-Host "  FAIL Login failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  FAIL Login error" -ForegroundColor Red
    exit 1
}

# 6. Test 401
Write-Host ""
Write-Host "[6/6] Test 401 with invalid token..." -ForegroundColor Yellow
try {
    $badToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"
    Invoke-RestMethod -Uri "$base/api/users/me" -Method Get -Headers @{ Authorization = "Bearer $badToken" } -ErrorAction Stop
    Write-Host "  FAIL Should have returned 401" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "  OK 401 returned as expected" -ForegroundColor Green
    } else {
        Write-Host "  FAIL Unexpected error" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=== All Tests Passed ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Test in browser UI at http://localhost:5173/register" -ForegroundColor Yellow
Write-Host ""
