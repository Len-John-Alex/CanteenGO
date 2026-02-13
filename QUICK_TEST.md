# Quick Test Commands

## Step 1: Start Backend Server
```powershell
cd backend
npm start
```

## Step 2: Test Login (in a new terminal)
```powershell
# Student Login
$body = @{studentId="STU001"; password="password123"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login/student" -Method Post -ContentType "application/json" -Body $body
$token = $response.token
Write-Host "Token: $token"
```

## Step 3: Test Menu API
```powershell
$headers = @{Authorization="Bearer $token"}
$menu = Invoke-RestMethod -Uri "http://localhost:5000/api/menu" -Method Get -Headers $headers
$menu.data | Format-Table name, price, stockStatus, quantity
```

## Step 4: Test Current User
```powershell
$user = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method Get -Headers $headers
Write-Host "Logged in as: $($user.user.name) ($($user.user.role))"
```
