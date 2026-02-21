# Database Setup Script
Write-Host "`n=== Setting up Database ===" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL is available
Write-Host "This script will help you set up the database." -ForegroundColor Yellow
Write-Host ""
Write-Host "You need to run the SQL schema manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Using PostgreSQL Command Line (psql)" -ForegroundColor Cyan
Write-Host "  psql -U postgres -d college_canteen -f database\schema.sql" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Using pgAdmin or DBeaver" -ForegroundColor Cyan
Write-Host "  1. Open your database management tool" -ForegroundColor White
Write-Host "  2. Connect to your PostgreSQL server" -ForegroundColor White
Write-Host "  3. Create 'college_canteen' database" -ForegroundColor White
Write-Host "  4. Open and run: database\schema.sql" -ForegroundColor White
Write-Host ""
Write-Host "After running the schema, press any key to seed the database..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Seed the database
Write-Host "`nSeeding database..." -ForegroundColor Yellow
cd database
node seed.js
cd ..

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host "You can now test the API!" -ForegroundColor Green
