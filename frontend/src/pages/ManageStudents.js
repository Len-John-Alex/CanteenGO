import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/studentService';
import { useNotification } from '../context/NotificationContext';
import './ManageStudents.css';

const ManageStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [history, setHistory] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const data = await studentService.getAllStudents();
            setStudents(data);
        } catch (err) {
            setError('Failed to fetch students');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (student) => {
        setStudentToDelete(student);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!studentToDelete) return;

        try {
            await studentService.deleteStudent(studentToDelete.id);
            setStudents(students.filter(s => s.id !== studentToDelete.id));
            showNotification('Student deleted successfully', 'success');
        } catch (err) {
            showNotification('Failed to delete student', 'error');
            console.error(err);
        } finally {
            setShowDeleteModal(false);
            setStudentToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setStudentToDelete(null);
    };

    const handleViewHistory = async (student) => {
        try {
            setSelectedStudent(student);
            const data = await studentService.getStudentHistory(student.id);
            setHistory(data.orders);
            setShowHistoryModal(true);
        } catch (err) {
            alert('Failed to fetch order history');
            console.error(err);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <div className="loading">Loading students...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="manage-students">
            <button className="back-btn" onClick={() => navigate('/dashboard')}>
                &larr; Back
            </button>
            <h1>Manage Students</h1>

            <div className="students-table-container">
                <table className="students-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Verified</th>
                            <th>Total Orders</th>
                            <th>Total Spent</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="no-data">No students found</td>
                            </tr>
                        ) : (
                            students.map(student => (
                                <tr key={student.id}>
                                    <td>{student.student_id}</td>
                                    <td>{student.name}</td>
                                    <td>{student.email || '-'}</td>
                                    <td>
                                        <span className={`status-badge ${student.is_verified ? 'verified' : 'pending'}`}>
                                            {student.is_verified ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td>{student.total_orders}</td>
                                    <td>₹{parseFloat(student.total_spent).toFixed(2)}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="view-btn"
                                                onClick={() => handleViewHistory(student)}
                                            >
                                                History
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteClick(student)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showHistoryModal && selectedStudent && (
                <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Order History: {selectedStudent.name}</h2>
                            <button className="close-btn" onClick={() => setShowHistoryModal(false)}>&times;</button>
                        </div>

                        <div className="modal-body">
                            {history && history.length > 0 ? (
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map(order => (
                                            <tr key={order.id}>
                                                <td>#{order.id}</td>
                                                <td>{formatDate(order.created_at)}</td>
                                                <td>₹{parseFloat(order.total_amount).toFixed(2)}</td>
                                                <td>
                                                    <span className={`order-status ${order.status.toLowerCase()}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="no-history">No order history found for this student.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && studentToDelete && (
                <div className="modal-overlay" onClick={cancelDelete}>
                    <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Confirm Deletion</h2>
                            <button className="close-btn" onClick={cancelDelete}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete <strong>{studentToDelete.name}</strong>?</p>
                            <p className="warning-text">This action cannot be undone.</p>
                            <div className="modal-footer">
                                <button className="cancel-btn" onClick={cancelDelete}>Cancel</button>
                                <button className="confirm-delete-btn" onClick={confirmDelete}>Delete Student</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageStudents;
