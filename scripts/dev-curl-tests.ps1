Param([string]$Base = "http://localhost:4000")

Write-Host "== health"
Invoke-RestMethod -Method Get -Uri "$Base/healthz" -ErrorAction Stop | Out-Host

Write-Host "== register"
$reg = @{ email="alice@example.com"; password="Test12345!" } | ConvertTo-Json -Compress
Invoke-RestMethod -Method Post -Uri "$Base/api/auth/register" -ContentType "application/json" -Body $reg -ErrorAction Stop | Out-Host

Write-Host "== whoami"
Invoke-RestMethod -Method Get -Uri "$Base/api/debug/whoami" -Headers @{ "x-dev-email"="alice@example.com"; "x-dev-role"="divorcee" } -ErrorAction Stop | Out-Host

Write-Host "== profile GET"
Invoke-RestMethod -Method Get -Uri "$Base/api/users/me" -Headers @{ "x-dev-email"="alice@example.com"; "x-dev-role"="divorcee" } -ErrorAction Stop | Out-Host

Write-Host "== profile PUT"
$patch = @{ name="Alice One"; preferredName="Alice" } | ConvertTo-Json -Compress
Invoke-RestMethod -Method Put -Uri "$Base/api/users/me" -ContentType "application/json" -Headers @{ "x-dev-email"="alice@example.com"; "x-dev-role"="divorcee" } -Body $patch -ErrorAction Stop | Out-Host

Write-Host "✅ done"