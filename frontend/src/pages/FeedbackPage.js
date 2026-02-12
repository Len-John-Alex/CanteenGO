import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedbackService } from '../services/feedbackService';
import { useNotification } from '../context/NotificationContext';
import './FeedbackPage.css';

const FeedbackPage = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!message.trim()) {
            showNotification('Please enter your feedback message', 'warning');
            return;
        }

        try {
            setSubmitting(true);
            await feedbackService.submitFeedback(message, rating);
            showNotification('Thank you for your feedback! 🎉');
            setMessage('');
            setRating(5);
        } catch (err) {
            console.error('Failed to submit feedback:', err);
            showNotification('Failed to submit feedback. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="feedback-container">
            <div className="feedback-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    &larr; Back
                </button>
                <h2>📝 Submit Feedback</h2>
                <p>We'd love to hear your thoughts about our canteen!</p>
            </div>

            <form onSubmit={handleSubmit} className="feedback-form">
                <div className="form-group">
                    <label htmlFor="rating">Rating</label>
                    <div className="rating-selector">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className={`star-btn ${rating >= star ? 'active' : ''}`}
                                onClick={() => setRating(star)}
                                title={`${star} star${star > 1 ? 's' : ''}`}
                            >
                                {rating >= star ? '⭐' : '☆'}
                            </button>
                        ))}
                        <span className="rating-text">{rating} / 5</span>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="message">Your Feedback</label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Share your experience, suggestions, or any concerns..."
                        rows="6"
                        maxLength="500"
                        required
                    />
                    <div className="char-count">{message.length} / 500</div>
                </div>

                <button
                    type="submit"
                    className="submit-btn"
                    disabled={submitting || !message.trim()}
                >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
            </form>
        </div>
    );
};

export default FeedbackPage;
