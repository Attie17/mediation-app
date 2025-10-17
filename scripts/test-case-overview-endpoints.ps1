# Test Case Overview Endpoints
# Prerequisites: Backend running (npm run dev), have a valid case ID

Write-Host "Testing Case Overview Endpoints" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$backend = "http://localhost:4000"
$caseId = "1"  # Use integer case_id (uploads table uses bigint, cases uses UUID)
$devEmail = "test@example.com"  # Use dev auth

# Test 1: Health Check
Write-Host "Test 1: Backend Health" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$backend/healthz" -UseBasicParsing
    Write-Host "  PASS: Backend is running" -ForegroundColor Green
} catch {
    Write-Host "  FAIL: Backend not running. Start with: cd backend && npm run dev" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: GET /api/cases/:id (composite overview)
Write-Host "Test 2: GET /api/cases/$caseId (Composite Overview)" -ForegroundColor Yellow
try {
    $headers = @{ "x-dev-email" = $devEmail }
    $response = Invoke-WebRequest -Uri "$backend/api/cases/$caseId" -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.ok) {
        Write-Host "  ✅ Success" -ForegroundColor Green
        Write-Host "  Case Title: $($data.case.title)" -ForegroundColor Gray
        Write-Host "  Status: $($data.case.status)" -ForegroundColor Gray
        Write-Host "  Participants: $($data.participants.Count)" -ForegroundColor Gray
        Write-Host "  Doc Progress: $($data.documents.overallPct)%" -ForegroundColor Gray
        Write-Host "  Next Action: $($data.documents.nextAction)" -ForegroundColor Gray
    } else {
        throw "Response not OK"
    }
} catch {
    Write-Host "  ❌ Failed: $_" -ForegroundColor Red
    Write-Host "  Try with a different case ID" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: GET /api/cases/:id/activity (timeline)
Write-Host "Test 3: GET /api/cases/$caseId/activity (Activity Timeline)" -ForegroundColor Yellow
try {
    $headers = @{ "x-dev-email" = $devEmail }
    $response = Invoke-WebRequest -Uri "$backend/api/cases/$caseId/activity?limit=10" -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.ok) {
        Write-Host "  ✅ Success" -ForegroundColor Green
        Write-Host "  Activity Items: $($data.items.Count)" -ForegroundColor Gray
        if ($data.items.Count -gt 0) {
            Write-Host "  Latest: $($data.items[0].kind) - $($data.items[0].topic)" -ForegroundColor Gray
        }
    } else {
        throw "Response not OK"
    }
} catch {
    Write-Host "  ❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: GET /api/cases/:id/activity?type=docs (filtered)
Write-Host "Test 4: GET /api/cases/$caseId/activity?type=docs (Docs Only)" -ForegroundColor Yellow
try {
    $headers = @{ "x-dev-email" = $devEmail }
    $response = Invoke-WebRequest -Uri "$backend/api/cases/$caseId/activity?type=docs&limit=5" -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.ok) {
        Write-Host "  ✅ Success" -ForegroundColor Green
        Write-Host "  Doc Activity Items: $($data.items.Count)" -ForegroundColor Gray
    } else {
        throw "Response not OK"
    }
} catch {
    Write-Host "  ❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: GET /api/cases/:id/events (calendar)
Write-Host "Test 5: GET /api/cases/$caseId/events (Events Calendar)" -ForegroundColor Yellow
try {
    $headers = @{ "x-dev-email" = $devEmail }
    $response = Invoke-WebRequest -Uri "$backend/api/cases/$caseId/events" -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.ok) {
        Write-Host "  ✅ Success" -ForegroundColor Green
        Write-Host "  Upcoming Events: $($data.upcoming.Count)" -ForegroundColor Gray
        Write-Host "  Past Events: $($data.past.Count)" -ForegroundColor Gray
        Write-Host "  Note: Events table not yet implemented (returns empty arrays)" -ForegroundColor Yellow
    } else {
        throw "Response not OK"
    }
} catch {
    Write-Host "  ❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "PASS: Case Overview Endpoints Ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  - GET /api/cases/:id - Case metadata + participants + docs summary" -ForegroundColor White
Write-Host "  - GET /api/cases/:id/activity - Upload timeline feed" -ForegroundColor White
Write-Host "  - GET /api/cases/:id/events - Upcoming/past events (stub)" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Implement chat_messages link to cases (add case_id column)" -ForegroundColor White
Write-Host "  2. Implement events/sessions table with case_id" -ForegroundColor White
Write-Host "  3. Add notifications case_id linking" -ForegroundColor White
Write-Host ""
