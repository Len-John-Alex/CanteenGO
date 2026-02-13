# Quick Setup Guide

## Step 1: Database Setup

1. Create MySQL database:
   ```sql
   CREATE DATABASE college_canteen;
   ```

2. Run the schema:
   ```bash
   mysql -u root -p college_canteen < database/schema.sql
   ```

## Step 2: Backend Setup

1. Navigate to backend:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=college_canteen
   JWT_SECRET=your-secret-key-change-this-in-production
   JWT_EXPIRE=7d
   ```

4. Seed the database (from project root):
   ```bash
   cd database
   npm install
   node seed.js
   ```

5. Start backend:
   ```bash
   cd ../backend
   npm start
   ```

## Step 3: Frontend Setup

1. Navigate to frontend:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start frontend:
   ```bash
   npm start
   ```

## Test Credentials

- **Student**: STU001 / whatisthepassword
- **Staff**: STAFF036 / whatisthepassword
