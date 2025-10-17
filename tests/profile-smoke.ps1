Param([string]$Base = "http://localhost:4000")
$Token = $env:TEST_JWT
Invoke-RestMethod -Headers @{ Authorization = "Bearer $Token" } -Uri "$Base/api/users/me"
Invoke-RestMethod -Method Put -Headers @{ Authorization = "Bearer $Token"; 'Content-Type'='application/json' } -Body (@{ 
  name='Test User'; preferredName='TU'; phone='+27 82 000 0000'; address=@{ line1='1 Test St'; city='CT'; postalCode='8001' } } | ConvertTo-Json) -Uri "$Base/api/users/me"
"✅ profile endpoints ok"