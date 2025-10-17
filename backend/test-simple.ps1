# Simple test for chat message creation
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

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "✅ Message created successfully:"
    Write-Host "   ID: $($response.message.id)"
    Write-Host "   Content: $($response.message.content.Substring(0, 50))..."
    
    Write-Host "⏳ Waiting 5 seconds for AI analysis..."
    Start-Sleep 5
    
    # Check insights
    $insightsUri = "http://localhost:4000/api/ai/insights/case-1"
    $insightsHeaders = @{
        "Authorization" = "Bearer dev-fake-token-123"
        "x-dev-email" = "dev@example.com" 
        "x-dev-user-id" = "01234567-89ab-cdef-0123-456789abcdef"
        "x-dev-role" = "mediator"
    }
    
    $insights = Invoke-RestMethod -Uri $insightsUri -Method Get -Headers $insightsHeaders -ErrorAction Stop
    Write-Host "📊 Total insights: $($insights.insights.Count)"
    
    $recentInsights = $insights.insights | Where-Object { 
        $_.metadata.auto_generated -eq $true -and 
        $_.metadata.message_id -eq $response.message.id 
    }
    
    Write-Host "🔍 Auto-generated insights for this message: $($recentInsights.Count)"
    foreach ($insight in $recentInsights) {
        Write-Host "  • $($insight.insight_type)"
    }
    
    if ($recentInsights.Count -gt 0) {
        Write-Host "🎉 SUCCESS: Automatic AI analysis is working!"
    } else {
        Write-Host "⚠️  No automatic insights generated"
    }
}
catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
}