const pool = require('../config/database');

const toggleFavourite = async (req, res) => {
    try {
        const student_id = req.user.id;
        const { menu_item_id } = req.body;

        if (!menu_item_id) {
            return res.status(400).json({ message: 'Menu item ID is required' });
        }

        // Check if already favourited
        const [existing] = await pool.execute(
            'SELECT * FROM favourites WHERE student_id = ? AND menu_item_id = ?',
            [student_id, menu_item_id]
        );

        if (existing.length > 0) {
            // Remove from favourites
            await pool.execute(
                'DELETE FROM favourites WHERE student_id = ? AND menu_item_id = ?',
                [student_id, menu_item_id]
            );
            return res.json({ message: 'Removed from favourites', isFavourite: false });
        } else {
            // Add to favourites
            await pool.execute(
                'INSERT INTO favourites (student_id, menu_item_id) VALUES (?, ?)',
                [student_id, menu_item_id]
            );
            return res.json({ message: 'Added to favourites', isFavourite: true });
        }
    } catch (error) {
        console.error('Toggle favourite error:', error);
        res.status(500).json({ message: 'Server error toggling favourite' });
    }
};

const getFavourites = async (req, res) => {
    try {
        const student_id = req.user.id;
        const [favourites] = await pool.execute(
            `SELECT m.* 
             FROM menu_items m
             JOIN favourites f ON m.id = f.menu_item_id
             WHERE f.student_id = ?`,
            [student_id]
        );
        res.json(favourites);
    } catch (error) {
        console.error('Get favourites error:', error);
        res.status(500).json({ message: 'Server error fetching favourites' });
    }
};

module.exports = {
    toggleFavourite,
    getFavourites
};
