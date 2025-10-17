# Test chat message creation with AI analysis
$uri = "http://localhost:4000/api/chat/channels/channel-1/messages"
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer dev-fake-token-123"
    "x-dev-email" = "dev@example.com"
    "x-dev-user-id" = "01234567-89ab-cdef-0123-456789abcdef"
    "x-dev-role" = "mediator"
}
$body = @{
    content = "I can't believe they're being so unreasonable! This is getting really frustrating and I don't think we can work this out."
} | ConvertTo-Json

Write-Host "🧪 Testing chat message creation with AI analysis..."
Write-Host "📝 Creating message with emotional content..."

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body
    Write-Host "✅ Message created successfully:"
    Write-Host "   ID: $($response.message.id)"
    $shortContent = $response.message.content.Substring(0, [Math]::Min(50, $response.message.content.Length))
    Write-Host "   Content: $shortContent..."
    
    Write-Host "⏳ Waiting 5 seconds for AI analysis to complete..."
    Start-Sleep 5
    
    Write-Host "🔍 Checking for AI insights..."
    
    # Check for AI insights
    $insightsUri = "http://localhost:4000/api/ai/insights/case-1"
    $insightsHeaders = @{
        "Authorization" = "Bearer dev-fake-token-123"
        "x-dev-email" = "dev@example.com"
        "x-dev-user-id" = "01234567-89ab-cdef-0123-456789abcdef"
        "x-dev-role" = "mediator"
    }
    
    $insightsResponse = Invoke-RestMethod -Uri $insightsUri -Method Get -Headers $insightsHeaders
    
    Write-Host "📊 Total insights found: $($insightsResponse.insights.Count)"
    
    # Look for insights created after the message
    $messageTime = [DateTime]::Parse($response.message.created_at)
    $recentInsights = @()
    
    foreach ($insight in $insightsResponse.insights) {
        $insightTime = [DateTime]::Parse($insight.created_at)
        if ($insightTime -gt $messageTime -and $insight.metadata.auto_generated -eq $true) {
            $recentInsights += $insight
        }
    }
    
    Write-Host "🔍 Auto-generated insights since message: $($recentInsights.Count)"
    
    $hasTone = $false
    $hasRisk = $false
    
    foreach ($insight in $recentInsights) {
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
    } else {
        Write-Host "`n⚠️  PARTIAL: Some AI analysis missing"
    }
    
}
catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode)"
    }
}