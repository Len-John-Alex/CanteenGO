import api from './authService';

export const studentService = {
    getAllStudents: async () => {
        const response = await api.get('/students');
        return response.data;
    },

    getStudentHistory: async (id) => {
        const response = await api.get(`/students/${id}/history`);
        return response.data;
    },

    deleteStudent: async (id) => {
        const response = await api.delete(`/students/${id}`);
        return response.data;
    }
};
