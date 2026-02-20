import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import './Notifications.css';

const Notifications = () => {
    const { notifications, unreadCount, markAsRead, isConnected } = useNotification();
    const [showList, setShowList] = useState(false);
    const wrapperRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowList(false);
            }
        };

        if (showList) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showList]);

    const handleNotificationClick = async (notif) => {
        // Mark as read if not already read
        if (!notif.is_read) {
            await markAsRead(notif.id);
        }

        // Hide dropdown
        setShowList(false);

        // Navigate based on type
        if (notif.recipient_type === 'staff') {
            if (notif.type === 'ORDER') {
                navigate('/staff-orders');
            } else if (notif.type === 'FEEDBACK') {
                navigate('/staff-feedback');
            } else {
                navigate('/dashboard');
            }
        } else if (notif.recipient_type === 'student') {
            if (notif.type === 'ORDER') {
                if (notif.order_id) {
                    navigate(`/receipt/${notif.order_id}`);
                } else {
                    navigate('/my-orders');
                }
            } else {
                navigate('/dashboard');
            }
        }
    };

    return (
        <div className="notifications-wrapper" ref={wrapperRef}>
            <button
                className={`notifications-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => setShowList(!showList)}
            >
                🔔 {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </button>

            {showList && (
                <div className="notifications-dropdown">
                    <div className="dropdown-header">
                        <h3>Notifications</h3>
                        <button
                            className="manual-refresh-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                fetchNotifications();
                            }}
                            title="Refresh"
                        >
                            ↻
                        </button>
                    </div>
                    {!isConnected && (
                        <div className="connection-error">
                            ⚠️ Connection lost. Retrying...
                        </div>
                    )}
                    <div className="notifications-list">
                        {notifications.length === 0 ? (
                            <p className="no-notifications">No notifications yet</p>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`notification-item ${n.is_read ? 'read' : 'unread'}`}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    <p className="notif-message">{n.message}</p>
                                    <span className="notif-time">
                                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {!n.is_read && <span className="mark-read-hint">Click to mark as read</span>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;
