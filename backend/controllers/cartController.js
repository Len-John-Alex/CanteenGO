const pool = require('../config/database');

const addToCart = async (req, res) => {
  try {
    const { menuItemId, quantity } = req.body;
    const studentId = req.user.id; // From auth middleware

    if (!menuItemId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Menu item ID and valid quantity are required' });
    }

    // Check if menu item exists and get stock
    const [menuItems] = await pool.execute(
      'SELECT id, name, price, quantity, is_available FROM menu_items WHERE id = ?',
      [menuItemId]
    );

    if (menuItems.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const menuItem = menuItems[0];

    if (!menuItem.is_available) {
      return res.status(400).json({ message: 'Item is not available' });
    }

    // Check if item is already in cart
    const [cartItems] = await pool.execute(
      'SELECT quantity FROM cart_items WHERE student_id = ? AND menu_item_id = ?',
      [studentId, menuItemId]
    );

    let currentCartQty = 0;
    if (cartItems.length > 0) {
      currentCartQty = cartItems[0].quantity;
    }

    const newTotalQty = currentCartQty + quantity;

    if (newTotalQty > menuItem.quantity) {
      return res.status(400).json({
        message: `Cannot add item. Available stock: ${menuItem.quantity}. You have ${currentCartQty} in cart.`
      });
    }

    if (cartItems.length > 0) {
      // Update existing cart item
      await pool.execute(
        'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE student_id = ? AND menu_item_id = ?',
        [newTotalQty, studentId, menuItemId]
      );
    } else {
      // Insert new cart item
      await pool.execute(
        'INSERT INTO cart_items (student_id, menu_item_id, quantity) VALUES (?, ?, ?)',
        [studentId, menuItemId, quantity]
      );
    }

    res.status(200).json({
      message: 'Item added to cart successfully',
      cart: {
        menuItemId,
        quantity: newTotalQty
      }
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error adding to cart' });
  }
};

const getCart = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [cartItems] = await pool.execute(
      `SELECT 
        c.id, 
        c.menu_item_id, 
        c.quantity, 
        m.name, 
        m.price, 
        m.image_url,
        m.quantity as stock_quantity,
        (m.price * c.quantity) as total_price
       FROM cart_items c
       JOIN menu_items m ON c.menu_item_id = m.id
       WHERE c.student_id = ?`,
      [studentId]
    );

    res.json(cartItems);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error retrieving cart' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const studentId = req.user.id;

    await pool.execute(
      'DELETE FROM cart_items WHERE student_id = ? AND menu_item_id = ?',
      [studentId, menuItemId]
    );

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error removing item' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { menuItemId, quantity } = req.body;
    const studentId = req.user.id;

    if (!menuItemId || quantity === undefined) {
      return res.status(400).json({ message: 'Menu item ID and quantity are required' });
    }

    if (quantity <= 0) {
      // If quantity is 0 or less, remove item
      await pool.execute(
        'DELETE FROM cart_items WHERE student_id = ? AND menu_item_id = ?',
        [studentId, menuItemId]
      );
      return res.json({ message: 'Item removed from cart', cart: { menuItemId, quantity: 0 } });
    }

    // Check stock
    const [menuItems] = await pool.execute(
      'SELECT quantity FROM menu_items WHERE id = ?',
      [menuItemId]
    );

    if (menuItems.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const stock = menuItems[0].quantity;

    if (quantity > stock) {
      return res.status(400).json({
        message: `Cannot update quantity. Available stock: ${stock}`
      });
    }

    await pool.execute(
      'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE student_id = ? AND menu_item_id = ?',
      [quantity, studentId, menuItemId]
    );

    res.json({
      message: 'Cart updated successfully',
      cart: { menuItemId, quantity }
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Server error updating cart' });
  }
};

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem
};
