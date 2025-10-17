# Test AI API Endpoints
# NOTE: You must set OPENAI_API_KEY in backend/.env before running these tests

$baseUrl = "http://localhost:4000"
$testCaseId = "0782ec41-1250-41c6-9c38-764f1139e8f1"

# Dev auth headers (mediator)
$headers = @{
    "Content-Type" = "application/json"
    "x-dev-email" = "mediator@example.com"
    "x-dev-role" = "mediator"
    "x-dev-user-id" = "11111111-2222-3333-4444-555555555555"
}

Write-Host "`n=== Testing AI API Endpoints ===" -ForegroundColor Cyan
Write-Host "NOTE: These tests will make real OpenAI API calls and consume tokens!" -ForegroundColor Yellow
Write-Host "Make sure OPENAI_API_KEY is set in backend/.env`n" -ForegroundColor Yellow

# Test 1: Health Check
Write-Host "[TEST 1] GET /api/ai/health - Check AI service health" -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/health" -Method GET -Headers $headers
    if ($response.ok) {
        Write-Host "   ✅ AI service is healthy" -ForegroundColor Green
        Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ AI service unhealthy: $($response.error.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Summarize Text
Write-Host "`n[TEST 2] POST /api/ai/summarize - Summarize chat transcript" -ForegroundColor White
$sampleTranscript = @"
[Mediator]: Good morning. I'd like to start today's session by reviewing the progress we've made on the child custody arrangement.

[Party A]: I appreciate that. I think we've made good progress, but I'm still concerned about the holiday schedule.

[Party B]: I agree with Party A. The holidays are important to both of us, and we need to find a fair solution.

[Mediator]: That's a valid concern. Let's discuss the holiday schedule in more detail and see if we can find a compromise that works for both of you.

[Party A]: I'd like to have the children for Christmas this year since Party B had them last year.

[Party B]: I understand that, but Christmas is really important to my family tradition. Could we alternate years instead?

[Mediator]: That sounds like a reasonable approach. Let's explore alternating years for major holidays.
"@

try {
    $body = @{
        text = $sampleTranscript
        context = "chat transcript"
        case_id = $testCaseId
        save = $true
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/summarize" -Method POST -Headers $headers -Body $body
    
    if ($response.ok) {
        Write-Host "   ✅ Summary generated successfully" -ForegroundColor Green
        Write-Host "   Insight ID: $($response.data.insight_id)" -ForegroundColor Gray
        Write-Host "   Summary: $($response.data.summary.summary)" -ForegroundColor Cyan
        if ($response.data.summary.agreements) {
            Write-Host "   Agreements: $($response.data.summary.agreements.Count)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ❌ Failed: $($response.error.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorDetail = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error: $($errorDetail.error.message)" -ForegroundColor Red
    }
}

# Test 3: Analyze Tone
Write-Host "`n[TEST 3] POST /api/ai/analyze-tone - Analyze emotional tone" -ForegroundColor White
$sampleMessage = "I'm really frustrated that you're not being flexible about this. We agreed to work together, but you keep changing your mind!"

try {
    $body = @{
        text = $sampleMessage
        speaker = "Party A"
        case_id = $testCaseId
        save = $true
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/analyze-tone" -Method POST -Headers $headers -Body $body
    
    if ($response.ok) {
        Write-Host "   ✅ Tone analysis completed" -ForegroundColor Green
        Write-Host "   Tone: $($response.data.analysis.tone)" -ForegroundColor Cyan
        Write-Host "   Intensity: $($response.data.analysis.intensity)/10" -ForegroundColor Gray
        if ($response.data.analysis.concerns -and $response.data.analysis.concerns.Count -gt 0) {
            Write-Host "   Concerns: $($response.data.analysis.concerns -join ', ')" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ Failed: $($response.error.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Suggest Rephrase
Write-Host "`n[TEST 4] POST /api/ai/suggest-rephrase - Suggest neutral rephrasing" -ForegroundColor White
$mediatorMessage = "You need to be more reasonable about this. This is getting ridiculous."

try {
    $body = @{
        message = $mediatorMessage
        concern = "potentially confrontational"
        case_id = $testCaseId
        save = $false
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/suggest-rephrase" -Method POST -Headers $headers -Body $body
    
    if ($response.ok) {
        Write-Host "   ✅ Rephrase suggestion generated" -ForegroundColor Green
        Write-Host "   Original: $($response.data.suggestion.original)" -ForegroundColor Gray
        Write-Host "   Suggested: $($response.data.suggestion.suggested)" -ForegroundColor Cyan
        Write-Host "   Rationale: $($response.data.suggestion.rationale)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Failed: $($response.error.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Assess Risk
Write-Host "`n[TEST 5] POST /api/ai/assess-risk - Assess escalation risk" -ForegroundColor White
$riskConversation = @"
[Party A]: This is absolutely unacceptable! You're trying to manipulate the situation.
[Party B]: How dare you accuse me of that! You're the one who's being unreasonable.
[Party A]: I'm done trying to work with you on this. We'll let the lawyers handle it.
[Party B]: Fine by me! This mediation is a waste of time anyway.
"@

try {
    $body = @{
        conversation_text = $riskConversation
        case_id = $testCaseId
        save = $true
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/assess-risk" -Method POST -Headers $headers -Body $body
    
    if ($response.ok) {
        Write-Host "   ✅ Risk assessment completed" -ForegroundColor Green
        Write-Host "   Risk Level: $($response.data.assessment.risk_level)" -ForegroundColor $(
            switch ($response.data.assessment.risk_level) {
                "low" { "Green" }
                "medium" { "Yellow" }
                "high" { "Red" }
                "critical" { "Red" }
                default { "Gray" }
            }
        )
        Write-Host "   Risk Score: $($response.data.assessment.risk_score)/10" -ForegroundColor Gray
        if ($response.data.assessment.recommendations) {
            Write-Host "   Recommendations: $($response.data.assessment.recommendations.Count)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   ❌ Failed: $($response.error.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Get Insights
Write-Host "`n[TEST 6] GET /api/ai/insights/:caseId - Fetch AI insights for case" -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai/insights/$testCaseId" -Method GET -Headers $headers
    
    if ($response.ok) {
        Write-Host "   ✅ Fetched insights successfully" -ForegroundColor Green
        Write-Host "   Total insights: $($response.data.count)" -ForegroundColor Cyan
        
        if ($response.data.insights.Count -gt 0) {
            Write-Host "`n   Recent insights:" -ForegroundColor Gray
            $response.data.insights | Select-Object -First 3 | ForEach-Object {
                Write-Host "   - $($_.insight_type) (ID: $($_.id.Substring(0,8))...)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "   ❌ Failed: $($response.error.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Delete Insight (optional - delete the first one we created)
Write-Host "`n[TEST 7] DELETE /api/ai/insights/:id - Delete an insight (optional)" -ForegroundColor White
Write-Host "   Skipping delete test to preserve test data" -ForegroundColor Gray

Write-Host "`n=== AI API Tests Complete ===" -ForegroundColor Cyan
Write-Host "Note: Check backend/.env to ensure OPENAI_API_KEY is set" -ForegroundColor Yellow
