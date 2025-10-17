param(
    [string]$Email = "devuser@example.com",
    [string]$Password = "SuperSecret123!"
)

$SupabaseUrl = "https://kjmwaoainmyzbmvalizu.supabase.co"
$AnonKey = "sb_publishable_NLBeWpgVO-5xnyHy1AAJMg_-uVVPexF"
$AuthUrl = "$SupabaseUrl/auth/v1/token?grant_type=password"

Write-Host "Logging in to Supabase as $Email ..."

$Body = @{ email = $Email; password = $Password } | ConvertTo-Json
$Headers = @{ "apikey" = $AnonKey; "Content-Type" = "application/json" }

try {
    $Response = Invoke-RestMethod -Method Post -Uri $AuthUrl -Headers $Headers -Body $Body
    $Token = $Response.access_token
    if (-not $Token) { throw "No access_token in response" }
    $ShortToken = $Token.Substring(0, [Math]::Min(25, $Token.Length))
    Write-Host "Got JWT: $ShortToken..."
} catch {
    Write-Error "Failed to get JWT: $_"
    exit 1
}

$EnvPath = ".env"
$EnvContent = @()
if (Test-Path $EnvPath) {
    $EnvContent = Get-Content $EnvPath
    $Found = $false
    $EnvContent = $EnvContent | ForEach-Object {
        if ($_ -match "^TEST_JWT=") {
            $Found = $true
            "TEST_JWT=$Token"
        } else {
            $_
        }
    }
    if (-not $Found) {
        $EnvContent += "TEST_JWT=$Token"
    }
} else {
    $EnvContent = @("TEST_JWT=$Token")
}
$EnvContent | Set-Content $EnvPath -Encoding UTF8
Write-Host "Wrote TEST_JWT to .env."
