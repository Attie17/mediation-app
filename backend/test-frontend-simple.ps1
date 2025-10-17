# Frontend Functionality Test - Simple Version
Write-Host "`n=== Frontend AI Sidebar Functionality Test ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:4000"
$token = "dev-fake-token"
$caseId = "0782ec41-1250-41c6-9c38-764f1139e8f1"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 1: Backend Health
Write-Host "`n1. Testing backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/ai/health" -Headers $headers
    Write-Host "   OK - Backend is healthy" -ForegroundColor Green
} catch {
    Write-Host "   FAILED - Backend not responding" -ForegroundColor Red
    exit 1
}

# Test 2: Fetch AI Insights
Write-Host "`n2. Fetching AI insights..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/insights/${caseId}?limit=10" -Headers $headers
    
    $insights = $response.data.insights
    $autoInsights = $insights | Where-Object { $_.metadata.auto_generated -eq $true }
    
    Write-Host "   OK - Found $($autoInsights.Count) auto-generated insights" -ForegroundColor Green
    
    if ($autoInsights.Count -gt 0) {
        Write-Host "`n   Recent insights:" -ForegroundColor Cyan
        foreach ($insight in $autoInsights | Select-Object -First 3) {
            Write-Host "   - Type: $($insight.insight_type)" -ForegroundColor White
            if ($insight.insight_type -eq "tone_analysis") {
                Write-Host "     Tone: $($insight.content.tone), Intensity: $($insight.content.intensity)" -ForegroundColor Gray
            }
            if ($insight.insight_type -eq "risk_assessment") {
                Write-Host "     Risk: $($insight.content.risk_level), Score: $($insight.content.risk_score)" -ForegroundColor Gray
            }
        }
    }
} catch {
    Write-Host "   FAILED - Could not fetch insights" -ForegroundColor Red
}

# Test 3: Check for high-risk
Write-Host "`n3. Checking for high-risk insights..." -ForegroundColor Yellow
$highRisk = $autoInsights | Where-Object { 
    $_.insight_type -eq "risk_assessment" -and 
    ($_.content.risk_level -eq "high" -or $_.content.risk_level -eq "critical")
}

if ($highRisk.Count -gt 0) {
    Write-Host "   ALERT - Found $($highRisk.Count) high-risk insight(s)" -ForegroundColor Red
    Write-Host "   Frontend should show RED ALERT BANNER" -ForegroundColor Red
} else {
    Write-Host "   OK - No high-risk insights currently" -ForegroundColor Green
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Backend Status: ONLINE" -ForegroundColor Green
Write-Host "AI Insights: $($autoInsights.Count) auto-generated" -ForegroundColor Green
Write-Host "High-Risk Alerts: $($highRisk.Count)" -ForegroundColor $(if ($highRisk.Count -gt 0) { "Red" } else { "Green" })

Write-Host "`n=== What Frontend Should Show ===" -ForegroundColor Cyan
Write-Host "1. AI Assistant sidebar (right side, 320px wide)" -ForegroundColor White
Write-Host "2. Recent AI Analysis section with $($autoInsights.Count) insight cards" -ForegroundColor White
Write-Host "3. Auto-refresh every 5 seconds" -ForegroundColor White
if ($highRisk.Count -gt 0) {
    Write-Host "4. RED ALERT BANNER at top (high risk detected!)" -ForegroundColor Red
}

Write-Host "`nTest Complete!" -ForegroundColor Green
