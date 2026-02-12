import api from './authService';

export const menuService = {
  getMenuItems: async () => {
    const response = await api.get('/menu');
    return response.data;
  },
  addMenuItem: async (formData) => {
    const response = await api.post('/menu', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  updateMenuItem: async (id, formData) => {
    const response = await api.patch(`/menu/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  deleteMenuItem: async (id) => {
    const response = await api.delete(`/menu/${id}`);
    return response.data;
  }
};
