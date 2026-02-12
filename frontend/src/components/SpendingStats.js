import React, { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import './SpendingStats.css';

const SpendingStats = () => {
    const [stats, setStats] = useState({ dailySpending: 0, monthlySpending: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSpending = async () => {
            try {
                setLoading(true);
                const data = await orderService.getStudentSpending();
                setStats(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching spending stats:', err);
                setError('Could not load spending data');
            } finally {
                setLoading(false);
            }
        };

        fetchSpending();
    }, []);

    if (loading) return <div className="spending-loading">Loading spending summary...</div>;
    if (error) return <div className="spending-error">{error}</div>;

    return (
        <div className="spending-stats-container">
            <div className="spending-card daily">
                <div className="spending-icon">📅</div>
                <div className="spending-info">
                    <span className="spending-label">Daily Spending</span>
                    <span className="spending-value">₹{stats.dailySpending.toFixed(2)}</span>
                </div>
            </div>
            <div className="spending-card monthly">
                <div className="spending-icon">📊</div>
                <div className="spending-info">
                    <span className="spending-label">Monthly Spending</span>
                    <span className="spending-value">₹{stats.monthlySpending.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default SpendingStats;
