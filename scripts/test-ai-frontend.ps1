# Test AI Frontend Integration
# Navigate to case overview to see AI insights dashboard

$baseUrl = "http://localhost:5173"
$testCaseId = "0782ec41-1250-41c6-9c38-764f1139e8f1"

Write-Host "`n=== Testing AI Frontend Integration ===" -ForegroundColor Cyan
Write-Host "Frontend should be running on: $baseUrl" -ForegroundColor Yellow
Write-Host "Test Case ID: $testCaseId`n" -ForegroundColor Gray

Write-Host "🎯 What to test:" -ForegroundColor White
Write-Host "1. Navigate to: $baseUrl/case/$testCaseId" -ForegroundColor Gray
Write-Host "   → Should see AI Insights section at bottom" -ForegroundColor Gray
Write-Host "   → Should display 6 insights from our API tests" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Open Chat (if available)" -ForegroundColor Gray
Write-Host "   → Should see AI Assistant toggle for mediators" -ForegroundColor Gray
Write-Host "   → AI sidebar should show real-time analysis" -ForegroundColor Gray
Write-Host ""
Write-Host "3. AI Features to verify:" -ForegroundColor Gray
Write-Host "   ✅ Summary cards with key points & agreements" -ForegroundColor Green
Write-Host "   ✅ Tone analysis with intensity levels" -ForegroundColor Green
Write-Host "   ✅ Risk assessments with color-coded levels" -ForegroundColor Green
Write-Host "   ✅ Rephrase suggestions with rationale" -ForegroundColor Green
Write-Host "   ✅ Real-time tone coach in chat sidebar" -ForegroundColor Green
Write-Host ""

# Check if frontend is running
try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Frontend is running!" -ForegroundColor Green
    Write-Host "🚀 Ready to test AI integration" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Frontend not running. Start with:" -ForegroundColor Red
    Write-Host "   cd c:\mediation-app ; npm run dev" -ForegroundColor Gray
}

Write-Host "`n📋 Components Created:" -ForegroundColor White
Write-Host "   • AIInsightsDashboard.jsx - Main insights display" -ForegroundColor Gray
Write-Host "   • ChatAISidebar.jsx - Real-time chat analysis" -ForegroundColor Gray
Write-Host "   • useAI.js - AI operations hook" -ForegroundColor Gray
Write-Host "   • Integrated into CaseOverviewPage and ChatDrawer" -ForegroundColor Gray

Write-Host "`n=== Ready for Phase 4.2: Real-time Integration ===" -ForegroundColor Cyan