import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedbackService } from '../services/feedbackService';
import { useNotification } from '../context/NotificationContext';
import './StaffFeedbackPage.css';

const StaffFeedbackPage = () => {
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [feedbackToDelete, setFeedbackToDelete] = useState(null);
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    useEffect(() => {
        fetchFeedback();
    }, []);

    const handleDeleteClick = (feedback) => {
        setFeedbackToDelete(feedback);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!feedbackToDelete) return;

        const feedbackId = feedbackToDelete.id;
        console.log(`Confirming deletion for feedback ID: ${feedbackId}`);

        try {
            await feedbackService.deleteFeedback(feedbackId);
            setFeedbackList(prev => prev.filter(f => f.id !== feedbackId));
            showNotification('Feedback deleted successfully', 'success');
        } catch (err) {
            console.error('Failed to delete feedback:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete feedback';
            showNotification(errorMessage, 'error');
        } finally {
            setShowDeleteModal(false);
            setFeedbackToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setFeedbackToDelete(null);
    };

    const groupFeedbackByDate = (feedback) => {
        const groups = {
            today: [],
            yesterday: [],
            older: []
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        feedback.forEach(item => {
            const itemDate = new Date(item.created_at);
            itemDate.setHours(0, 0, 0, 0);

            if (itemDate.getTime() === today.getTime()) {
                groups.today.push(item);
            } else if (itemDate.getTime() === yesterday.getTime()) {
                groups.yesterday.push(item);
            } else {
                groups.older.push(item);
            }
        });

        return groups;
    };

    const groupedFeedback = useMemo(() => groupFeedbackByDate(feedbackList), [feedbackList]);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const data = await feedbackService.getAllFeedback();
            setFeedbackList(data);
        } catch (err) {
            console.error('Failed to fetch feedback:', err);
            setError('Failed to load feedback');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderStars = (rating) => {
        return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    if (loading) {
        return <div className="staff-feedback-loading">Loading feedback...</div>;
    }

    if (error) {
        return (
            <div className="staff-feedback-error">
                <p>{error}</p>
                <button onClick={fetchFeedback} className="retry-button">Retry</button>
            </div>
        );
    }

    return (
        <div className="staff-feedback-container">
            <div className="staff-feedback-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    &larr; Back
                </button>
                <h2>💬 Student Feedback</h2>
                <p className="feedback-count">
                    {feedbackList.length} {feedbackList.length === 1 ? 'feedback' : 'feedbacks'} received
                </p>
            </div>

            {feedbackList.length === 0 ? (
                <div className="no-feedback">
                    <p>No feedback received yet.</p>
                </div>
            ) : (
                <div className="feedback-sections">
                    {Object.entries(groupedFeedback).map(([group, feedbackItems]) => (
                        feedbackItems.length > 0 && (
                            <div key={group} className="feedback-group">
                                <h3 className="group-header">
                                    {group === 'today' ? 'Today' : group === 'yesterday' ? 'Yesterday' : 'Older'}
                                </h3>
                                <div className="feedback-list">
                                    {feedbackItems.map((feedback) => (
                                        <div key={feedback.id} className="feedback-card">
                                            <div className="feedback-card-header">
                                                <div className="student-info">
                                                    <h3>{feedback.student_name}</h3>
                                                    <span className="student-id">{feedback.student_roll_no}</span>
                                                </div>
                                                <div className="feedback-actions">
                                                    <div className="feedback-meta">
                                                        <div className="rating">{renderStars(feedback.rating)}</div>
                                                        <div className="date">{formatDate(feedback.created_at)}</div>
                                                    </div>
                                                    <button
                                                        className="delete-feedback-btn"
                                                        onClick={() => handleDeleteClick(feedback)}
                                                        title="Delete feedback"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="feedback-message">
                                                {feedback.message}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            )}

            {showDeleteModal && feedbackToDelete && (
                <div className="modal-overlay" onClick={cancelDelete}>
                    <div className="modal-content feedback-delete-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Confirm Deletion</h2>
                            <button className="close-btn" onClick={cancelDelete}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete this feedback from <strong>{feedbackToDelete.student_name}</strong>?</p>
                            <div className="feedback-preview">
                                "{feedbackToDelete.message.substring(0, 100)}{feedbackToDelete.message.length > 100 ? '...' : ''}"
                            </div>
                            <p className="warning-text">This action cannot be undone.</p>
                            <div className="modal-footer">
                                <button className="cancel-btn" onClick={cancelDelete}>Cancel</button>
                                <button className="confirm-delete-btn" onClick={confirmDelete}>Delete Feedback</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffFeedbackPage;
