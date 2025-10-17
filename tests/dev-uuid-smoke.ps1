Param(
  [string]$BaseUrl = "http://localhost:4000"
)

Write-Host "--- Alice whoami" -ForegroundColor Cyan
curl -s -H 'Authorization: Bearer dev-fake-token' -H 'x-dev-email: alice@example.com' "$BaseUrl/api/debug/whoami" | Write-Output

Write-Host "--- Alice ensure profile" -ForegroundColor Cyan
curl -s -H 'Authorization: Bearer dev-fake-token' -H 'x-dev-email: alice@example.com' "$BaseUrl/api/users/me" | Write-Output

Write-Host "--- Alice update" -ForegroundColor Cyan
curl -s -X PUT -H 'Authorization: Bearer dev-fake-token' -H 'Content-Type: application/json' -H 'x-dev-email: alice@example.com' -d '{"name":"Alice One","preferredName":"Alice"}' "$BaseUrl/api/users/me" | Write-Output

Write-Host "--- Bob ensure profile" -ForegroundColor Cyan
curl -s -H 'Authorization: Bearer dev-fake-token' -H 'x-dev-email: bob@example.com' "$BaseUrl/api/users/me" | Write-Output

Write-Host "--- Bob update" -ForegroundColor Cyan
curl -s -X PUT -H 'Authorization: Bearer dev-fake-token' -H 'Content-Type: application/json' -H 'x-dev-email: bob@example.com' -d '{"name":"Bob Two","preferredName":"Bob"}' "$BaseUrl/api/users/me" | Write-Output

Write-Host "--- Back to Alice" -ForegroundColor Cyan
curl -s -H 'Authorization: Bearer dev-fake-token' -H 'x-dev-email: alice@example.com' "$BaseUrl/api/users/me" | Write-Output

Write-Host "✅ Dev UUID normalization & persistence ok (if names persisted)" -ForegroundColor Green
