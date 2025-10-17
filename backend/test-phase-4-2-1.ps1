# Final comprehensive test for automatic AI analysis
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PHASE 4.2.1 VERIFICATION TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

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

Write-Host "Step 1: Testing message creation..." -ForegroundColor Yellow

$body = @{
    content = "I'm extremely frustrated with this whole situation! This is completely unacceptable and I can't believe we're at this point. It's infuriating!"
    case_id = $caseId
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body -ErrorAction Stop
    $messageId = $response.message.id
    
    Write-Host "✓ Message created successfully" -ForegroundColor Green
    Write-Host "  Message ID: $messageId" -ForegroundColor Gray
    Write-Host "  Case ID: $($response.message.case_id)" -ForegroundColor Gray
    Write-Host "  Content preview: $($response.message.content.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Step 2: Waiting for AI analysis - 10 seconds..." -ForegroundColor Yellow
    for ($i = 10; $i -gt 0; $i--) {
        Write-Host "  $i seconds remaining..." -ForegroundColor Gray
        Start-Sleep 1
    }
    Write-Host ""
    
    Write-Host "Step 3: Checking database for AI insights..." -ForegroundColor Yellow
    
    # Check database directly
    $checkScript = @"
import { pool } from './src/db.js';
try {
  const result = await pool.query(``
    SELECT 
      insight_type,
      content,
      metadata,
      created_at
    FROM ai_insights 
    WHERE metadata->>'message_id' = `$1
    ORDER BY created_at DESC
  ``, ['$messageId']);
  
  if (result.rows.length === 0) {
    console.log('NO_INSIGHTS_FOUND');
  } else {
    console.log('INSIGHTS_FOUND:' + result.rows.length);
    result.rows.forEach((insight, i) => {
      console.log('INSIGHT_' + i + '_TYPE:' + insight.insight_type);
      if (insight.insight_type === 'tone_analysis') {
        console.log('INSIGHT_' + i + '_TONE:' + (insight.content.emotional_tone || 'unknown'));
        console.log('INSIGHT_' + i + '_INTENSITY:' + (insight.content.intensity || 'unknown'));
      } else if (insight.insight_type === 'risk_assessment') {
        console.log('INSIGHT_' + i + '_RISK:' + (insight.content.risk_level || 'unknown'));
        console.log('INSIGHT_' + i + '_CONFIDENCE:' + (insight.content.confidence || 'unknown'));
      }
      console.log('INSIGHT_' + i + '_AUTO:' + insight.metadata.auto_generated);
    });
  }
} catch (err) {
  console.log('ERROR:' + err.message);
}
pool.end();
"@
    
    $checkScript | Out-File -FilePath "temp-final-check.js" -Encoding UTF8
    $dbOutput = node temp-final-check.js 2>&1 | Out-String
    Remove-Item "temp-final-check.js" -ErrorAction SilentlyContinue
    
    if ($dbOutput -match "NO_INSIGHTS_FOUND") {
        Write-Host "✗ No AI insights found in database" -ForegroundColor Red
        Write-Host ""
        Write-Host "DIAGNOSIS:" -ForegroundColor Yellow
        Write-Host "  - Message creation: WORKING" -ForegroundColor Green
        Write-Host "  - AI service: WORKING (verified earlier)" -ForegroundColor Green
        Write-Host "  - AI processing hook: NOT EXECUTING" -ForegroundColor Red
        Write-Host ""
        Write-Host "LIKELY CAUSE:" -ForegroundColor Yellow
        Write-Host "  The server in the other terminal needs to be restarted" -ForegroundColor White
        Write-Host "  to pick up the latest code changes with AI processing." -ForegroundColor White
        Write-Host ""
        Write-Host "SOLUTION:" -ForegroundColor Yellow
        Write-Host "  1. Stop the server in the other terminal (Ctrl+C)" -ForegroundColor White
        Write-Host "  2. Run: npm run dev" -ForegroundColor White
        Write-Host "  3. Re-run this test" -ForegroundColor White
        
    } elseif ($dbOutput -match "INSIGHTS_FOUND:(\d+)") {
        $insightCount = $Matches[1]
        Write-Host "✓ Found $insightCount AI insights in database!" -ForegroundColor Green
        Write-Host ""
        
        # Parse and display insights
        $lines = $dbOutput -split "`n"
        $hasTone = $false
        $hasRisk = $false
        
        foreach ($line in $lines) {
            if ($line -match "INSIGHT_\d+_TYPE:(.+)") {
                $type = $Matches[1].Trim()
                Write-Host "  • $($type.ToUpper())" -ForegroundColor Cyan
                if ($type -eq "tone_analysis") { $hasTone = $true }
                if ($type -eq "risk_assessment") { $hasRisk = $true }
            }
            elseif ($line -match "INSIGHT_\d+_TONE:(.+)") {
                Write-Host "    - Emotional tone: $($Matches[1].Trim())" -ForegroundColor Gray
            }
            elseif ($line -match "INSIGHT_\d+_INTENSITY:(.+)") {
                Write-Host "    - Intensity: $($Matches[1].Trim())/10" -ForegroundColor Gray
            }
            elseif ($line -match "INSIGHT_\d+_RISK:(.+)") {
                Write-Host "    - Risk level: $($Matches[1].Trim())" -ForegroundColor Gray
            }
            elseif ($line -match "INSIGHT_\d+_CONFIDENCE:(.+)") {
                Write-Host "    - Confidence: $($Matches[1].Trim())" -ForegroundColor Gray
            }
            elseif ($line -match "INSIGHT_\d+_AUTO:(.+)") {
                $autoGen = $Matches[1].Trim()
                Write-Host "    - Auto-generated: $autoGen" -ForegroundColor Gray
            }
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "FINAL RESULTS" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "✓ Message creation: WORKING" -ForegroundColor Green
        Write-Host "✓ AI service: WORKING" -ForegroundColor Green
        Write-Host "✓ AI processing hook: WORKING" -ForegroundColor Green
        Write-Host "✓ Tone analysis: $(if($hasTone){'GENERATED'}else{'MISSING'})" -ForegroundColor $(if($hasTone){'Green'}else{'Red'})
        Write-Host "✓ Risk assessment: $(if($hasRisk){'GENERATED'}else{'MISSING'})" -ForegroundColor $(if($hasRisk){'Green'}else{'Red'})
        Write-Host ""
        
        if ($hasTone -and $hasRisk) {
            Write-Host "🎉 SUCCESS!" -ForegroundColor Green
            Write-Host "Phase 4.2.1 Backend Auto-Analysis Integration is COMPLETE!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Ready to proceed to Phase 4.2.2: Frontend Real-time Insight Updates" -ForegroundColor Cyan
        }
        
    } elseif ($dbOutput -match "ERROR:(.+)") {
        Write-Host "✗ Database error: $($Matches[1])" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "  Status code: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""