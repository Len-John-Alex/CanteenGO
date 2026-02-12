import api from './authService';

export const orderService = {
    checkout: async (slotId) => {
        const response = await api.post('/orders/checkout', { slot_id: slotId });
        return response.data;
    },
    completeOrder: async (slotId, orderNotes) => {
        const response = await api.post('/orders/complete', { slot_id: slotId, order_notes: orderNotes });
        return response.data;
    },
    cancelOrder: async (slotId) => {
        const response = await api.post('/orders/cancel', { slot_id: slotId });
        return response.data;
    },
    getOrderDetails: async (orderId) => {
        const response = await api.get(`/orders/${orderId}`);
        return response.data;
    },
    getStaffOrders: async (status) => {
        const url = status ? `/orders/staff?status=${status}` : '/orders/staff';
        const response = await api.get(url);
        return response.data;
    },
    updateStatus: async (orderId, status) => {
        const response = await api.patch(`/orders/${orderId}/status`, { status });
        return response.data;
    },
    getStudentOrders: async () => {
        const response = await api.get('/orders');
        return response.data;
    },
    getRevenueStats: async (month, year) => {
        let url = '/orders/revenue';
        if (month && year) {
            url += `?month=${month}&year=${year}`;
        }
        const response = await api.get(url);
        return response.data;
    },
    getStudentSpending: async () => {
        const response = await api.get('/orders/spending');
        return response.data;
    },
    hideOrder: async (orderId) => {
        const response = await api.patch(`/orders/${orderId}/hide`);
        return response.data;
    }
};
