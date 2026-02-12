import React, { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import './RevenueDashboard.css';

const RevenueDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const now = new Date();
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'yearly'
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    const years = [];
    for (let i = 2024; i <= now.getFullYear(); i++) {
        years.push(i);
    }

    useEffect(() => {
        fetchStats();
    }, [month, year, viewMode]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            // If yearly mode, we send 'all' as month
            const monthParam = viewMode === 'yearly' ? 'all' : month;
            const data = await orderService.getRevenueStats(monthParam, year);
            setStats(data);
        } catch (err) {
            showNotification('Failed to load revenue statistics', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !stats) return <div className="rev-loading">Loading statistics...</div>;

    return (
        <div className="revenue-container">
            <header className="revenue-header">
                <div className="header-top">
                    <button className="back-btn" onClick={() => navigate('/dashboard')}>
                        &larr; Back
                    </button>
                    <h1>Business Overview</h1>
                    <div className="view-mode-toggle">
                        <button
                            className={viewMode === 'monthly' ? 'active' : ''}
                            onClick={() => setViewMode('monthly')}
                        >
                            Monthly
                        </button>
                        <button
                            className={viewMode === 'yearly' ? 'active' : ''}
                            onClick={() => setViewMode('yearly')}
                        >
                            Yearly
                        </button>
                    </div>
                </div>

                <div className="revenue-filters">
                    {viewMode === 'monthly' && (
                        <div className="filter-group">
                            <label>Month:</label>
                            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                                {months.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="filter-group">
                        <label>Year:</label>
                        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            {stats && (
                <div className="revenue-grid">
                    <div className="stat-card">
                        <div className="stat-icon revenue">₹</div>
                        <div className="stat-info">
                            <h3>{viewMode === 'monthly' ? 'Monthly' : 'Yearly'} Revenue</h3>
                            <p className="stat-value">
                                ₹{(stats?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon orders">📦</div>
                        <div className="stat-info">
                            <h3>{viewMode === 'monthly' ? 'Monthly' : 'Yearly'} Orders</h3>
                            <p className="stat-value">{stats?.totalOrders || 0}</p>
                        </div>
                    </div>

                    <div className="stat-card most-sold">
                        <div className="stat-icon star">⭐</div>
                        <div className="stat-info">
                            <h3>{viewMode === 'monthly' ? 'Month' : 'Year'} Top Seller</h3>
                            {stats?.mostSoldItem ? (
                                <>
                                    <p className="stat-value">{stats.mostSoldItem.name}</p>
                                    <p className="stat-sub">{stats.mostSoldItem.totalQuantity} items sold</p>
                                </>
                            ) : (
                                <p className="stat-value">N/A</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {stats?.breakdown && stats.breakdown.length > 0 && (
                <div className="revenue-chart-section">
                    <h2>{viewMode === 'monthly' ? 'Daily Sales Distribution' : 'Monthly Revenue Performance'}</h2>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={stats.breakdown} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(value) => viewMode === 'yearly' ? months.find(m => m.value === value)?.label : value}
                                    label={{
                                        value: viewMode === 'monthly' ? 'Day of Month' : 'Month',
                                        position: 'insideBottom',
                                        offset: -10,
                                        fill: '#475569',
                                        fontSize: 14,
                                        fontWeight: 600
                                    }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(value) => `₹${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                        padding: '12px'
                                    }}
                                    formatter={(value) => [`₹${parseFloat(value).toFixed(2)}`, 'Revenue']}
                                    labelFormatter={(label) => viewMode === 'monthly' ? `Day ${label}` : months.find(m => m.value === label)?.label}
                                />
                                <Bar
                                    dataKey="value"
                                    fill="#6366f1"
                                    radius={[6, 6, 0, 0]}
                                    barSize={viewMode === 'monthly' ? 20 : 40}
                                >
                                    {stats.breakdown.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.value === Math.max(...stats.breakdown.map(d => d.value)) ? '#4f46e5' : '#818cf8'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="revenue-footer">
                <p>
                    * Statistics calculated from PAID, PREPARING, READY, and COMPLETED orders for
                    {viewMode === 'monthly' ? ` ${months.find(m => m.value === month).label} ${year}` : ` the year ${year}`}.
                </p>
            </div>
        </div>
    );
};

export default RevenueDashboard;
