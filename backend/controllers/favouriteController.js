const pool = require('../config/database');

const toggleFavourite = async (req, res) => {
    try {
        const student_id = req.user.id;
        const { menu_item_id } = req.body;

        if (!menu_item_id) {
            return res.status(400).json({ message: 'Menu item ID is required' });
        }

        // Check if already favourited
        const result = await pool.query(
            'SELECT * FROM favourites WHERE student_id = $1 AND menu_item_id = $2',
            [student_id, menu_item_id]
        );

        if (result.rows.length > 0) {
            // Remove from favourites
            await pool.query(
                'DELETE FROM favourites WHERE student_id = $1 AND menu_item_id = $2',
                [student_id, menu_item_id]
            );
            return res.json({ message: 'Removed from favourites', isFavourite: false });
        } else {
            // Add to favourites
            await pool.query(
                'INSERT INTO favourites (student_id, menu_item_id) VALUES ($1, $2)',
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
        const result = await pool.query(
            `SELECT m.* 
             FROM menu_items m
             JOIN favourites f ON m.id = f.menu_item_id
             WHERE f.student_id = $1`,
            [student_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get favourites error:', error);
        res.status(500).json({ message: 'Server error fetching favourites' });
    }
};

module.exports = {
    toggleFavourite,
    getFavourites
};
