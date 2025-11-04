# Create Test User Accounts
# Run this after backend is healthy

$backendUrl = "https://mediation-app.onrender.com"

Write-Host "Creating Test Accounts..." -ForegroundColor Yellow
Write-Host ""

$testUsers = @(
    @{ email = "alice@test.com"; name = "Alice Divorcee"; role = "divorcee" },
    @{ email = "bob@test.com"; name = "Bob Divorcee"; role = "divorcee" },
    @{ email = "mediator@test.com"; name = "Mary Mediator"; role = "mediator" },
    @{ email = "lawyer@test.com"; name = "Larry Lawyer"; role = "lawyer" },
    @{ email = "admin@test.com"; name = "Admin User"; role = "admin" }
)

$created = @()
$failed = @()

foreach ($user in $testUsers) {
    Write-Host "Creating $($user.role): $($user.email)..." -ForegroundColor Cyan
    
    $body = @{
        email = $user.email
        password = "Test123!"
        full_name = $user.name
        role = $user.role
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$backendUrl/api/auth/register" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        Write-Host "   ✅ Created successfully!" -ForegroundColor Green
        $created += $user.email
    } catch {
        $errorMsg = $_.Exception.Message
        if ($_.ErrorDetails.Message) {
            $errorDetail = ($_.ErrorDetails.Message | ConvertFrom-Json).error
            if ($errorDetail -like "*already exists*") {
                Write-Host "   ⚠️  Already exists (skipping)" -ForegroundColor Yellow
            } else {
                Write-Host "   ❌ Failed: $errorDetail" -ForegroundColor Red
                $failed += $user.email
            }
        } else {
            Write-Host "   ❌ Failed: $errorMsg" -ForegroundColor Red
            $failed += $user.email
        }
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Created: $($created.Count)" -ForegroundColor Green
Write-Host "  Failed: $($failed.Count)" -ForegroundColor Red
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Test Credentials (all use password: Test123!):" -ForegroundColor Cyan
Write-Host "  🙋 Divorcee 1: alice@test.com" -ForegroundColor Gray
Write-Host "  🙋 Divorcee 2: bob@test.com" -ForegroundColor Gray
Write-Host "  👔 Mediator:   mediator@test.com" -ForegroundColor Gray
Write-Host "  ⚖️  Lawyer:     lawyer@test.com" -ForegroundColor Gray
Write-Host "  🔧 Admin:      admin@test.com" -ForegroundColor Gray
Write-Host ""
Write-Host "Ready to test at: https://www.divorcesmediator.com" -ForegroundColor Green
