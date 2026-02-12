import React, { useState, useEffect } from 'react';
import { menuService } from '../services/menuService';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './ManageMenu.css';

const ManageMenu = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    // Modal/Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Food',
        quantity: '',
        lowStockThreshold: '',
        isAvailable: true
    });
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        try {
            setLoading(true);
            const response = await menuService.getMenuItems();
            setMenuItems(response.data || []);
        } catch (err) {
            showNotification('Failed to load menu items', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            category: 'Food',
            quantity: '50',
            lowStockThreshold: '10',
            isAvailable: true
        });
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description || '',
            price: item.price,
            category: item.category,
            quantity: item.quantity,
            lowStockThreshold: item.lowStockThreshold,
            isAvailable: item.isAvailable
        });
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
            if (imageFile) {
                data.append('image', imageFile);
            }

            if (editingItem) {
                await menuService.updateMenuItem(editingItem.id, data);
                showNotification('Item updated successfully!');
            } else {
                await menuService.addMenuItem(data);
                showNotification('Item added successfully!');
            }
            setIsModalOpen(false);
            fetchMenu();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Operation failed', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this item?')) return;
        try {
            await menuService.deleteMenuItem(id);
            showNotification('Item removed successfully!');
            fetchMenu();
        } catch (err) {
            showNotification('Failed to remove item', 'error');
        }
    };

    if (loading) return <div className="mgmt-loading">Loading menu management...</div>;

    return (
        <div className="manage-menu-container">
            <header className="manage-menu-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    &larr; Back
                </button>
                <h1>Manage Canteen Menu</h1>
                <button className="add-item-btn" onClick={handleOpenAdd}>+ Add New Item</button>
            </header>

            <div className="menu-mgmt-grid">
                {menuItems.map(item => (
                    <div key={item.id} className="mgmt-card">
                        <div className="mgmt-card-img">
                            {item.imageUrl ? (
                                <img src={`http://localhost:5000${item.imageUrl}`} alt={item.name} />
                            ) : (
                                <div className="no-img-placeholder">No Image</div>
                            )}
                        </div>
                        <div className="mgmt-card-content">
                            <h3>{item.name}</h3>
                            <p className="mgmt-price">₹{item.price.toFixed(2)}</p>
                            <p className="mgmt-stock">Stock: {item.quantity} (Low: {item.lowStockThreshold})</p>
                            <span className={`status-badge ${item.isAvailable ? 'active' : 'disabled'}`}>
                                {item.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                        </div>
                        <div className="mgmt-card-actions">
                            <button className="edit-btn" onClick={() => handleOpenEdit(item)}>Edit</button>
                            <button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name</label>
                                <input name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Price (₹)</label>
                                    <input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select name="category" value={formData.category} onChange={handleInputChange}>
                                        <option value="Food">Food</option>
                                        <option value="Snacks">Snacks</option>
                                        <option value="Beverages">Beverages</option>
                                        <option value="Desserts">Desserts</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Current Stock</label>
                                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Low Stock Alert</label>
                                    <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleInputChange} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Item Image</label>
                                <input type="file" accept="image/*" onChange={handleFileChange} />
                            </div>
                            <div className="form-group checkbox-group">
                                <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleInputChange} id="isAvailable" />
                                <label htmlFor="isAvailable">Item is available for order</label>
                            </div>
                            <div className="modal-buttons">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="save-btn">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageMenu;
