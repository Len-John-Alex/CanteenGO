import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import FloatingCart from './FloatingCart';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = () => {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const sidebarRef = useRef(null);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                // If the click is NOT inside the sidebar AND NOT on the hamburger button
                if (!event.target.closest('.hamburger-btn')) {
                    setIsSidebarOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSidebarOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    return (
        <div className="layout-container">
            <Navbar toggleSidebar={toggleSidebar} />

            <div ref={sidebarRef}>
                <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
            </div>

            {/* Overlay to dim background and capture clicks when sidebar is open */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
                onClick={closeSidebar}
            ></div>

            <main className="main-content">
                <Outlet />
            </main>

            <footer className="footer">
                <div className="footer-content">
                    <p>&copy; {new Date().getFullYear()} CanteenGO. All rights reserved.</p>
                </div>
            </footer>

            {user?.role === 'student' && <FloatingCart />}
        </div>
    );
};

export default Layout;
