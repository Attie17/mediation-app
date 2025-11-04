# Test Communications and AI Features
# Tests all messaging, conversations, and AI endpoints

$backendUrl = "https://mediation-app.onrender.com"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Testing Communications & AI Features" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# First, login to get a token
Write-Host "1. Logging in to get authentication token..." -ForegroundColor Yellow
$loginBody = @{
    email = "alice@test.com"
    password = "Test123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$backendUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "   ✅ Login successful!" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Setup headers with authentication
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test AI Endpoints
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Testing AI Features" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$aiTests = @(
    @{ name = "AI Health Check"; method = "GET"; endpoint = "/api/ai/health" },
    @{ name = "AI Summarize"; method = "POST"; endpoint = "/api/ai/summarize"; body = @{ text = "This is a test message to summarize." } },
    @{ name = "AI Tone Analysis"; method = "POST"; endpoint = "/api/ai/analyze-tone"; body = @{ text = "I am very angry about this situation!" } },
    @{ name = "AI Suggest Rephrase"; method = "POST"; endpoint = "/api/ai/suggest-rephrase"; body = @{ text = "You never listen to me!" } },
    @{ name = "AI Risk Assessment"; method = "POST"; endpoint = "/api/ai/assess-risk"; body = @{ caseId = "test-case"; context = "High conflict custody dispute" } },
    @{ name = "AI Emotion Analysis"; method = "POST"; endpoint = "/api/ai/analyze-emotion"; body = @{ text = "I'm feeling overwhelmed and scared." } }
)

foreach ($test in $aiTests) {
    Write-Host "Testing: $($test.name)..." -ForegroundColor Cyan
    try {
        if ($test.method -eq "GET") {
            $response = Invoke-RestMethod -Uri "$backendUrl$($test.endpoint)" -Method Get -Headers $headers -ErrorAction Stop
        } else {
            $body = $test.body | ConvertTo-Json
            $response = Invoke-RestMethod -Uri "$backendUrl$($test.endpoint)" -Method Post -Headers $headers -Body $body -ErrorAction Stop
        }
        Write-Host "   ✅ $($test.name) working!" -ForegroundColor Green
        if ($response.ok -eq $false) {
            Write-Host "   ⚠️  Response indicated error: $($response.error)" -ForegroundColor Yellow
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   ❌ Failed (Status: $statusCode)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            $errorDetail = ($_.ErrorDetails.Message | ConvertFrom-Json).error
            Write-Host "   Error: $errorDetail" -ForegroundColor Red
        }
    }
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Testing Messaging & Conversations" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$commTests = @(
    @{ name = "List Conversations"; method = "GET"; endpoint = "/api/conversations/unread/count" },
    @{ name = "AI Chat History"; method = "GET"; endpoint = "/api/ai-chat-history/user/$($loginResponse.userId)" }
)

foreach ($test in $commTests) {
    Write-Host "Testing: $($test.name)..." -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$backendUrl$($test.endpoint)" -Method $test.method -Headers $headers -ErrorAction Stop
        Write-Host "   ✅ $($test.name) working!" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   ❌ Failed (Status: $statusCode)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend Routes Mounted:" -ForegroundColor Green
Write-Host "   - /api/ai - AI features" -ForegroundColor Gray
Write-Host "   - /api/conversations - Conversation management" -ForegroundColor Gray
Write-Host "   - /api/messages - Legacy messaging" -ForegroundColor Gray
Write-Host "   - /api/ai-chat-history - AI chat history" -ForegroundColor Gray
Write-Host ""
Write-Host "AI Features Available:" -ForegroundColor Green
Write-Host "   - Text summarization" -ForegroundColor Gray
Write-Host "   - Tone analysis" -ForegroundColor Gray
Write-Host "   - Emotion analysis" -ForegroundColor Gray
Write-Host "   - Risk assessment" -ForegroundColor Gray
Write-Host "   - Message rephrasing" -ForegroundColor Gray
Write-Host "   - Legal guidance" -ForegroundColor Gray
Write-Host "   - Question routing" -ForegroundColor Gray
Write-Host "   - Web search with citations" -ForegroundColor Gray
Write-Host ""
Write-Host "Communication Channels:" -ForegroundColor Green
Write-Host "   - Private conversations (divorcee to mediator)" -ForegroundColor Gray
Write-Host "   - Group conversations (both divorcees + mediator)" -ForegroundColor Gray
Write-Host "   - AI support conversations" -ForegroundColor Gray
Write-Host "   - Lawyer conversations" -ForegroundColor Gray
Write-Host ""
Write-Host "OpenAI Configuration:" -ForegroundColor Yellow
Write-Host "   Model: gpt-4o-mini" -ForegroundColor Gray
Write-Host "   Max Tokens: 2000" -ForegroundColor Gray
Write-Host "   Temperature: 0.7" -ForegroundColor Gray
Write-Host ""
