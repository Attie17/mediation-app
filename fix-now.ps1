# ONE-COMMAND FIX for Quick Action Cards
# This opens the helper page that auto-sets your active case

Write-Host "`n✨ QUICK ACTION CARDS - ONE-CLICK FIX" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`nOpening set-active-case.html in your browser..." -ForegroundColor Yellow
Write-Host "It will automatically set your first case as active.`n" -ForegroundColor White

Start-Process "file:///c:/mediation-app/set-active-case.html"

Write-Host "✅ Page opened!" -ForegroundColor Green
Write-Host "`nWhat happens next:" -ForegroundColor Cyan
Write-Host "  1. Page loads and auto-sets first case" -ForegroundColor White
Write-Host "  2. Shows your available cases" -ForegroundColor White
Write-Host "  3. Click 'Go to homepage' button" -ForegroundColor White
Write-Host "  4. Quick Action buttons now work!" -ForegroundColor Green
Write-Host "`n" -ForegroundColor White
