import api from './authService';

export const feedbackService = {
    submitFeedback: async (message, rating) => {
        const response = await api.post('/feedback/submit', { message, rating });
        return response.data;
    },
    getAllFeedback: async () => {
        const response = await api.get('/feedback/all');
        return response.data;
    },
    deleteFeedback: async (id) => {
        const response = await api.delete(`/feedback/${id}`);
        return response.data;
    }
};
