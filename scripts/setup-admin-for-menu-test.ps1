# Quick Setup: Admin User for Menu Testing
# Run this to create/update admin user and set localStorage for immediate access

Write-Host "`n=== Admin User Setup ===" -ForegroundColor Cyan

# 1. Ensure admin user exists in database
Write-Host "`n1. Creating admin user in database..." -ForegroundColor Yellow

$adminUserId = "862b3a3e-8390-57f8-a307-12004a341a2e"
$adminEmail = "admin@test.com"
$adminName = "Admin User"

$sql = @"
INSERT INTO app_users (user_id, email, name, role) 
VALUES ('$adminUserId', '$adminEmail', '$adminName', 'admin') 
ON CONFLICT (user_id) DO UPDATE 
SET role = 'admin', email = '$adminEmail', name = '$adminName'
RETURNING user_id, email, name, role;
"@

Write-Host "   SQL: $sql" -ForegroundColor Gray

try {
    $result = node -e "
    import('./backend/src/db.js').then(async ({ pool }) => {
        const result = await pool.query(`$sql`);
        console.log(JSON.stringify(result.rows[0]));
        process.exit(0);
    }).catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
    " 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Admin user created/updated" -ForegroundColor Green
        Write-Host "   User: $result" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ Failed to create admin user" -ForegroundColor Red
        Write-Host "   Error: $result" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Database error: $_" -ForegroundColor Red
}

# 2. Instructions for browser console
Write-Host "`n2. Copy and paste into browser console (F12):" -ForegroundColor Yellow
Write-Host @"

// Set admin user in localStorage
localStorage.setItem('token', 'dev-fake-token');
localStorage.setItem('user', JSON.stringify({
  id: '$adminUserId',
  email: '$adminEmail',
  name: '$adminName',
  role: 'admin'
}));

// Refresh page
location.reload();

"@ -ForegroundColor Cyan

# 3. Alternative: Use registration flow
Write-Host "`n3. Or register normally:" -ForegroundColor Yellow
Write-Host "   a. Navigate to: http://localhost:5173/register" -ForegroundColor Gray
Write-Host "   b. Fill in details" -ForegroundColor Gray
Write-Host "   c. Select role: Admin" -ForegroundColor Gray
Write-Host "   d. Submit" -ForegroundColor Gray

Write-Host "`n=== Menu Testing Checklist ===" -ForegroundColor Cyan
Write-Host "✓ Open http://localhost:5173" -ForegroundColor White
Write-Host "✓ Click hamburger menu (top-left)" -ForegroundColor White
Write-Host "✓ Verify ALL pages are enabled (white text, no locks)" -ForegroundColor White
Write-Host "✓ Click each dashboard to verify access" -ForegroundColor White
Write-Host "✓ Check that 'Signed in as: admin' appears at bottom" -ForegroundColor White

Write-Host "`n=== Testing Other Roles ===" -ForegroundColor Cyan
Write-Host "To test restricted access:" -ForegroundColor White
Write-Host "1. Sign out" -ForegroundColor Gray
Write-Host "2. Register as 'divorcee' role" -ForegroundColor Gray
Write-Host "3. Open menu - see that mediator/lawyer/admin pages are grayed out" -ForegroundColor Gray

Write-Host "`nDone! Servers are running on:" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:4000" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
