import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useNotification } from '../context/NotificationContext';
import './StaffOrders.css';

const StaffOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date'); // 'date' or 'amount'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const statusFilter = filter === 'all' ? null : filter;
            const data = await orderService.getStaffOrders(statusFilter);
            setOrders(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to load orders. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID': return 'status-pending';
            case 'PREPARING': return 'status-preparing';
            case 'READY': return 'status-ready';
            case 'COMPLETED': return 'status-completed';
            case 'CANCELLED': return 'status-cancelled';
            default: return '';
        }
    };

    const getDisplayStatus = (status) => {
        if (status === 'PAID') return 'PENDING';
        return status;
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await orderService.updateStatus(orderId, newStatus);
            fetchOrders(); // Refresh list
        } catch (err) {
            console.error('Error updating status:', err);
            showNotification('Failed to update status', 'error');
        }
    };

    const getNextStatusAction = (order) => {
        switch (order.status) {
            case 'PAID':
                return { label: 'Start Preparing', status: 'PREPARING', className: 'btn-preparing' };
            case 'PREPARING':
                return { label: 'Mark as Ready', status: 'READY', className: 'btn-ready' };
            case 'READY':
                return { label: 'Complete Pickup', status: 'COMPLETED', className: 'btn-complete' };
            default:
                return null;
        }
    };

    // Sorting and Grouping Logic
    const processedOrders = useMemo(() => {
        // 1. Sort
        let sorted = [...orders].sort((a, b) => {
            if (sortBy === 'date') {
                const dateA = new Date(a.created_at);
                const dateB = new Date(b.created_at);
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            } else if (sortBy === 'amount') {
                const amountA = parseFloat(a.total_amount);
                const amountB = parseFloat(b.total_amount);
                return sortOrder === 'desc' ? amountB - amountA : amountA - amountB;
            }
            return 0;
        });

        // 2. Nested Grouping: Date -> Time Slot
        const groups = {};
        const today = new Date().toLocaleDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString();

        sorted.forEach(order => {
            const orderDate = new Date(order.created_at).toLocaleDateString();
            let dateTitle = orderDate;

            if (orderDate === today) dateTitle = 'Today';
            else if (orderDate === yesterdayStr) dateTitle = 'Yesterday';

            const slotTitle = `${order.start_time.substring(0, 5)} - ${order.end_time.substring(0, 5)}`;

            if (!groups[dateTitle]) {
                groups[dateTitle] = {};
            }
            if (!groups[dateTitle][slotTitle]) {
                groups[dateTitle][slotTitle] = [];
            }
            groups[dateTitle][slotTitle].push(order);
        });

        return groups;
    }, [orders, sortBy, sortOrder]);

    return (
        <div className="staff-orders-container">
            <header className="staff-orders-header">
                <div className="header-top">
                    <button className="back-btn" onClick={() => navigate('/dashboard')}>
                        &larr; Back
                    </button>
                    <h1>Staff Order Management</h1>
                    <button onClick={fetchOrders} className="refresh-button btn-primary-glass">
                        <span>↻</span> Refresh
                    </button>
                </div>

                <div className="controls-row">
                    <div className="filter-tabs">
                        {['all', 'pending', 'preparing', 'ready', 'completed'].map((f) => (
                            <button
                                key={f}
                                className={`filter-tab ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div className="sort-controls">
                        <div className="sort-group">
                            <label>Sort by:</label>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="date">Date</option>
                                <option value="amount">Amount</option>
                            </select>
                        </div>
                        <div className="sort-group">
                            <label>Order:</label>
                            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                                <option value="desc">Descending</option>
                                <option value="asc">Ascending</option>
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            {error && <div className="error-message">{error}</div>}

            {loading && orders.length === 0 ? (
                <div className="loading">Loading orders...</div>
            ) : (
                <div className="orders-list">
                    {Object.keys(processedOrders).length === 0 ? (
                        <div className="no-orders">No orders found for this filter.</div>
                    ) : (
                        Object.entries(processedOrders).map(([dateTitle, slots]) => {
                            // Calculate daily total
                            const dayOrders = Object.values(slots).flat();
                            const dayTotal = dayOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

                            return (
                                <div key={dateTitle} className="date-group">
                                    <div className="group-header date-header">
                                        <h2 className="group-title">{dateTitle}</h2>
                                        <span className="group-summary day-summary">
                                            {dayOrders.length} {dayOrders.length === 1 ? 'order' : 'orders'} • ₹{dayTotal.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="slots-container">
                                        {Object.entries(slots).map(([slotTitle, slotOrders]) => {
                                            const slotTotal = slotOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
                                            return (
                                                <div key={slotTitle} className="slot-section">
                                                    <div className="slot-header">
                                                        <h3>🕒 {slotTitle}</h3>
                                                        <span className="slot-summary">
                                                            {slotOrders.length} {slotOrders.length === 1 ? 'order' : 'orders'} • ₹{slotTotal.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="group-orders-grid">
                                                        {slotOrders.map((order) => {
                                                            const nextAction = getNextStatusAction(order);
                                                            return (
                                                                <div key={order.id} className="order-card">
                                                                    <div className="order-main-info">
                                                                        <div className="order-id-group">
                                                                            <span className="order-id">ORD #{order.id}</span>
                                                                            <span className={`status-badge ${getStatusColor(order.status)}`}>
                                                                                {getDisplayStatus(order.status)}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="order-customer">
                                                                        <strong>Student:</strong> {order.student_name}
                                                                    </div>

                                                                    {order.order_notes && (
                                                                        <div className="order-notes">
                                                                            <span className="notes-label">Note:</span>
                                                                            <p className="notes-content">{order.order_notes}</p>
                                                                        </div>
                                                                    )}

                                                                    <div className="order-items-list">
                                                                        {order.items.map((item, idx) => (
                                                                            <div key={idx} className="order-item-row">
                                                                                <span>{item.quantity}x {item.name}</span>
                                                                                <span>₹{(item.price_at_order * item.quantity).toFixed(2)}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    <div className="order-footer">
                                                                        <div className="footer-left">
                                                                            <span className="total-amount">Total: ₹{parseFloat(order.total_amount).toFixed(2)}</span>
                                                                            <span className="order-date">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                        </div>
                                                                        {nextAction && (
                                                                            <button
                                                                                className={`status-action-btn ${nextAction.className}`}
                                                                                onClick={() => handleStatusUpdate(order.id, nextAction.status)}
                                                                            >
                                                                                {nextAction.label}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default StaffOrders;
