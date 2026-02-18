const pool = require('../config/database');

const getMenuItems = async (req, res) => {
  try {
    // Fetch all menu items that are available
    const result = await pool.query(
      'SELECT * FROM menu_items WHERE is_available = TRUE ORDER BY category, name'
    );
    const menuItems = result.rows;

    // Process menu items to add stock status
    const processedItems = menuItems.map(item => {
      let stockStatus = 'In Stock';

      // If quantity = 0 → mark as Out of Stock
      if (item.quantity === 0) {
        stockStatus = 'Out of Stock';
      }
      // If quantity is below low_stock_threshold → mark as Limited Stock
      else if (item.quantity < item.low_stock_threshold) {
        stockStatus = 'Limited Stock';
      }

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price),
        category: item.category,
        quantity: item.quantity,
        lowStockThreshold: item.low_stock_threshold,
        stockStatus: stockStatus,
        imageUrl: item.image_url,
        isAvailable: item.is_available === true,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      };
    });

    // Return data formatted for frontend
    res.json({
      success: true,
      data: processedItems,
      count: processedItems.length
    });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching menu items'
    });
  }
};

const addMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, quantity, lowStockThreshold } = req.body;
    const imageUrl = req.file ? req.file.path : null;

    const result = await pool.query(
      'INSERT INTO menu_items (name, description, price, category, quantity, low_stock_threshold, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [name, description, price, category, quantity || 0, lowStockThreshold || 10, imageUrl]
    );

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      itemId: result.rows[0].id
    });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, quantity, lowStockThreshold, isAvailable } = req.body;

    let query = 'UPDATE menu_items SET name=$1, description=$2, price=$3, category=$4, quantity=$5, low_stock_threshold=$6, is_available=$7';
    let params = [name, description, price, category, quantity, lowStockThreshold, isAvailable === 'true' || isAvailable === true];

    if (req.file) {
      query += `, image_url=$${params.length + 1}`;
      params.push(req.file.path);
    }

    query += ` WHERE id=$${params.length + 1}`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, message: 'Menu item updated successfully' });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM menu_items WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, message: 'Menu item removed successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem
};
