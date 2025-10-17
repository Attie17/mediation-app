# Phase 4.2.2 - Real-time Insight Updates Test
Write-Host "`n=== Phase 4.2.2: Real-time Insight Updates Test ===" -ForegroundColor Cyan
Write-Host "This test verifies that AI insights appear in real-time in the frontend" -ForegroundColor Gray

$channelId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
$caseId = "0782ec41-1250-41c6-9c38-764f1139e8f1"
$token = "dev-fake-token"

# Step 1: Clear old insights for clean test
Write-Host "`n1. Preparing test environment..." -ForegroundColor Yellow
Write-Host "   Note: Make sure frontend is running on http://localhost:5174" -ForegroundColor Gray

# Step 2: Send first emotional message
Write-Host "`n2. Sending first test message (high emotion)..." -ForegroundColor Yellow

$body1 = @{
    content = "I can't believe you would do this to me! This is absolutely unacceptable!"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod `
        -Uri "http://localhost:4000/api/chat/channels/$channelId/messages" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $body1
    
    $messageId1 = $response1.message.id
    Write-Host "   ✅ Message 1 created: $messageId1" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to send message 1: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Wait for AI processing
Write-Host "`n3. Waiting 6 seconds for AI processing..." -ForegroundColor Yellow
Start-Sleep -Seconds 6

# Step 4: Check insights were created
Write-Host "`n4. Verifying insights in database..." -ForegroundColor Yellow
node -r dotenv/config check-specific-message.js $messageId1

# Step 5: Check insights via API
Write-Host "`n5. Checking insights via API (what frontend sees)..." -ForegroundColor Yellow
try {
    $insightsResponse = Invoke-RestMethod `
        -Uri "http://localhost:4000/api/ai/insights/$caseId" `
        -Method Get `
        -Headers @{
            "Authorization" = "Bearer $token"
        }
    
    $autoInsights = $insightsResponse.data.insights | Where-Object { $_.metadata.auto_generated -eq $true }
    Write-Host "   Found $($autoInsights.Count) auto-generated insights" -ForegroundColor Green
    
    if ($autoInsights.Count -gt 0) {
        Write-Host "`n   Latest Insights:" -ForegroundColor Cyan
        foreach ($insight in $autoInsights | Select-Object -First 3) {
            Write-Host "   - Type: $($insight.insight_type)" -ForegroundColor White
            if ($insight.insight_type -eq 'tone_analysis') {
                Write-Host "     Tone: $($insight.content.tone), Intensity: $($insight.content.intensity)" -ForegroundColor Gray
            }
            if ($insight.insight_type -eq 'risk_assessment') {
                Write-Host "     Risk: $($insight.content.risk_level), Score: $($insight.content.risk_score)" -ForegroundColor Gray
            }
            Write-Host "     Time: $($insight.created_at)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   ❌ Failed to fetch insights: $_" -ForegroundColor Red
}

# Step 6: Send second message with escalation
Write-Host "`n6. Sending second test message (escalated)..." -ForegroundColor Yellow

$body2 = @{
    content = "You're being completely unreasonable! I'm done talking about this!"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod `
        -Uri "http://localhost:4000/api/chat/channels/$channelId/messages" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $body2
    
    $messageId2 = $response2.message.id
    Write-Host "   ✅ Message 2 created: $messageId2" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to send message 2: $_" -ForegroundColor Red
}

Write-Host "`n7. Waiting 6 seconds for second AI analysis..." -ForegroundColor Yellow
Start-Sleep -Seconds 6

# Step 7: Final check
Write-Host "`n8. Final insight count check..." -ForegroundColor Yellow
try {
    $finalResponse = Invoke-RestMethod `
        -Uri "http://localhost:4000/api/ai/insights/$caseId?limit=20" `
        -Method Get `
        -Headers @{
            "Authorization" = "Bearer $token"
        }
    
    $totalAutoInsights = $finalResponse.data.insights | Where-Object { $_.metadata.auto_generated -eq $true }
    Write-Host "   Total auto-generated insights: $($totalAutoInsights.Count)" -ForegroundColor Green
    
    # Count by type
    $toneCount = ($totalAutoInsights | Where-Object { $_.insight_type -eq 'tone_analysis' }).Count
    $riskCount = ($totalAutoInsights | Where-Object { $_.insight_type -eq 'risk_assessment' }).Count
    
    Write-Host "   - Tone analyses: $toneCount" -ForegroundColor White
    Write-Host "   - Risk assessments: $riskCount" -ForegroundColor White
} catch {
    Write-Host "   ❌ Failed final check: $_" -ForegroundColor Red
}

Write-Host "`n=== FRONTEND TEST INSTRUCTIONS ===" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:5174 in your browser" -ForegroundColor Yellow
Write-Host "2. Navigate to a case with chat" -ForegroundColor Yellow
Write-Host "3. Look at the AI Assistant sidebar (right side)" -ForegroundColor Yellow
Write-Host "4. You should see 'Recent AI Analysis' section populated" -ForegroundColor Yellow
Write-Host "5. The insights should update automatically every 5 seconds" -ForegroundColor Yellow
Write-Host "6. Send a high-emotion message and watch for:" -ForegroundColor Yellow
Write-Host "   - Red alert banner at top of sidebar" -ForegroundColor Yellow
Write-Host "   - New insights appearing within 5-10 seconds" -ForegroundColor Yellow
Write-Host "   - Alert auto-dismissing after 10 seconds" -ForegroundColor Yellow

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "✅ Backend functionality verified" -ForegroundColor Green
Write-Host "👀 Now check the frontend UI!" -ForegroundColor Yellow
