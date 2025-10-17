# Test automatic AI analysis with valid UUIDs
$channelId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
$caseId = "0782ec41-1250-41c6-9c38-764f1139e8f1"
$uri = "http://localhost:4000/api/chat/channels/$channelId/messages"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer dev-fake-token-123"
    "x-dev-email" = "dev@example.com"
    "x-dev-user-id" = "01234567-89ab-cdef-0123-456789abcdef"
    "x-dev-role" = "mediator"
}

$body = @{
    content = "I can't believe they're being so unreasonable! This is getting really frustrating and I don't think we can work this out."
    case_id = $caseId
} | ConvertTo-Json

Write-Host "🧪 Testing automatic AI analysis on chat message..."
Write-Host "📝 Creating message with emotional content..."

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "✅ Message created successfully:"
    Write-Host "   ID: $($response.message.id)"
    Write-Host "   Content: $($response.message.content.Substring(0, 50))..."
    
    Write-Host "⏳ Waiting 8 seconds for AI analysis to complete..."
    Start-Sleep 8
    
    # Check for AI insights
    Write-Host "🔍 Checking for AI insights..."
    $insightsUri = "http://localhost:4000/api/ai/insights/$caseId"
    $insightsHeaders = @{
        "Authorization" = "Bearer dev-fake-token-123"
        "x-dev-email" = "dev@example.com"
        "x-dev-user-id" = "01234567-89ab-cdef-0123-456789abcdef"
        "x-dev-role" = "mediator"
    }
    
    $insights = Invoke-RestMethod -Uri $insightsUri -Method Get -Headers $insightsHeaders -ErrorAction Stop
    Write-Host "📊 Total insights found: $($insights.insights.Count)"
    
    # Look for insights auto-generated for this message
    $messageTime = [DateTime]::Parse($response.message.created_at)
    $autoInsights = @()
    
    foreach ($insight in $insights.insights) {
        if ($insight.metadata.auto_generated -eq $true -and $insight.metadata.message_id -eq $response.message.id) {
            $autoInsights += $insight
        }
    }
    
    Write-Host "🤖 Auto-generated insights for this message: $($autoInsights.Count)"
    
    $hasTone = $false
    $hasRisk = $false
    
    foreach ($insight in $autoInsights) {
        Write-Host "  • $($insight.insight_type.ToUpper())"
        if ($insight.insight_type -eq "tone_analysis") {
            $hasTone = $true
            Write-Host "    - Emotional tone: $($insight.content.emotional_tone)"
            Write-Host "    - Intensity: $($insight.content.intensity)/10"
        }
        if ($insight.insight_type -eq "risk_assessment") {
            $hasRisk = $true  
            Write-Host "    - Risk level: $($insight.content.risk_level)"
            Write-Host "    - Confidence: $($insight.content.confidence)"
        }
    }
    
    Write-Host "`n🎯 Test Results:"
    Write-Host "  ✅ Message created successfully"
    if ($hasTone) { Write-Host "  ✅ Tone analysis generated" } else { Write-Host "  ❌ Tone analysis missing" }
    if ($hasRisk) { Write-Host "  ✅ Risk assessment generated" } else { Write-Host "  ❌ Risk assessment missing" }
    
    if ($hasTone -and $hasRisk) {
        Write-Host "`n🎉 SUCCESS: Automatic AI analysis is working!"
        Write-Host "✅ Phase 4.2.1 Backend Auto-Analysis Integration is COMPLETE!"
    } else {
        Write-Host "`n⚠️  PARTIAL: Some AI analysis missing - check server logs"
    }
    
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Status: $statusCode"
    }
}