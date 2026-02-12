import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useNotification } from '../context/NotificationContext';
import './MyOrders.css';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await orderService.getStudentOrders();
            setOrders(data);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to load your orders. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleHideOrder = async () => {
        if (!orderToDelete) return;
        try {
            await orderService.hideOrder(orderToDelete.id);
            setOrders(orders.filter(o => o.id !== orderToDelete.id));
            showNotification('Order removed from your history');
            setShowDeleteModal(false);
            setOrderToDelete(null);
        } catch (err) {
            showNotification('Failed to remove order', 'error');
        }
    };

    const confirmDelete = (e, order) => {
        e.stopPropagation();
        setOrderToDelete(order);
        setShowDeleteModal(true);
    };

    const getStatusClass = (status) => {
        return `status-badge status-${status.toLowerCase()}`;
    };

    const groupOrders = (ordersToGroup) => {
        const groups = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const sorted = [...ordersToGroup].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        sorted.forEach(order => {
            const orderDate = new Date(order.created_at);
            orderDate.setHours(0, 0, 0, 0);

            let label;
            if (orderDate.getTime() === today.getTime()) {
                label = 'Today';
            } else if (orderDate.getTime() === yesterday.getTime()) {
                label = 'Yesterday';
            } else {
                label = orderDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });
            }

            let group = groups.find(g => g.label === label);
            if (!group) {
                group = { label, orders: [] };
                groups.push(group);
            }
            group.orders.push(order);
        });

        return groups;
    };

    if (loading) return <div className="loading-container">Loading your orders...</div>;

    const orderGroups = groupOrders(orders);

    return (
        <div className="my-orders-container">
            <header className="my-orders-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    &larr; Back
                </button>
                <h1>My Orders</h1>
            </header>

            {error && <div className="error-message">{error}</div>}

            <div className="orders-list">
                {orders.length === 0 ? (
                    <div className="no-orders">
                        <p>You haven't placed any orders yet.</p>
                        <button onClick={() => navigate('/dashboard')} className="order-now-btn">Order Now</button>
                    </div>
                ) : (
                    orderGroups.map(group => (
                        <div key={group.label} className="order-group">
                            <h2 className="order-group-title">{group.label}</h2>
                            <div className="order-group-content">
                                {group.orders.map(order => (
                                    <div key={order.id} className="order-card" onClick={() => navigate(`/receipt/${order.id}`)}>
                                        <div className="order-card-header">
                                            <div className="header-left">
                                                <span className="order-number">Order #{order.id}</span>
                                                <span className={getStatusClass(order.status)}>{order.status}</span>
                                            </div>
                                            <button
                                                className="order-delete-btn"
                                                onClick={(e) => confirmDelete(e, order)}
                                                title="Remove from history"
                                            >
                                                &times;
                                            </button>
                                        </div>

                                        <div className="order-card-body">
                                            <div className="order-items-summary">
                                                {order.items.map((item, idx) => (
                                                    <span key={item.id}>
                                                        {item.quantity}x {item.name}{idx < order.items.length - 1 ? ', ' : ''}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="order-info">
                                                <div className="info-item">
                                                    <span className="info-label">Pickup Slot:</span>
                                                    <span className="info-value">{order.start_time} - {order.end_time}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">Total Amount:</span>
                                                    <span className="info-value">₹{Number(order.total_amount).toFixed(2)}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">Time:</span>
                                                    <span className="info-value">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="order-card-footer">
                                            <span className="click-hint">Click to view receipt & QR code</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Remove Order</h3>
                            <button className="close-btn" onClick={() => setShowDeleteModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to remove <strong>Order #{orderToDelete?.id}</strong> from your history?</p>
                            <p className="modal-warning">This will only hide it from your view. Staff will still have a record of this order.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="confirm-btn delete" onClick={handleHideOrder}>Yes, Remove</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrders;
