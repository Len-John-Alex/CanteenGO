# 🚀 Installation Guide

Follow these steps to set up **CanteenGO** on your local system from GitHub.

## 📋 Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/) (Project uses `pg` driver)
- [Git](https://git-scm.com/)

---

## 🛠️ Step 1: Database Setup

1. **Create Database**:
   Log in to your PostgreSQL terminal (`psql`) and run:
   ```sql
   CREATE DATABASE college_canteen;
   ```

2. **Run Schema**:
   Navigate to the project root and run the schema file:
   ```bash
   psql -U your_username -d college_canteen -f database/schema.sql
   ```

3. **Seed Initial Data**:
   Navigate to the `database` folder, install dependencies, and run the seed script:
   ```bash
   cd database
   npm install
   node seed.js
   ```

---

## ⚙️ Step 2: Backend Configuration

1. **Navigate to Backend**:
   ```bash
   cd backend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the `backend` directory (copy from `.env.example`):
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_postgres_username
   DB_PASSWORD=your_postgres_password
   DB_NAME=college_canteen
   DB_PORT=5432
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRE=7d
   ```

4. **Start Backend**:
   ```bash
   npm start
   ```

---

## 💻 Step 3: Frontend Configuration

1. **Navigate to Frontend**:
   ```bash
   cd ../frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Frontend**:
   ```bash
   npm start
   ```

---

## 🚀 Quick Launch (Windows)

Once configured, you can use the provided batch file to start both servers at once:
- Run `launch_app.bat` from the project root.

## 🔑 Test Credentials

| Role | Username | Password |
|---|---|---|
| **Student** | `STU001` | `password123` |
| **Staff** | `STAFF036` | `whatisthepassword` |
