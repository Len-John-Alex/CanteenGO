import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/authService';

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
    const prevCountRef = useRef(-1); // Initialize with -1 to differentiate from 0 initial notifs
    const [isConnected, setIsConnected] = useState(true);

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
            const res = await api.get('/notifications');
            const data = Array.isArray(res.data) ? res.data : [];

            setIsConnected(true);

            console.log(`[Notifications] Fetched ${data.length} notifications. isInitial: ${isInitial}, prevCount: ${prevCountRef.current}`);

            // If we have new notifications and it's not the first load, show a toast
            if (!isInitial && prevCountRef.current !== -1 && data.length > prevCountRef.current) {
                const newCount = data.length - prevCountRef.current;
                console.log(`[Notifications] ${newCount} new notifications detected!`);

                // Show toast for the most recent one
                const latestNotif = data[0];
                if (latestNotif) {
                    showNotification(latestNotif.message, 'info');
                }
            }

            prevCountRef.current = data.length;
            setPersistentNotifications(data);
        } catch (error) {
            console.error('[Notifications] Error fetching notifications:', error);
            setIsConnected(false);
        }
    }, [user, showNotification]);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get('/notifications/unread-count');
            const count = typeof res.data.count === 'number' ? res.data.count : 0;
            setUnreadCount(count);
            setIsConnected(true);
        } catch (error) {
            console.error('[Notifications] Error fetching unread count:', error);
            setIsConnected(false);
        }
    }, [user]);

    const markAsRead = useCallback(async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);

            setPersistentNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('[Notifications] Error marking as read:', error);
        }
    }, []);

    // Poll for new notifications
    useEffect(() => {
        if (user) {
            console.log('[Notifications] Initializing polling for user:', user.id);
            fetchNotifications(true); // Pass true for initial load to skip toast
            fetchUnreadCount();

            // Poll every 10 seconds for more "real-time" feel
            const interval = setInterval(() => {
                fetchNotifications();
                fetchUnreadCount();
            }, 10000);

            return () => {
                console.log('[Notifications] Cleaning up polling');
                clearInterval(interval);
            };
        } else {
            setPersistentNotifications([]);
            setUnreadCount(0);
            prevCountRef.current = -1;
            setIsConnected(true);
        }
    }, [user, fetchNotifications, fetchUnreadCount]);


    return (
        <NotificationContext.Provider value={{
            showNotification,
            notifications: persistentNotifications,
            unreadCount,
            fetchNotifications,
            markAsRead,
            isConnected
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
