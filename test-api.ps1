# Test Messages API

$headers = @{
    "X-Dev-User-Id" = "22222222-2222-2222-2222-222222222222"
    "X-Dev-Email" = "bob@example.com"
    "X-Dev-Role" = "divorcee"
}

Write-Host "Testing unread count endpoint..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/messages/unread/count" -Headers $headers -Method Get
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    $response | ConvertTo-Json | Write-Host
} catch {
    Write-Host "❌ FAILED:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host $_.Exception.InnerException.Message -ForegroundColor Yellow
}
