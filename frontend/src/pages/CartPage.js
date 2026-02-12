import React, { useState, useEffect } from 'react';
import { cartService } from '../services/cartService';
import { timeSlotService } from '../services/timeSlotService';
import { orderService } from '../services/orderService';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import './CartPage.css';

const CartPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlotId, setSelectedSlotId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [orderNotes, setOrderNotes] = useState('');
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { user } = useAuth();

    useEffect(() => {
        fetchCart();
        fetchAvailableSlots();
    }, []);

    const fetchAvailableSlots = async () => {
        try {
            const slots = await timeSlotService.getAvailableSlots();
            setAvailableSlots(slots);
        } catch (err) {
            console.error('Failed to load available slots:', err);
        }
    };

    const fetchCart = async () => {
        try {
            setLoading(true);
            const items = await cartService.getCart();
            setCartItems(items);
        } catch (err) {
            setError('Failed to load cart items');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (menuItemId) => {
        try {
            await cartService.removeFromCart(menuItemId);
            setCartItems(cartItems.filter(item => item.menu_item_id !== menuItemId));
        } catch (err) {
            showNotification('Failed to remove item', 'error');
            console.error(err);
        }
    };

    const handleUpdateQuantity = async (menuItemId, newQuantity, stockLimit) => {
        if (newQuantity < 0) return;
        if (newQuantity > stockLimit) {
            showNotification(`Cannot exceed available stock of ${stockLimit}`, 'warning');
            return;
        }

        try {
            if (newQuantity === 0) {
                await handleRemove(menuItemId);
                return;
            }

            await cartService.updateCartItem(menuItemId, newQuantity);

            // Update local state
            setCartItems(cartItems.map(item => {
                if (item.menu_item_id === menuItemId) {
                    return {
                        ...item,
                        quantity: newQuantity,
                        total_price: (parseFloat(item.price) * newQuantity).toFixed(2)
                    };
                }
                return item;
            }));
        } catch (err) {
            console.error('Failed to update quantity:', err);
            showNotification(err.response?.data?.message || 'Failed to update quantity', 'error');
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + parseFloat(item.total_price), 0);
    };

    if (loading) return <div className="cart-loading">Loading cart...</div>;

    return (
        <div className="cart-container">
            <div className="cart-header">
                <div className="cart-header-top">
                    <button className="back-btn" onClick={() => navigate('/dashboard')}>
                        &larr; Back to Dashboard
                    </button>
                </div>
                <h2>Your Cart</h2>
            </div>

            {error && <div className="cart-error">{error}</div>}

            {cartItems.length === 0 ? (
                <div className="empty-cart">
                    <p>Your cart is empty.</p>
                    <button className="btn-primary-glass" onClick={() => navigate('/dashboard')}>Browse Menu</button>
                </div>
            ) : (
                <>
                    <div className="cart-items">
                        {cartItems.map((item) => (
                            <div key={item.id} className="cart-item">
                                <div className="item-info">
                                    <h3>{item.name}</h3>
                                    <p>Price: ₹{item.price}</p>
                                </div>
                                <div className="item-quantity-controls">
                                    <button
                                        onClick={() => handleUpdateQuantity(item.menu_item_id, item.quantity - 1, item.stock_quantity)}
                                        disabled={item.quantity <= 1}
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max={item.stock_quantity}
                                        value={item.quantity}
                                        onChange={(e) => handleUpdateQuantity(item.menu_item_id, parseInt(e.target.value) || 0, item.stock_quantity)}
                                    />
                                    <button
                                        onClick={() => handleUpdateQuantity(item.menu_item_id, item.quantity + 1, item.stock_quantity)}
                                        disabled={item.quantity >= item.stock_quantity}
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="item-total">
                                    <span>₹{parseFloat(item.total_price).toFixed(2)}</span>
                                </div>
                                <button
                                    className="remove-button"
                                    onClick={() => handleRemove(item.menu_item_id)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary">
                        <div className="time-slot-selection">
                            <h3>Select Pick-up Time Slot</h3>
                            <select
                                value={selectedSlotId}
                                onChange={(e) => setSelectedSlotId(e.target.value)}
                                className="slot-select"
                            >
                                <option value="">-- Choose a time slot --</option>
                                {availableSlots.map(slot => (
                                    <option
                                        key={slot.slot_id}
                                        value={slot.slot_id}
                                        disabled={slot.status === 'FULL'}
                                    >
                                        {slot.start_time} - {slot.end_time} ({slot.status === 'FULL' ? 'FULL' : `${slot.remaining_capacity} left`})
                                    </option>
                                ))}
                            </select>
                            {availableSlots.length === 0 && <p className="no-slots-text">No active time slots available at the moment.</p>}
                        </div>

                        <div className="order-notes-section">
                            <h3>Order Notes (Optional)</h3>
                            <textarea
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                                placeholder="Any special instructions for the canteen staff?"
                                className="order-notes-input"
                                maxLength="200"
                            />
                        </div>

                        <h3>Total: ₹{calculateTotal().toFixed(2)}</h3>
                        <button
                            className="checkout-button"
                            onClick={() => {
                                if (!selectedSlotId) {
                                    showNotification('Please select a pick-up time slot before proceeding.', 'warning');
                                    return;
                                }
                                setShowCheckoutModal(true);
                            }}
                        >
                            Proceed to Checkout
                        </button>
                    </div>

                    {showCheckoutModal && (
                        <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
                            <div className="modal-content checkout-confirm-modal" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Confirm Your Order</h2>
                                    <button className="close-btn" onClick={() => setShowCheckoutModal(false)}>&times;</button>
                                </div>
                                <div className="modal-body">
                                    <div className="order-summary-preview">
                                        <h4>Order Summary</h4>
                                        <div className="summary-items">
                                            {cartItems.map(item => (
                                                <div key={item.id} className="summary-item">
                                                    <span>{item.name} x {item.quantity}</span>
                                                    <span>₹{parseFloat(item.total_price).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="summary-total">
                                            <span>Total Amount:</span>
                                            <span>₹{calculateTotal().toFixed(2)}</span>
                                        </div>
                                        <div className="summary-slot">
                                            <span>Pick-up Slot:</span>
                                            <strong>{availableSlots.find(s => s.slot_id === parseInt(selectedSlotId))?.start_time} - {availableSlots.find(s => s.slot_id === parseInt(selectedSlotId))?.end_time}</strong>
                                        </div>
                                        {orderNotes && (
                                            <div className="summary-notes">
                                                <span>Note:</span>
                                                <p>"{orderNotes}"</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="confirmation-text">Are you sure you want to place this order?</p>
                                    <div className="modal-footer">
                                        <button className="cancel-btn" onClick={() => setShowCheckoutModal(false)}>Back to Cart</button>
                                        <button className="confirm-checkout-btn" onClick={async () => {
                                            try {
                                                setShowCheckoutModal(false);
                                                // 1. Server-side validation
                                                await orderService.checkout(parseInt(selectedSlotId));

                                                // 2. Simulate Payment Process
                                                showNotification('Processing payment...', 'info');
                                                await new Promise(resolve => setTimeout(resolve, 1000));

                                                // 3. Complete order and atomically increment slot count
                                                const result = await orderService.completeOrder(parseInt(selectedSlotId), orderNotes);

                                                showNotification(result.message || 'Order placed successfully!', 'success');
                                                navigate(`/receipt/${result.orderId}`);
                                            } catch (err) {
                                                const message = err.response?.data?.message || 'Order process failed. Please try again.';
                                                showNotification(message, 'error');
                                                if (message.includes('Slot full') || message.includes('active')) {
                                                    fetchAvailableSlots();
                                                }
                                            }
                                        }}>
                                            Confirm Order
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CartPage;
