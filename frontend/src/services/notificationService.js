import api from './authService';

export const notificationService = {
    getNotifications: async () => {
        const response = await api.get('/notifications');
        return response.data;
    },
    markAsRead: async (id) => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    }
};
