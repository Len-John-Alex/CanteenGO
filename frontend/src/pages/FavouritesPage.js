import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { favouriteService } from '../services/favouriteService';
import { cartService } from '../services/cartService';
import { useNotification } from '../context/NotificationContext';
import './FavouritesPage.css';

const FavouritesPage = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [favourites, setFavourites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFavourites();
    }, []);

    const fetchFavourites = async () => {
        try {
            setLoading(true);
            const items = await favouriteService.getFavourites();
            setFavourites(items);
        } catch (err) {
            console.error('Failed to fetch favourites:', err);
            setError('Failed to load favourites');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavourite = async (itemId) => {
        try {
            await favouriteService.toggleFavourite(itemId);
            setFavourites(favourites.filter(item => item.id !== itemId));
            showNotification('Removed from favourites');
        } catch (err) {
            console.error('Failed to remove favourite:', err);
            showNotification('Failed to remove from favourites', 'error');
        }
    };

    const handleAddToCart = async (item) => {
        try {
            if (!item.is_available || item.quantity === 0) {
                showNotification('Item is out of stock!', 'warning');
                return;
            }

            await cartService.addToCart(item.id, 1);
            showNotification(`${item.name} added to cart!`);
        } catch (err) {
            console.error('Failed to add to cart:', err);
            showNotification('Failed to add to cart', 'error');
        }
    };

    if (loading) {
        return <div className="favourites-loading">Loading favourites...</div>;
    }

    if (error) {
        return (
            <div className="favourites-error">
                <p>{error}</p>
                <button onClick={fetchFavourites} className="retry-button">Retry</button>
            </div>
        );
    }

    return (
        <div className="favourites-container">
            <div className="favourites-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    &larr; Back
                </button>
                <h2>❤️ My Favourites</h2>
                <p className="favourites-count">{favourites.length} {favourites.length === 1 ? 'item' : 'items'}</p>
            </div>

            {favourites.length === 0 ? (
                <div className="no-favourites">
                    <p>You haven't added any favourites yet.</p>
                    <p>Browse the menu and click the heart icon to save your favorite items!</p>
                </div>
            ) : (
                <div className="favourites-grid">
                    {favourites.map(item => (
                        <div key={item.id} className="favourite-item-card">
                            <button
                                className="remove-favourite-btn"
                                onClick={() => handleRemoveFavourite(item.id)}
                                title="Remove from favourites"
                            >
                                ❤️
                            </button>
                            <div className="favourite-item-image">
                                {item.image_url ? (
                                    <img src={`http://localhost:5000${item.image_url}`} alt={item.name} />
                                ) : (
                                    <div className="no-img-placeholder">No Image</div>
                                )}
                            </div>
                            <div className="favourite-item-details">
                                <h3>{item.name}</h3>
                                <p className="favourite-item-description">{item.description}</p>
                                <div className="favourite-item-footer">
                                    <span className="favourite-item-price">₹{parseFloat(item.price).toFixed(2)}</span>
                                    <span className="favourite-item-category">{item.category}</span>
                                </div>
                                <button
                                    className={`add-to-cart-btn ${!item.is_available || item.quantity === 0 ? 'disabled' : ''}`}
                                    onClick={() => handleAddToCart(item)}
                                    disabled={!item.is_available || item.quantity === 0}
                                >
                                    {!item.is_available || item.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FavouritesPage;
