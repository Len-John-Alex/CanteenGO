import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [persistentNotifications, setPersistentNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    // TOAST NOTIFICATIONS
    const showNotification = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, closing: false }]);

        setTimeout(() => {
            setToasts(prev =>
                prev.map(n => n.id === id ? { ...n, closing: true } : n)
            );
        }, 3500);

        setTimeout(() => {
            setToasts(prev => prev.filter(n => n.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(n => n.id !== id));
    }, []);

    // PERSISTENT NOTIFICATIONS
    const fetchNotifications = useCallback(async (isInitial = false) => {
        if (!user) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();

                // If we have new notifications and it's not the first load, show a toast
                if (!isInitial && persistentNotifications.length > 0 && data.length > persistentNotifications.length) {
                    const newCount = data.length - persistentNotifications.length;
                    const latestNotif = data[0];
                    showNotification(latestNotif.message, 'info');
                }

                setPersistentNotifications(data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [user, persistentNotifications.length, showNotification]);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/notifications/unread-count', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, [user]);

    const markAsRead = useCallback(async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setPersistentNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }, []);

    // Poll for new notifications
    useEffect(() => {
        if (user) {
            fetchNotifications(true); // Pass true for initial load to skip toast
            fetchUnreadCount();

            // Poll every 10 seconds for more "real-time" feel
            const interval = setInterval(() => {
                fetchNotifications();
                fetchUnreadCount();
            }, 10000);

            return () => clearInterval(interval);
        } else {
            setPersistentNotifications([]);
            setUnreadCount(0);
        }
    }, [user, fetchNotifications, fetchUnreadCount]);


    return (
        <NotificationContext.Provider value={{
            showNotification,
            notifications: persistentNotifications,
            unreadCount,
            fetchNotifications,
            markAsRead
        }}>
            {children}
            <div className="global-toast-container">
                {toasts.map(n => (
                    <div
                        key={n.id}
                        className={`toast-message toast-${n.type} ${n.closing ? 'closing' : ''}`}
                        onClick={() => removeToast(n.id)}
                    >
                        <span className="toast-icon">
                            {n.type === 'success' && '✅'}
                            {n.type === 'error' && '❌'}
                            {n.type === 'info' && 'ℹ️'}
                            {n.type === 'warning' && '⚠️'}
                        </span>
                        <span className="toast-text">{n.message}</span>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
