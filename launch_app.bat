@echo off
echo Starting College Canteen Management System...

:: Start Backend
echo Starting Backend Server...
start "Backend Server" cmd /c "cd backend && npm run dev"

:: Start Frontend
echo Starting Frontend Server...
start "Frontend Server" cmd /c "cd frontend && npm start"

echo.
echo Servers are starting in separate windows.
echo Please wait for the frontend to open in your browser (usually http://localhost:3000).
echo Backend is running on http://localhost:5000.
echo.
pause
