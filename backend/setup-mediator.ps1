<#
.SYNOPSIS
  Sets up a mediator user, fetches a JWT, updates .env with TEST_JWT,
  and runs the mediator smoke test.
#>

param(
    [string]$Email = "participants.mediator@example.com",
    [string]$Password = "FreshMediatorPass123!",
    [int]$CaseId = 9102,
    [switch]$Recreate,
    [switch]$Cleanup
)

$ErrorActionPreference = 'Stop'

Write-Host "[jwt-setup] 🔄 Starting mediator setup..."

# Build node args
$nodeArgs = @()
$nodeArgs += "--caseId"; $nodeArgs += $CaseId
$nodeArgs += "--email"; $nodeArgs += $Email
$nodeArgs += "--password"; $nodeArgs += $Password
if ($Recreate) { $nodeArgs += "--recreate" }
if ($Cleanup) { $nodeArgs += "--cleanup" }

# Run create-mediator.js
$createScript = Join-Path $PSScriptRoot 'create-mediator.js'
Write-Host "[jwt-setup] Running: node $createScript $($nodeArgs -join ' ')"
node $createScript @nodeArgs
if ($LASTEXITCODE -ne 0) {
    Write-Error "[jwt-setup] ❌ Mediator setup failed."
    exit 1
}

# Run get-jwt.ps1
$jwtScript = Join-Path $PSScriptRoot 'get-jwt.ps1'
Write-Host "[jwt-setup] 🔑 Fetching JWT for $Email..."
$jwtResult = & $jwtScript -Email $Email -Password $Password
if ($LASTEXITCODE -ne 0) {
    Write-Error "[jwt-setup] ❌ Failed to fetch JWT."
    exit 1
}

# Extract token from env:token
$token = $env:token
if (-not $token) {
    Write-Error "[jwt-setup] ❌ No token found in environment after get-jwt.ps1."
    exit 1
}

# Update .env
$envPath = Join-Path (Join-Path $PSScriptRoot '..') '.env'
if (-not (Test-Path $envPath)) {
    Write-Error "[jwt-setup] ❌ .env file not found at $envPath"
    exit 1
}

Write-Host "[jwt-setup] Updating .env at $envPath..."

function Set-Or-Replace($lines, $key, $value) {
    $pattern = "^$key="
    $exists = $false
    $newLines = @()
    foreach ($line in $lines) {
        if ($line -match $pattern) {
            $newLines += "$key=$value"
            $exists = $true
        } else {
            $newLines += $line
        }
    }
    if (-not $exists) {
        $newLines += "$key=$value"
    }
    return ,$newLines
}

$envLines = Get-Content $envPath
$envLines = Set-Or-Replace $envLines "TEST_JWT" $token

# Ensure MEDIATOR_CASE_ID is present
$hasCaseId = $envLines -match "^MEDIATOR_CASE_ID="
if (-not $hasCaseId) {
    $envLines += "MEDIATOR_CASE_ID=$CaseId"
}

$envLines | Set-Content $envPath -Encoding UTF8

Write-Host "[jwt-setup] ✅ Mediator JWT stored as TEST_JWT in .env"

# --- Run mediator smoke test ---
$testScript = Join-Path (Join-Path $PSScriptRoot '..') "tests/test-mediator.cjs"
$node = (Get-Command node).Source
Write-Host "[jwt-setup] 🚀 Running mediator smoke test at $testScript ..."
& $node $testScript
$testExit = $LASTEXITCODE

if ($testExit -eq 0) {
    Write-Host "[jwt-setup] ✅ Mediator smoke test passed."
    exit 0
} else {
    Write-Host "[jwt-setup] ❌ Mediator smoke test failed (exit code $testExit)"
    exit 1
}
