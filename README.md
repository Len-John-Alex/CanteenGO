# CanteenGO 🍽️

![CanteenGO Logo](frontend/src/assets/logo.jpeg)

CanteenGO is a modern, full-stack Canteen Management System designed to streamline food ordering in educational institutions. It eliminates long queues by allowing students to pre-order meals for specific time slots and provides staff with a robust dashboard for order fulfillment and inventory management.

## ✨ Key Features

### 👨‍🎓 For Students
- **Smart Pre-ordering**: Select specific time slots to pick up meals.
- **Real-time Stock**: View meal availability and low-stock warnings.
- **Favourites & Feedback**: Save your top picks and provide feedback on meals.
- **Digital Receipts**: Instant access to order history and QR-coded receipts.

### 👩‍🍳 For Staff
- **Order Management**: Real-time dashboard to process and verify orders.
- **Integrated Scanner**: Fast order verification via QR code scanning.
- **Menu Control**: Update item availability, prices, and stock levels instantly.
- **Time Slot Management**: Define and manage pick-up windows and order capacities.
- **Revenue Analytics**: Visual dashboards for monitoring sales and performance.

## 🛠️ Tech Stack

- **Frontend**: React.js, React Router, Context API, CSS3
- **Backend**: Node.js, Express.js
- **Database**: MySQL (relational schema for high integrity)
- **Security**: JWT-based Authentication, Bcrypt Password Hashing, Environment-based configuration

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MySQL](https://www.mysql.com/)

### 1. Repository Setup
```bash
git clone https://github.com/yourusername/canteengo.git
cd canteengo
```

### 2. Database Configuration
1. Initialize your MySQL database using the provided schema:
   ```bash
   mysql -u your_user -p < database/schema.sql
   ```
2. (Optional) Populate with starting data:
   ```bash
   cd database
   node seed.js
   ```

### 3. Environment Variables
CanteenGO uses `.env` files for secure configuration. Create these from the provided templates:

**Backend (`/backend/.env`):**
```bash
cp backend/.env.example backend/.env
```
*Update `backend/.env` with your DB credentials, JWT secret, and email service settings.*

**Frontend (`/frontend/.env`):**
```bash
cp frontend/.env.example frontend/.env
```
*Ensure `REACT_APP_API_URL` points to your backend instance.*

### 4. Installation & Launch
From the project root:
```bash
# Install and start the application
./launch_app.bat
```
*Note: If on Linux/OSX, run `npm install` and `npm start` in both `backend` and `frontend` directories.*

## 📂 Project Structure
```
├── backend/            # Express API server
│   ├── config/         # Database & connection pools
│   ├── controllers/    # Business logic
│   ├── routes/         # API endpoints
│   └── utils/          # JWT, Email, and Helper utilities
├── frontend/           # React SPA
│   ├── src/assets/     # Branding & Images
│   ├── src/components/ # Reusable UI components
│   └── src/pages/      # View components & Routing
└── database/           # SQL Schema & Seed scripts
```

## 🔒 Security
- Always change the `JWT_SECRET` in production.
- Ensure all `.env` files are added to your `.gitignore` (pre-configured).
- Never commit real passwords or email API keys to the repository.

## 📄 License
© 2026 CanteenGO. All rights reserved. Licensed under the ISC License.
