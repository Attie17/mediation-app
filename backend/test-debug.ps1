# Test with detailed debugging
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
    content = "This is extremely frustrating! I am so angry and this situation is completely unacceptable!"
    case_id = $caseId
} | ConvertTo-Json

Write-Host "Testing AI analysis with debugging..."
Write-Host "1. Creating message with case_id..."

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "Message created: $($response.message.id)"
    Write-Host "Has case_id: $($response.message.case_id)"
    
    # Give a shorter wait and check multiple times
    Write-Host "2. Waiting 3 seconds and checking database directly..."
    Start-Sleep 3
    
    # Check database directly using node script
    $messageId = $response.message.id
    Write-Host "3. Checking insights for message: $messageId"
    
    # Create a temp script to check insights
    $checkScript = @"
import { pool } from './src/db.js';
try {
  const result = await pool.query(`
    SELECT insight_type, created_at, metadata->>'auto_generated' as auto_gen
    FROM ai_insights 
    WHERE metadata->>'message_id' = `$1
  `, ['$messageId']);
  console.log(`Found: `${result.rows.length} insights`);
  result.rows.forEach(r => console.log(`  - `${r.insight_type} at `${r.created_at} (auto: `${r.auto_gen})`));
} catch (err) {
  console.error('Error:', err.message);
}
pool.end();
"@
    
    $checkScript | Out-File -FilePath "temp-check.js" -Encoding UTF8
    $dbResult = node temp-check.js 2>&1
    Write-Host $dbResult
    Remove-Item "temp-check.js" -ErrorAction SilentlyContinue
    
    # Try the API call to see what specific error we get
    Write-Host "4. Testing API access..."
    try {
        $insightsUri = "http://localhost:4000/api/ai/insights/$caseId"
        $insightsHeaders = $headers.Clone()
        $insightsHeaders.Remove("Content-Type")
        
        $insights = Invoke-RestMethod -Uri $insightsUri -Method Get -Headers $insightsHeaders -ErrorAction Stop
        Write-Host "SUCCESS: Got insights from API: $($insights.insights.Count)"
    } catch {
        Write-Host "API Error: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            Write-Host "Status Code: $statusCode"
        }
    }
    
} catch {
    Write-Host "Message creation failed: $($_.Exception.Message)"
}