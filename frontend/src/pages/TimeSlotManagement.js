import React, { useState, useEffect } from 'react';
import { timeSlotService } from '../services/timeSlotService';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import './TimeSlotManagement.css';

const TimeSlotManagement = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    // Form state
    const [formData, setFormData] = useState({
        start_time: '',
        end_time: '',
        max_orders: 50
    });

    useEffect(() => {
        fetchSlots();
    }, []);

    const fetchSlots = async () => {
        try {
            setLoading(true);
            const data = await timeSlotService.getTimeSlots();
            setSlots(data);
        } catch (err) {
            setError('Failed to load time slots');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'max_orders' ? parseInt(value) || 0 : value
        });
    };

    const handleAddSlot = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            // Ensure format is HH:MM:SS for backend
            const payload = {
                ...formData,
                start_time: formData.start_time.length === 5 ? `${formData.start_time}:00` : formData.start_time,
                end_time: formData.end_time.length === 5 ? `${formData.end_time}:00` : formData.end_time
            };
            await timeSlotService.addTimeSlot(payload);
            showNotification('Time slot added successfully!');
            setFormData({ start_time: '', end_time: '', max_orders: 50 });
            fetchSlots();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to add time slot');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await timeSlotService.updateTimeSlot(id, { is_active: !currentStatus });
            setSlots(slots.map(s => s.slot_id === id ? { ...s, is_active: !currentStatus } : s));
        } catch (err) {
            showNotification('Failed to update status', 'error');
        }
    };

    const handleUpdateMaxOrders = async (id, newMax) => {
        try {
            await timeSlotService.updateTimeSlot(id, { max_orders: newMax });
            setSlots(slots.map(s => s.slot_id === id ? { ...s, max_orders: newMax } : s));
        } catch (err) {
            showNotification('Failed to update max orders', 'error');
        }
    };

    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const handleResetClick = (slot) => {
        setSelectedSlot(slot);
        setShowResetModal(true);
    };

    const confirmReset = async () => {
        if (!selectedSlot) return;
        try {
            await timeSlotService.resetTimeSlotCount(selectedSlot.slot_id);
            setSlots(slots.map(s => s.slot_id === selectedSlot.slot_id ? { ...s, current_orders: 0 } : s));
            showNotification('Slot count reset successfully!');
            setShowResetModal(false);
            setSelectedSlot(null);
        } catch (err) {
            showNotification('Failed to reset count', 'error');
        }
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeleteClick = (slot) => {
        setSelectedSlot(slot);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!selectedSlot) return;
        try {
            await timeSlotService.deleteTimeSlot(selectedSlot.slot_id);
            setSlots(slots.filter(s => s.slot_id !== selectedSlot.slot_id));
            showNotification('Time slot deleted successfully!');
            setShowDeleteModal(false);
            setSelectedSlot(null);
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to delete time slot', 'error');
            setShowDeleteModal(false);
        }
    };

    if (loading) return <div className="mgmt-loading">Loading...</div>;

    return (
        <div className="mgmt-container">
            <div className="mgmt-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    &larr; Back
                </button>
                <h2>Manage Time Slots</h2>
            </div>

            {error && <div className="mgmt-error">{error}</div>}

            <div className="mgmt-grid">
                <section className="add-slot-section">
                    <h3>Add New Slot</h3>
                    <form onSubmit={handleAddSlot} className="add-slot-form">
                        <div className="form-group">
                            <label>Start Time (HH:MM)</label>
                            <input
                                type="time"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>End Time (HH:MM)</label>
                            <input
                                type="time"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Max Orders</label>
                            <input
                                type="number"
                                name="max_orders"
                                value={formData.max_orders}
                                onChange={handleInputChange}
                                min="1"
                                required
                            />
                        </div>
                        <button type="submit" className="submit-button">Add Slot</button>
                    </form>
                </section>

                <section className="slots-list-section">
                    <h3>Existing Slots</h3>
                    <div className="slots-table-wrapper">
                        <table className="slots-table">
                            <thead>
                                <tr>
                                    <th>Time Range</th>
                                    <th>Max Orders</th>
                                    <th>Current Orders</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slots.map((slot) => (
                                    <tr key={slot.slot_id} className={!slot.is_active ? 'inactive' : ''}>
                                        <td>{slot.start_time} - {slot.end_time}</td>
                                        <td>
                                            <input
                                                type="number"
                                                className="table-input"
                                                value={slot.max_orders}
                                                onChange={(e) => handleUpdateMaxOrders(slot.slot_id, parseInt(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td>{slot.current_orders || 0}</td>
                                        <td>
                                            <span className={`status-badge ${slot.is_active ? 'active' : 'disabled'}`}>
                                                {slot.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className={`toggle-button ${slot.is_active ? 'disable' : 'enable'}`}
                                                    onClick={() => handleToggleStatus(slot.slot_id, slot.is_active)}
                                                >
                                                    {slot.is_active ? 'Disable' : 'Enable'}
                                                </button>
                                                <button
                                                    className="reset-button"
                                                    onClick={() => handleResetClick(slot)}
                                                >
                                                    Reset
                                                </button>
                                                <button
                                                    className="delete-button"
                                                    onClick={() => handleDeleteClick(slot)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {showResetModal && selectedSlot && (
                <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Confirm Reset</h3>
                            <button className="close-btn" onClick={() => setShowResetModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p>Current orders for <strong>{selectedSlot.start_time} - {selectedSlot.end_time}</strong>: <strong>{selectedSlot.current_orders || 0}</strong></p>
                            <p>Are you sure you want to reset this count?</p>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowResetModal(false)}>Cancel</button>
                            <button className="confirm-btn delete" onClick={confirmReset}>Yes, Reset</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && selectedSlot && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Confirm Delete</h3>
                            <button className="close-btn" onClick={() => setShowDeleteModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete the time slot <strong>{selectedSlot.start_time} - {selectedSlot.end_time}</strong>?</p>
                            <p className="warning-text">This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="confirm-btn delete" onClick={confirmDelete}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeSlotManagement;
