import api from './authService';

export const timeSlotService = {
    getTimeSlots: async () => {
        const response = await api.get('/timeslots');
        return response.data;
    },

    addTimeSlot: async (slotData) => {
        // slotData: { start_time, end_time, max_orders }
        const response = await api.post('/timeslots', slotData);
        return response.data;
    },

    updateTimeSlot: async (id, updateData) => {
        // updateData: { max_orders, is_active }
        const response = await api.put(`/timeslots/${id}`, updateData);
        return response.data;
    },

    getAvailableSlots: async () => {
        const response = await api.get('/timeslots/available');
        return response.data;
    },

    resetTimeSlotCount: async (id) => {
        const response = await api.post(`/timeslots/${id}/reset`);
        return response.data;
    },
    deleteTimeSlot: async (id) => {
        const response = await api.delete(`/timeslots/${id}`);
        return response.data;
    }
};
