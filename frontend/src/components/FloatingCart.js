import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../services/cartService';
import './FloatingCart.css';

const FloatingCart = () => {
    const navigate = useNavigate();
    const [itemCount, setItemCount] = useState(0);

    const fetchCartCount = async () => {
        try {
            const items = await cartService.getCart();
            const total = items.reduce((sum, item) => sum + item.quantity, 0);
            setItemCount(total);
        } catch (err) {
            console.error('Error fetching cart count:', err);
        }
    };

    useEffect(() => {
        fetchCartCount();
        // Listen for custom "cartUpdated" events if we want real-time updates
        const handleCartUpdate = () => fetchCartCount();
        window.addEventListener('cartUpdated', handleCartUpdate);

        // Also poll occasionally as fallback
        const interval = setInterval(fetchCartCount, 5000);

        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
            clearInterval(interval);
        };
    }, []);

    if (itemCount === 0) return null;

    return (
        <div className="floating-cart-container" onClick={() => navigate('/cart')}>
            <div className="floating-cart-icon">
                🛒
                <span className="cart-badge">{itemCount}</span>
            </div>
            <span className="floating-cart-text">View Cart</span>
        </div>
    );
};

export default FloatingCart;
