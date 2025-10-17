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
    Write-Host "   Content: $($response.message.content.Substring(0, [Math]::Min(50, $response.message.content.Length)))..."
    
    Write-Host "⏳ Waiting 3 seconds for AI analysis to complete..."
    Start-Sleep 3
    
    # Check for AI insights
    $insightsUri = "http://localhost:4000/api/ai/insights/case-1"
    $insightsResponse = Invoke-RestMethod -Uri $insightsUri -Method Get -Headers @{
        "Authorization" = "Bearer dev-fake-token-123"
        "x-dev-email" = "dev@example.com"
        "x-dev-user-id" = "01234567-89ab-cdef-0123-456789abcdef"
        "x-dev-role" = "mediator"
    }
    
    $messageTime = [DateTime]::Parse($response.message.created_at)
    $autoInsights = $insightsResponse.insights | Where-Object { 
        $insightTime = [DateTime]::Parse($_.created_at)
        $insightTime -gt $messageTime -and 
        $_.metadata.auto_generated -eq $true -and
        $_.metadata.message_id -eq $response.message.id
    }
    
    Write-Host "📊 Found $($autoInsights.Count) auto-generated insights:"
    foreach ($insight in $autoInsights) {
        Write-Host "  • $($insight.insight_type.ToUpper())"
        if ($insight.insight_type -eq "tone_analysis") {
            Write-Host "    - Emotional tone: $($insight.content.emotional_tone)"
            Write-Host "    - Intensity: $($insight.content.intensity)/10"
        } elseif ($insight.insight_type -eq "risk_assessment") {
            Write-Host "    - Risk level: $($insight.content.risk_level)"
            Write-Host "    - Confidence: $($insight.content.confidence)"
        }
    }
    
    $hasTone = $autoInsights | Where-Object { $_.insight_type -eq "tone_analysis" }
    $hasRisk = $autoInsights | Where-Object { $_.insight_type -eq "risk_assessment" }
    
    Write-Host "🎯 Test Results:"
    Write-Host "  ✅ Message created successfully"
    
    if ($hasTone) {
        Write-Host "  ✅ Tone analysis generated"
    } else {
        Write-Host "  ❌ Tone analysis generated"
    }
    
    if ($hasRisk) {
        Write-Host "  ✅ Risk assessment generated"
    } else {
        Write-Host "  ❌ Risk assessment generated"
    }
    
    if ($hasTone -and $hasRisk) {
        Write-Host "🎉 SUCCESS: Automatic AI analysis is working!"
    } else {
        Write-Host "⚠️  PARTIAL: Some AI analysis missing"
    }
    
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "   Status Code: $statusCode"
    }
}