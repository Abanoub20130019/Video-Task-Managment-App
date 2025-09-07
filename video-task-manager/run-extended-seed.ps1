# PowerShell script to run extended seed
# Make sure your Next.js app is running on localhost:3001

Write-Host "🚀 Running Extended Seed..." -ForegroundColor Green
Write-Host "Make sure your app is running on localhost:3001 and you're logged in as admin" -ForegroundColor Yellow
Write-Host ""

try {
    # First, let's try to get the session cookie from a running browser
    Write-Host "Attempting to call extended seed API..." -ForegroundColor Cyan

    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/extended-seed" -Method POST -ContentType "application/json" -UseDefaultCredentials -ErrorAction Stop

    $result = $response.Content | ConvertFrom-Json

    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Success!" -ForegroundColor Green
        Write-Host $result.message -ForegroundColor White
    } else {
        Write-Host "❌ Error:" -ForegroundColor Red
        Write-Host $result.error -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to call API:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Make sure your Next.js app is running (npm run dev)" -ForegroundColor White
    Write-Host "2. Make sure you're logged in as an admin user" -ForegroundColor White
    Write-Host "3. Try using the HTML test page instead: test-extended-seed.html" -ForegroundColor White
    Write-Host "4. Or use browser developer tools console with the fetch command" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")