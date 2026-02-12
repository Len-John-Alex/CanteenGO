const pool = require('../config/database');

const getMenuItems = async (req, res) => {
  try {
    // Fetch all menu items that are available (is_available = 1 or TRUE)
    const [menuItems] = await pool.execute(
      'SELECT * FROM menu_items WHERE is_available = 1 ORDER BY category, name'
    );

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
        isAvailable: item.is_available === 1,
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
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.execute(
      'INSERT INTO menu_items (name, description, price, category, quantity, low_stock_threshold, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, category, quantity || 0, lowStockThreshold || 10, imageUrl]
    );

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      itemId: result.insertId
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

    let query = 'UPDATE menu_items SET name=?, description=?, price=?, category=?, quantity=?, low_stock_threshold=?, is_available=?';
    let params = [name, description, price, category, quantity, lowStockThreshold, isAvailable === 'true' || isAvailable === true];

    if (req.file) {
      query += ', image_url=?';
      params.push(`/uploads/${req.file.filename}`);
    }

    query += ' WHERE id=?';
    params.push(id);

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
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

    // Soft delete or hard delete? User said "remove", but usually soft delete is safer.
    // Let's go with hard delete for now as requested "remove an item".
    const [result] = await pool.execute('DELETE FROM menu_items WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
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
