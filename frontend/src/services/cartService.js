import api from './authService';

export const cartService = {
    addToCart: async (menuItemId, quantity) => {
        const response = await api.post('/cart/add', {
            menuItemId,
            quantity,
        });
        return response.data;
    },

    getCart: async () => {
        const response = await api.get('/cart');
        return response.data;
    },

    removeFromCart: async (menuItemId) => {
        const response = await api.delete(`/cart/${menuItemId}`);
        return response.data;
    },

    updateCartItem: async (menuItemId, quantity) => {
        const response = await api.put('/cart/update', {
            menuItemId,
            quantity,
        });
        return response.data;
    }
};
