# Developer Login Script for Mediation App
# Sets up localStorage with developer credentials

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   Developer Login Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if the dev-login.html file exists
if (Test-Path ".\dev-login.html") {
    Write-Host "✅ Opening developer login page..." -ForegroundColor Green
    Write-Host ""
    Write-Host "Instructions:" -ForegroundColor Yellow
    Write-Host "1. A browser window will open with the developer login page" -ForegroundColor White
    Write-Host "2. Select your role (Admin recommended for full access)" -ForegroundColor White
    Write-Host "3. Click 'Login as Developer'" -ForegroundColor White
    Write-Host "4. You'll be redirected to the app automatically" -ForegroundColor White
    Write-Host ""
    Write-Host "Keyboard shortcuts:" -ForegroundColor Cyan
    Write-Host "  1 = Admin    2 = Mediator    3 = Divorcee    4 = Lawyer" -ForegroundColor Gray
    Write-Host "  Enter = Login with selected role" -ForegroundColor Gray
    Write-Host ""
    
    # Open the HTML file in default browser
    Start-Process ".\dev-login.html"
    
    Write-Host "✨ Developer login page opened!" -ForegroundColor Green
} else {
    Write-Host "❌ Error: dev-login.html not found in current directory" -ForegroundColor Red
    Write-Host "   Make sure you're in the c:\mediation-app directory" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Alternative: Manual Setup via Browser Console" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you prefer, paste this in your browser console (F12):" -ForegroundColor Yellow
Write-Host ""
Write-Host "// Admin with full access" -ForegroundColor Gray
Write-Host "localStorage.setItem('token', 'dev-fake-token');" -ForegroundColor White
Write-Host "localStorage.setItem('user', JSON.stringify({" -ForegroundColor White
Write-Host "  id: '862b3a3e-8390-57f8-a307-12004a341a2e'," -ForegroundColor White
Write-Host "  email: 'admin@dev.local'," -ForegroundColor White
Write-Host "  name: 'Dev Admin'," -ForegroundColor White
Write-Host "  role: 'admin'" -ForegroundColor White
Write-Host "}));" -ForegroundColor White
Write-Host "localStorage.setItem('activeCaseId', '4');" -ForegroundColor White
Write-Host "localStorage.setItem('devMode', 'true');" -ForegroundColor White
Write-Host "location.reload();" -ForegroundColor White
Write-Host ""
