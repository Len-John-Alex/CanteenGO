import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import logo from '../assets/logo.jpeg';
import './OrderReceipt.css';

const OrderReceipt = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await orderService.getOrderDetails(id);
                setOrder(data);
            } catch (err) {
                setError('Failed to load order receipt.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) return <div className="receipt-container">Loading receipt...</div>;
    if (error) return <div className="receipt-container error-text">{error}</div>;

    if (!order) return <div className="receipt-container">Order not found.</div>;

    // Generate QR Code URL using a public API
    const qrData = JSON.stringify({
        orderId: order.id,
        studentId: order.student_id,
        slot: `${order.start_time} - ${order.end_time}`,
        amount: order.total_amount
    });
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

    return (
        <div className="receipt-container">
            <div className="receipt-card">
                <div className="receipt-brand-header">
                    <img src={logo} alt="CanteenGO Logo" className="receipt-logo" />
                    <h1>CanteenGO</h1>
                </div>
                <div className="receipt-header">
                    <h2>Payment Successful!</h2>
                    <p className="order-id">Order ID: #{order.id}</p>
                </div>

                <div className="qr-section">
                    <img src={qrCodeUrl} alt="Order QR Code" className="qr-code" />
                    <p className="qr-hint">Show this QR at the counter for pickup</p>
                </div>

                <div className="time-slot-box">
                    <h3>Pickup Time Slot</h3>
                    <p className="slot-time">{order.start_time} - {order.end_time}</p>
                </div>

                {order.order_notes && (
                    <div className="receipt-notes">
                        <h3>Order Notes</h3>
                        <p>{order.order_notes}</p>
                    </div>
                )}

                <div className="order-summary">
                    <h3>Order Summary</h3>
                    <div className="items-list">
                        {order.items.map((item, index) => (
                            <div key={index} className="receipt-item">
                                <span>{item.name} x {item.quantity}</span>
                                <span>₹{(item.price_at_order * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="total-row">
                        <span>Total Amount</span>
                        <span>₹{parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                </div>

                <div className="receipt-actions">
                    <button onClick={() => window.print()} className="print-btn">Print Receipt</button>
                    <Link to="/dashboard" className="dashboard-btn">Back to Dashboard</Link>
                </div>
            </div>
        </div>
    );
};

export default OrderReceipt;
