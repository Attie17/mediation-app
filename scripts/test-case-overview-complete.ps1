# Comprehensive Case Overview Endpoint Tests
Write-Host "Testing Case Overview Endpoints - Post Migration" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$backend = "http://localhost:4000"
$devEmail = "test@example.com"
$caseShortId = "1"
$caseUUID = "0782ec41-1250-41c6-9c38-764f1139e8f1"

$passCount = 0
$failCount = 0

# Test 1: Health Check
Write-Host "Test 1: Backend Health" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$backend/healthz" -UseBasicParsing
    Write-Host "  ✅ PASS" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  ❌ FAIL: $_" -ForegroundColor Red
    $failCount++
}
Write-Host ""

# Test 2: GET /api/cases/:shortId (integer)
Write-Host "Test 2: GET /api/cases/$caseShortId (Composite with short_id)" -ForegroundColor Yellow
try {
    $headers = @{ "x-dev-email" = $devEmail }
    $response = Invoke-WebRequest -Uri "$backend/api/cases/$caseShortId" -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.ok) {
        Write-Host "  ✅ PASS" -ForegroundColor Green
        Write-Host "    Case ID: $($data.case.id)" -ForegroundColor Gray
        Write-Host "    Short ID: $($data.case.short_id)" -ForegroundColor Gray
        Write-Host "    Status: $($data.case.status)" -ForegroundColor Gray
        Write-Host "    Participants: $($data.participants.Count)" -ForegroundColor Gray
        Write-Host "    Doc Progress: $($data.documents.overallPct)%" -ForegroundColor Gray
        $passCount++
    } else {
        throw "Response not OK"
    }
} catch {
    Write-Host "  ❌ FAIL: $_" -ForegroundColor Red
    $failCount++
}
Write-Host ""

# Test 3: GET /api/cases/:uuid (UUID)
Write-Host "Test 3: GET /api/cases/:uuid (Composite with UUID)" -ForegroundColor Yellow
try {
    $headers = @{ "x-dev-email" = $devEmail }
    $response = Invoke-WebRequest -Uri "$backend/api/cases/$caseUUID" -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.ok) {
        Write-Host "  ✅ PASS" -ForegroundColor Green
        Write-Host "    Case ID: $($data.case.id)" -ForegroundColor Gray
        Write-Host "    Short ID: $($data.case.short_id)" -ForegroundColor Gray
        $passCount++
    } else {
        throw "Response not OK"
    }
} catch {
    Write-Host "  ❌ FAIL: $_" -ForegroundColor Red
    $failCount++
}
Write-Host ""

# Test 4: GET /api/cases/:shortId/activity
Write-Host "Test 4: GET /api/cases/$caseShortId/activity (Activity with short_id)" -ForegroundColor Yellow
try {
    $headers = @{ "x-dev-email" = $devEmail }
    $response = Invoke-WebRequest -Uri "$backend/api/cases/$caseShortId/activity?limit=10" -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.ok) {
        Write-Host "  ✅ PASS" -ForegroundColor Green
        Write-Host "    Items: $($data.items.Count)" -ForegroundColor Gray
        if ($data.items.Count -gt 0) {
            Write-Host "    Latest: $($data.items[0].kind) - $($data.items[0].topic)" -ForegroundColor Gray
        }
        $passCount++
    } else {
        throw "Response not OK"
    }
} catch {
    Write-Host "  ❌ FAIL: $_" -ForegroundColor Red
    $failCount++
}
Write-Host ""

# Test 5: GET /api/cases/:uuid/activity
Write-Host "Test 5: GET /api/cases/:uuid/activity (Activity with UUID)" -ForegroundColor Yellow
try {
    $headers = @{ "x-dev-email" = $devEmail }
    $response = Invoke-WebRequest -Uri "$backend/api/cases/$caseUUID/activity?limit=5" -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.ok) {
        Write-Host "  ✅ PASS" -ForegroundColor Green
        Write-Host "    Items: $($data.items.Count)" -ForegroundColor Gray
        $passCount++
    } else {
        throw "Response not OK"
    }
} catch {
    Write-Host "  ❌ FAIL: $_" -ForegroundColor Red
    $failCount++
}
Write-Host ""

# Test 6: GET /api/cases/:id/activity?type=docs
Write-Host "Test 6: GET /api/cases/$caseShortId/activity?type=docs (Filtered)" -ForegroundColor Yellow
try {
    $headers = @{ "x-dev-email" = $devEmail }
    $response = Invoke-WebRequest -Uri "$backend/api/cases/$caseShortId/activity?type=docs&limit=10" -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.ok) {
        Write-Host "  ✅ PASS" -ForegroundColor Green
        Write-Host "    Doc Activity Items: $($data.items.Count)" -ForegroundColor Gray
        $passCount++
    } else {
        throw "Response not OK"
    }
} catch {
    Write-Host "  ❌ FAIL: $_" -ForegroundColor Red
    $failCount++
}
Write-Host ""

# Test 7: GET /api/cases/:id/events
Write-Host "Test 7: GET /api/cases/$caseShortId/events (Calendar stub)" -ForegroundColor Yellow
try {
    $headers = @{ "x-dev-email" = $devEmail }
    $response = Invoke-WebRequest -Uri "$backend/api/cases/$caseShortId/events" -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.ok) {
        Write-Host "  ✅ PASS" -ForegroundColor Green
        Write-Host "    Upcoming: $($data.upcoming.Count), Past: $($data.past.Count)" -ForegroundColor Gray
        $passCount++
    } else {
        throw "Response not OK"
    }
} catch {
    Write-Host "  ❌ FAIL: $_" -ForegroundColor Red
    $failCount++
}
Write-Host ""

# Summary
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Test Results:" -ForegroundColor Cyan
Write-Host "  ✅ Passed: $passCount" -ForegroundColor Green
Write-Host "  ❌ Failed: $failCount" -ForegroundColor Red
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "All tests passed! 🎉" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed." -ForegroundColor Yellow
    exit 1
}
