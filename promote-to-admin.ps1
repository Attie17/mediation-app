# Promote User to Admin via Database
# This script connects to Supabase and promotes ds.attie.nel@gmail.com to admin

Write-Host "Promoting ds.attie.nel@gmail.com to Admin..." -ForegroundColor Yellow
Write-Host ""

$supabaseUrl = "https://kjmwaoainmyzbmvalizu.supabase.co"
$supabaseKey = "sb_secret_rp99nfaT-WK7P2LLLUVoEw_B7xQtSCt"
$email = "ds.attie.nel@gmail.com"

# Update the user role to admin using Supabase REST API
$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

$body = @{
    role = "admin"
} | ConvertTo-Json

try {
    # Update app_users table
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/app_users?email=eq.$email" -Method Patch -Headers $headers -Body $body
    
    Write-Host "✅ Successfully promoted to admin!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Account Details:" -ForegroundColor Cyan
    Write-Host "  Email: $email" -ForegroundColor Gray
    Write-Host "  Role: admin" -ForegroundColor Gray
    Write-Host "  Password: Admin123!" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You can now login at: https://www.divorcesmediator.com" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error promoting user" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Run this SQL in Supabase SQL Editor:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "UPDATE app_users SET role = 'admin' WHERE email = 'ds.attie.nel@gmail.com';" -ForegroundColor Cyan
}
