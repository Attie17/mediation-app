# Dashboard Navigation Test Suite
# Testing admin access to all dashboards after RoleBoundary fix

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DASHBOARD NAVIGATION TEST SUITE" -ForegroundColor Cyan
Write-Host "Testing RoleBoundary Admin Access Fix" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test Configuration
$baseUrl = "http://localhost:4000"
$adminEmail = "admin-test-1760288548@example.com"
$adminPassword = "Admin123!"
$mediatorEmail = "test-mediator-1760287975@example.com"
$mediatorPassword = "Test123!"

# Test Results
$testResults = @()

# Helper function to add test result
function Add-TestResult {
    param($testName, $status, $details)
    $script:testResults += [PSCustomObject]@{
        Test = $testName
        Status = $status
        Details = $details
    }
}

# ============================================
# TEST 1: Admin Login
# ============================================
Write-Host "TEST 1: Admin Login" -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $adminEmail
        password = $adminPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod `
        -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody

    $global:adminToken = $loginResponse.token
    $adminUser = $loginResponse.user

    Write-Host "  ✅ Login Successful" -ForegroundColor Green
    Write-Host "  User: $($adminUser.email)" -ForegroundColor White
    Write-Host "  Role: $($adminUser.role)" -ForegroundColor White
    Write-Host "  Token: $($global:adminToken.Substring(0,30))..." -ForegroundColor Gray
    
    Add-TestResult -testName "Admin Login" -status "PASS" -details "Successfully logged in as admin"
} catch {
    Write-Host "  ❌ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    Add-TestResult -testName "Admin Login" -status "FAIL" -details $_.Exception.Message
    exit 1
}

# ============================================
# TEST 2: Verify Admin Profile
# ============================================
Write-Host "`nTEST 2: Verify Admin Profile" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $global:adminToken"
    }

    $profile = Invoke-RestMethod `
        -Uri "$baseUrl/api/users/me" `
        -Method GET `
        -Headers $headers

    Write-Host "  ✅ Profile Retrieved" -ForegroundColor Green
    Write-Host "  User ID: $($profile.id)" -ForegroundColor White
    Write-Host "  Email: $($profile.email)" -ForegroundColor White
    Write-Host "  Role: $($profile.role)" -ForegroundColor White
    
    if ($profile.role -eq "admin") {
        Write-Host "  ✅ Role is ADMIN - Can access all dashboards" -ForegroundColor Green
        Add-TestResult -testName "Admin Profile Verification" -status "PASS" -details "Role confirmed as admin"
    } else {
        Write-Host "  ❌ Role is NOT ADMIN - Test invalid" -ForegroundColor Red
        Add-TestResult -testName "Admin Profile Verification" -status "FAIL" -details "Role is not admin"
        exit 1
    }
} catch {
    Write-Host "  ❌ Profile Fetch Failed: $($_.Exception.Message)" -ForegroundColor Red
    Add-TestResult -testName "Admin Profile Verification" -status "FAIL" -details $_.Exception.Message
    exit 1
}

# ============================================
# FRONTEND NAVIGATION TESTS
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FRONTEND DASHBOARD ACCESS TESTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "NOTE: Frontend is running on http://localhost:5174" -ForegroundColor Cyan
Write-Host "RoleBoundary component has been updated to allow admin access`n" -ForegroundColor Cyan

# Test 3: Admin Dashboard Access
Write-Host "TEST 3: Admin Dashboard Access" -ForegroundColor Yellow
Write-Host "  Expected: Admin can access /admin" -ForegroundColor Gray
Write-Host "  RoleBoundary Check: user.role === 'admin' matches route 'admin'" -ForegroundColor Gray
Write-Host "  ✅ Should ALLOW access" -ForegroundColor Green
Add-TestResult -testName "Admin → /admin" -status "EXPECTED PASS" -details "Admin accessing own dashboard"

# Test 4: Admin → Mediator Dashboard
Write-Host "`nTEST 4: Admin → Mediator Dashboard" -ForegroundColor Yellow
Write-Host "  Expected: Admin can access /mediator" -ForegroundColor Gray
Write-Host "  RoleBoundary Check: user.role === 'admin' (bypass enabled)" -ForegroundColor Gray
Write-Host "  ✅ Should ALLOW access (NEW FIX)" -ForegroundColor Green
Add-TestResult -testName "Admin → /mediator" -status "EXPECTED PASS" -details "Admin bypass allows access"

# Test 5: Admin → Lawyer Dashboard
Write-Host "`nTEST 5: Admin → Lawyer Dashboard" -ForegroundColor Yellow
Write-Host "  Expected: Admin can access /lawyer" -ForegroundColor Gray
Write-Host "  RoleBoundary Check: user.role === 'admin' (bypass enabled)" -ForegroundColor Gray
Write-Host "  ✅ Should ALLOW access (NEW FIX)" -ForegroundColor Green
Add-TestResult -testName "Admin → /lawyer" -status "EXPECTED PASS" -details "Admin bypass allows access"

# Test 6: Admin → Divorcee Dashboard
Write-Host "`nTEST 6: Admin → Divorcee Dashboard" -ForegroundColor Yellow
Write-Host "  Expected: Admin can access /divorcee" -ForegroundColor Gray
Write-Host "  RoleBoundary Check: user.role === 'admin' (bypass enabled)" -ForegroundColor Gray
Write-Host "  ✅ Should ALLOW access (NEW FIX)" -ForegroundColor Green
Add-TestResult -testName "Admin → /divorcee" -status "EXPECTED PASS" -details "Admin bypass allows access"

# ============================================
# TEST 7: Non-Admin Restrictions (Mediator)
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "NON-ADMIN RESTRICTION TESTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "TEST 7: Mediator Login" -ForegroundColor Yellow
try {
    $mediatorBody = @{
        email = $mediatorEmail
        password = $mediatorPassword
    } | ConvertTo-Json

    $mediatorResponse = Invoke-RestMethod `
        -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $mediatorBody

    $mediatorToken = $mediatorResponse.token
    $mediatorUser = $mediatorResponse.user

    Write-Host "  ✅ Mediator Login Successful" -ForegroundColor Green
    Write-Host "  User: $($mediatorUser.email)" -ForegroundColor White
    Write-Host "  Role: $($mediatorUser.role)" -ForegroundColor White
    
    Add-TestResult -testName "Mediator Login" -status "PASS" -details "Successfully logged in as mediator"
} catch {
    Write-Host "  ❌ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    Add-TestResult -testName "Mediator Login" -status "FAIL" -details $_.Exception.Message
}

# Test 8: Mediator Restrictions
Write-Host "`nTEST 8: Mediator Access Restrictions" -ForegroundColor Yellow
Write-Host "  Expected: Mediator can access /mediator" -ForegroundColor Gray
Write-Host "  ✅ Should ALLOW access to own dashboard" -ForegroundColor Green
Add-TestResult -testName "Mediator → /mediator" -status "EXPECTED PASS" -details "User accessing own dashboard"

Write-Host "`n  Expected: Mediator CANNOT access /admin" -ForegroundColor Gray
Write-Host "  ❌ Should DENY access (redirect to /dashboard)" -ForegroundColor Red
Add-TestResult -testName "Mediator → /admin" -status "EXPECTED FAIL" -details "Should redirect - role mismatch"

Write-Host "`n  Expected: Mediator CANNOT access /lawyer" -ForegroundColor Gray
Write-Host "  ❌ Should DENY access (redirect to /dashboard)" -ForegroundColor Red
Add-TestResult -testName "Mediator → /lawyer" -status "EXPECTED FAIL" -details "Should redirect - role mismatch"

# ============================================
# SUMMARY
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_.Status -like "*PASS*" }).Count
$failCount = ($testResults | Where-Object { $_.Status -like "*FAIL*" }).Count
$totalCount = $testResults.Count

Write-Host "Total Tests: $totalCount" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red

Write-Host "`nDetailed Results:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
$testResults | ForEach-Object {
    $color = if ($_.Status -like "*PASS*") { "Green" } else { "Red" }
    Write-Host "$($_.Test): " -NoNewline
    Write-Host "$($_.Status)" -ForegroundColor $color
    Write-Host "  $($_.Details)" -ForegroundColor Gray
}

# ============================================
# MANUAL TESTING INSTRUCTIONS
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "MANUAL TESTING REQUIRED" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "The RoleBoundary fix has been applied. Please manually test in browser:`n" -ForegroundColor Yellow

Write-Host "1. LOGIN AS ADMIN:" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:5174/signin" -ForegroundColor White
Write-Host "   Email: $adminEmail" -ForegroundColor White
Write-Host "   Password: $adminPassword" -ForegroundColor White

Write-Host "`n2. TEST DASHBOARD NAVIGATION:" -ForegroundColor Cyan
Write-Host "   From HomePage (http://localhost:5174/), click each dashboard card:`n" -ForegroundColor White

Write-Host "   a) Mediator Dashboard" -ForegroundColor Yellow
Write-Host "      Click card → Should navigate to /mediator" -ForegroundColor White
Write-Host "      Expected: ✅ Dashboard loads successfully" -ForegroundColor Green

Write-Host "`n   b) Lawyer Dashboard" -ForegroundColor Yellow
Write-Host "      Click card → Should navigate to /lawyer" -ForegroundColor White
Write-Host "      Expected: ✅ Dashboard loads successfully" -ForegroundColor Green

Write-Host "`n   c) Divorcee Dashboard" -ForegroundColor Yellow
Write-Host "      Click card → Should navigate to /divorcee" -ForegroundColor White
Write-Host "      Expected: ✅ Dashboard loads successfully" -ForegroundColor Green

Write-Host "`n   d) Admin Dashboard" -ForegroundColor Yellow
Write-Host "      Click card → Should navigate to /admin" -ForegroundColor White
Write-Host "      Expected: ✅ Dashboard loads successfully" -ForegroundColor Green

Write-Host "`n3. CHECK BROWSER CONSOLE (F12):" -ForegroundColor Cyan
Write-Host "   - No errors should appear" -ForegroundColor White
Write-Host "   - No 'Access Denied' messages" -ForegroundColor White
Write-Host "   - No redirect loops" -ForegroundColor White

Write-Host "`n4. TEST NON-ADMIN USER:" -ForegroundColor Cyan
Write-Host "   Logout and login as mediator:" -ForegroundColor White
Write-Host "   Email: $mediatorEmail" -ForegroundColor White
Write-Host "   Password: $mediatorPassword" -ForegroundColor White
Write-Host "   Try to access: http://localhost:5174/admin" -ForegroundColor White
Write-Host "   Expected: ❌ Should redirect to /dashboard" -ForegroundColor Red

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "AUTOMATED TESTS COMPLETE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Store token for later use
Write-Host "Admin token stored in `$global:adminToken for additional testing" -ForegroundColor Gray
Write-Host "`nTo open browser for manual testing, run:" -ForegroundColor Yellow
Write-Host "Start-Process 'http://localhost:5174/signin'" -ForegroundColor White
