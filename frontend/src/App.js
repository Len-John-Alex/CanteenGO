import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmail from './pages/VerifyEmail';
import StaffRegister from './pages/StaffRegister';
import StaffVerify from './pages/StaffVerify';
import Dashboard from './pages/Dashboard';
import CartPage from './pages/CartPage';
import TimeSlotManagement from './pages/TimeSlotManagement';
import StaffOrders from './pages/StaffOrders';
import MyOrders from './pages/MyOrders';
import ManageMenu from './pages/ManageMenu';
import OrderReceipt from './pages/OrderReceipt';
import RevenueDashboard from './pages/RevenueDashboard';
import FavouritesPage from './pages/FavouritesPage';
import FeedbackPage from './pages/FeedbackPage';
import StaffFeedbackPage from './pages/StaffFeedbackPage';
import ManageStudents from './pages/ManageStudents';
import StaffScanner from './pages/StaffScanner';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children || <Outlet />;
};

const StaffRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;

  if (user && user.role === 'staff') {
    return children || <Outlet />;
  }

  return <Navigate to="/dashboard" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/staff-register" element={<StaffRegister />} />
          <Route path="/staff-verify" element={<StaffVerify />} />

          {/* Protected Routes wrapped in Layout */}
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/receipt/:id" element={<OrderReceipt />} />
            <Route path="/favourites" element={<FavouritesPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />

            {/* Staff-only Routes also within Layout */}
            <Route element={<StaffRoute />}>
              <Route path="/manage-timeslots" element={<TimeSlotManagement />} />
              <Route path="/staff-orders" element={<StaffOrders />} />
              <Route path="/manage-menu" element={<ManageMenu />} />
              <Route path="/revenue" element={<RevenueDashboard />} />
              <Route path="/staff-feedback" element={<StaffFeedbackPage />} />
              <Route path="/manage-students" element={<ManageStudents />} />
              <Route path="/staff-scanner" element={<StaffScanner />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
