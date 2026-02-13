# Testing Guide - College Canteen API

This guide provides multiple ways to test the API endpoints.

## Prerequisites

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```
   Server should be running on `http://localhost:5000`

2. **Ensure database is set up:**
   - Run `database/schema.sql` in MySQL
   - Run `node database/seed.js` to add sample data

## Method 1: HTML Test Page (Easiest)

1. Open `test-api.html` in your web browser
2. The page provides a user-friendly interface to:
   - Login as Student or Staff
   - Fetch menu items
   - Get current user info
3. No additional tools needed!

## Method 2: PowerShell Script (Windows)

Run the PowerShell test script:

```powershell
.\test-api.ps1
```

This will automatically test:
- Student login
- Menu items API
- Current user API
- Staff login

## Method 3: Bash Script (Linux/Mac/Git Bash)

Run the bash test script:

```bash
chmod +x test-api.sh
./test-api.sh
```

## Method 4: Using cURL (Command Line)

### 1. Student Login
```bash
curl -X POST http://localhost:5000/api/auth/login/student \
  -H "Content-Type: application/json" \
  -d '{"studentId":"STU001","password":"whatisthepassword"}'
```

Save the token from the response.

### 2. Get Menu Items
```bash
curl -X GET http://localhost:5000/api/menu \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Staff Login
```bash
curl -X POST http://localhost:5000/api/auth/login/staff \
  -H "Content-Type: application/json" \
  -d '{"staffId":"STAFF036","password":"whatisthepassword"}'
```

## Method 5: Using Postman/Insomnia

### Setup Collection

1. **Create a new request: Student Login**
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/login/student`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "studentId": "STU001",
       "password": "whatisthepassword"
     }
     ```
   - Save the token from response to an environment variable `token`

2. **Create a new request: Get Menu Items**
   - Method: `GET`
   - URL: `http://localhost:5000/api/menu`
   - Headers: `Authorization: Bearer {{token}}`

3. **Create a new request: Get Current User**
   - Method: `GET`
   - URL: `http://localhost:5000/api/auth/me`
   - Headers: `Authorization: Bearer {{token}}`

4. **Create a new request: Staff Login**
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/login/staff`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "staffId": "STAFF036",
       "password": "whatisthepassword"
     }
     ```

## Method 6: Using Browser Console

Open browser console (F12) and run:

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:5000/api/auth/login/student', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ studentId: 'STU001', password: 'whatisthepassword' })
});
const loginData = await loginResponse.json();
const token = loginData.token;
console.log('Token:', token);

// 2. Get Menu
const menuResponse = await fetch('http://localhost:5000/api/menu', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const menuData = await menuResponse.json();
console.log('Menu:', menuData);

// 3. Get Current User
const userResponse = await fetch('http://localhost:5000/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const userData = await userResponse.json();
console.log('User:', userData);
```

## Expected Responses

### Successful Login Response
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "studentId": "STU001",
    "name": "John Doe",
    "role": "student"
  }
}
```

### Menu Items Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Chicken Biryani",
      "description": "Delicious basmati rice...",
      "price": 120.00,
      "category": "Main Course",
      "quantity": 50,
      "lowStockThreshold": 10,
      "stockStatus": "In Stock",
      "isAvailable": true
    }
  ],
  "count": 14
}
```

### Stock Status Values
- `"Out of Stock"` - when quantity = 0
- `"Limited Stock"` - when quantity < low_stock_threshold
- `"In Stock"` - otherwise

## Troubleshooting

### CORS Error
- Make sure backend server is running
- Check that `cors` middleware is enabled in `backend/server.js`

### 401 Unauthorized
- Check that token is included in Authorization header
- Verify token format: `Bearer <token>`
- Token might be expired (default: 7 days)

### 500 Server Error
- Check database connection in `.env` file
- Verify database tables exist (run schema.sql)
- Check server console for error messages

### Connection Refused
- Ensure backend server is running on port 5000
- Check firewall settings
- Verify `PORT` in `.env` matches the URL you're using
