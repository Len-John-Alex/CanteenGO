import React, { useState, useEffect } from 'react';
import { menuService } from '../services/menuService';
import { cartService } from '../services/cartService';
import { favouriteService } from '../services/favouriteService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './Menu.css';

const Menu = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [menuItems, setMenuItems] = useState([]);
  const [favourites, setFavourites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchMenuItems();
    if (user?.role === 'student') {
      fetchFavourites();
    }
  }, [user]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not logged in. Please login first.');
        setLoading(false);
        return;
      }

      const response = await menuService.getMenuItems();

      if (response && response.data) {
        const uniqueItems = response.data.filter((item, index, self) =>
          index === self.findIndex((t) => t.id === item.id)
        );
        setMenuItems(uniqueItems);
      } else if (response && Array.isArray(response)) {
        const uniqueItems = response.filter((item, index, self) =>
          index === self.findIndex((t) => t.id === item.id)
        );
        setMenuItems(uniqueItems);
      } else {
        setError('Invalid response format from server');
      }
    } catch (err) {
      let errorMessage = 'Failed to load menu items';
      if (err.response) {
        errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'Cannot connect to server. Is the backend running on http://localhost:5000?';
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (item) => {
    try {
      if (item.stockStatus === 'Out of Stock' || !item.isAvailable || item.quantity === 0) {
        showNotification('Item is out of stock!', 'warning');
        return;
      }

      const quantity = 1;
      await cartService.addToCart(item.id, quantity);

      setMenuItems(menuItems.map(menuItem => {
        if (menuItem.id === item.id) {
          const newQuantity = menuItem.quantity - quantity;
          return {
            ...menuItem,
            quantity: newQuantity,
            stockStatus: newQuantity === 0 ? 'Out of Stock' : (newQuantity < 10 ? 'Limited Stock' : 'In Stock'),
            isAvailable: newQuantity > 0
          };
        }
        return menuItem;
      }));

      showNotification(`${item.name} added to cart!`);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setError(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const fetchFavourites = async () => {
    try {
      const favItems = await favouriteService.getFavourites();
      const favIds = new Set(favItems.map(item => item.id));
      setFavourites(favIds);
    } catch (err) {
      console.error('Failed to fetch favourites:', err);
    }
  };

  const handleToggleFavourite = async (itemId) => {
    try {
      const result = await favouriteService.toggleFavourite(itemId);

      if (result.isFavourite) {
        setFavourites(prev => new Set([...prev, itemId]));
        showNotification('Added to favourites! ❤️');
      } else {
        setFavourites(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
        showNotification('Removed from favourites');
      }
    } catch (err) {
      console.error('Failed to toggle favourite:', err);
      showNotification('Failed to update favourites', 'error');
    }
  };

  const categories = ['All', ...new Set(menuItems.map(item => item.category))];

  const filteredItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'Out of Stock':
        return 'stock-out';
      case 'Limited Stock':
        return 'stock-limited';
      default:
        return 'stock-in';
    }
  };

  if (loading) {
    return <div className="menu-loading">Loading menu...</div>;
  }

  if (error) {
    return (
      <div className="menu-error">
        <p><strong>Error:</strong> {error}</p>
        <button onClick={fetchMenuItems} className="retry-button">Retry</button>
      </div>
    );
  }

  return (
    <div className="menu-container">
      <div className="menu-header">
        <h2>Menu</h2>
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              className={selectedCategory === category ? 'active' : ''}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="menu-grid">
        {filteredItems.map(item => (
          <div key={item.id} className="menu-item-card">
            {user?.role === 'student' && (
              <button
                className={`favourite-btn ${favourites.has(item.id) ? 'active' : ''}`}
                onClick={() => handleToggleFavourite(item.id)}
                title={favourites.has(item.id) ? 'Remove from favourites' : 'Add to favourites'}
              >
                {favourites.has(item.id) ? '❤️' : '🤍'}
              </button>
            )}
            <div className="menu-item-image">
              {item.imageUrl ? (
                <img src={`http://localhost:5000${item.imageUrl}`} alt={item.name} />
              ) : (
                <div className="no-img-placeholder">No Image</div>
              )}
            </div>

            <div className="menu-item-header">
              <div className="menu-item-title-row">
                <h3>{item.name}</h3>
                <span className="menu-item-price">₹{item.price.toFixed(2)}</span>
              </div>
              <div className="menu-item-status-row">
                <span className={`stock-badge ${getStockStatusColor(item.stockStatus)}`}>
                  {item.stockStatus}
                </span>
                {item.stockStatus === 'Limited Stock' && (
                  <span className="low-stock-warning">
                    Only {item.quantity} left!
                  </span>
                )}
              </div>
            </div>

            <div className="menu-item-content">
              <p className="menu-item-description">{item.description}</p>
              <div className="menu-item-footer">
                <span className="menu-item-category">{item.category}</span>
              </div>
            </div>

            {user?.role === 'student' && (
              <button
                className={`add-to-cart-btn ${item.stockStatus === 'Out of Stock' ? 'disabled' : ''}`}
                onClick={() => handleAddToCart(item)}
                disabled={item.stockStatus === 'Out of Stock'}
              >
                {item.stockStatus === 'Out of Stock' ? 'Out of Stock' : 'Add to Cart'}
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="no-items">No items found in this category.</div>
      )}
    </div>
  );
};

export default Menu;
