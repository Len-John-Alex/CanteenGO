import api from './authService';

export const favouriteService = {
    toggleFavourite: async (menuItemId) => {
        const response = await api.post('/favourites/toggle', { menu_item_id: menuItemId });
        return response.data;
    },
    getFavourites: async () => {
        const response = await api.get('/favourites');
        return response.data;
    }
};
