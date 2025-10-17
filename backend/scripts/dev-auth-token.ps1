Param([string]$Base = "http://localhost:4000")

Write-Host "== register (token mode)"
$payload = @{ email="tokenuser@example.com"; password="Test12345!" } | ConvertTo-Json -Compress
try {
	$r = Invoke-RestMethod -Method Post -Uri "$Base/api/auth/register" -ContentType "application/json" -Body $payload -ErrorAction Stop
} catch {
	$r = $null
}
if (-not $r -or -not $r.ok) {
	Write-Host "== login (fallback)"
	$r = Invoke-RestMethod -Method Post -Uri "$Base/api/auth/login" -ContentType "application/json" -Body $payload -ErrorAction Stop
}
$token = $r.token
if (-not $token) { Write-Host "No token returned; aborting" -ForegroundColor Red; exit 1 }
Write-Host "== users/me (token)"
Invoke-RestMethod -Method Get -Uri "$Base/api/users/me" -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop | Out-Host
Write-Host "✅ token flow ok"
