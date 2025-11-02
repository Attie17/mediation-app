# Quick Admin Access Script
# Opens dev-login.html in your default browser

Write-Host ""
Write-Host "🚀 Opening Developer Login..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Available Roles:" -ForegroundColor Yellow
Write-Host "  👨‍💼 Admin      - Full system access (recommended for you)" -ForegroundColor Green
Write-Host "  ⚖️  Mediator   - Case management" -ForegroundColor Gray
Write-Host "  👤 Divorcee   - End user view" -ForegroundColor Gray
Write-Host "  👔 Lawyer     - Legal representative" -ForegroundColor Gray
Write-Host ""

# Open in default browser
Start-Process "http://localhost:5173/dev-login.html"

Write-Host "✅ Browser opened!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Click the 'Admin' role button" -ForegroundColor White
Write-Host "  2. Click 'Login as Developer'" -ForegroundColor White
Write-Host "  3. You'll be redirected to the admin dashboard" -ForegroundColor White
Write-Host ""
Write-Host "Your admin user details:" -ForegroundColor Cyan
Write-Host "  Email: admin@dev.local" -ForegroundColor White
Write-Host "  Role:  admin" -ForegroundColor White
Write-Host "  ID:    862b3a3e-8390-57f8-a307-12004a341a2e" -ForegroundColor Gray
Write-Host ""
