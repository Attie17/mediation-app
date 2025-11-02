# Quick fix script to set active case for mediator homepage
# Run this to enable Quick Action buttons

Write-Host "`n🔧 QUICK ACTION CARDS FIX SCRIPT" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Check if backend is running
Write-Host "`n1️⃣ Checking backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/cases" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✓ Backend is running on port 4000" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Backend not running. Start it with: npm run start" -ForegroundColor Red
    exit 1
}

# Instructions
Write-Host "`n2️⃣ SOLUTION:" -ForegroundColor Yellow
Write-Host "   The Quick Action buttons need an 'activeCaseId' in localStorage." -ForegroundColor White
Write-Host ""
Write-Host "   Choose one option:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   OPTION A (Recommended):" -ForegroundColor Green
Write-Host "   1. Open this file in browser:" -ForegroundColor White
Write-Host "      file:///c:/mediation-app/set-active-case.html" -ForegroundColor Yellow
Write-Host "   2. It will auto-set your first case" -ForegroundColor White
Write-Host "   3. Click to confirm and return to homepage" -ForegroundColor White
Write-Host "   4. Quick Action buttons now work!" -ForegroundColor White
Write-Host ""
Write-Host "   OPTION B (Browser Console):" -ForegroundColor Green
Write-Host "   1. Open http://localhost:5173 in browser" -ForegroundColor White
Write-Host "   2. Press F12 to open Developer Tools" -ForegroundColor White
Write-Host "   3. Go to Console tab" -ForegroundColor White
Write-Host "   4. Paste this code:" -ForegroundColor White
Write-Host ""
Write-Host "   fetch('http://localhost:4000/api/cases/user/44d32632-d369-5263-9111-334e03253f94', {" -ForegroundColor Magenta
Write-Host "     headers: { 'Authorization': `Bearer `${localStorage.getItem('auth_token')}` }" -ForegroundColor Magenta
Write-Host "   })" -ForegroundColor Magenta
Write-Host "   .then(r => r.json())" -ForegroundColor Magenta
Write-Host "   .then(cases => {" -ForegroundColor Magenta
Write-Host "     localStorage.setItem('activeCaseId', cases[0].id);" -ForegroundColor Magenta
Write-Host "     console.log('✅ Set:', cases[0].description);" -ForegroundColor Magenta
Write-Host "     location.reload();" -ForegroundColor Magenta
Write-Host "   });" -ForegroundColor Magenta
Write-Host ""
Write-Host "   5. Press Enter and page will reload" -ForegroundColor White
Write-Host "   6. Quick Action buttons now work!" -ForegroundColor White

Write-Host "`n3️⃣ VERIFICATION:" -ForegroundColor Yellow
Write-Host "   After setting active case, test these buttons:" -ForegroundColor White
Write-Host "   • My Cases → Should go to case detail page" -ForegroundColor Gray
Write-Host "   • Documents → Should go to uploads page" -ForegroundColor Gray
Write-Host "   • Messages → Should go to case page" -ForegroundColor Gray
Write-Host "   • Contacts → Should go to profile page" -ForegroundColor Gray
Write-Host "" -ForegroundColor White
Write-Host "   (Need an ID? Run: node backend/check-cases.js)" -ForegroundColor DarkGray

Write-Host "`n📚 For full details, see:" -ForegroundColor Cyan
Write-Host "   c:\mediation-app\QUICK_ACTION_CARDS_INVESTIGATION.md" -ForegroundColor Yellow

Write-Host "`n" + "=" * 60 -ForegroundColor Gray
Write-Host "Press any key to open set-active-case.html in browser..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "file:///c:/mediation-app/set-active-case.html"
Write-Host "✅ Opened set-active-case.html in browser" -ForegroundColor Green
