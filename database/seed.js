const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'college_canteen',
  port: process.env.DB_PORT || process.env.PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function seedDatabase() {
  try {
    // Hash password for sample users
    const studentPassword = await bcrypt.hash('password123', 10);
    const staffPassword = await bcrypt.hash('whatisthepassword', 10);

    await pool.execute(
      'INSERT INTO students (student_id, name, email, password, is_verified) VALUES (?, ?, ?, ?, TRUE) ON DUPLICATE KEY UPDATE name=name',
      ['STU001', 'John Doe', 'john.doe@college.edu', studentPassword]
    );

    await pool.execute(
      'INSERT INTO students (student_id, name, email, password, is_verified) VALUES (?, ?, ?, ?, TRUE) ON DUPLICATE KEY UPDATE name=name',
      ['STU002', 'Jane Smith', 'jane.smith@college.edu', studentPassword]
    );

    // Insert sample staff
    await pool.execute(
      'INSERT INTO staff (staff_id, name, email, password, is_verified) VALUES (?, ?, ?, ?, TRUE) ON DUPLICATE KEY UPDATE name=name',
      ['STAFF036', 'Admin User', 'admin@college.edu', staffPassword]
    );

    // Insert sample menu items
    const menuItems = [
      // In Stock items
      ['Chicken Biryani', 'Delicious basmati rice with tender chicken pieces', 120.00, 'Main Course', 50, 10],
      ['Vegetable Fried Rice', 'Stir-fried rice with mixed vegetables', 80.00, 'Main Course', 30, 10],
      ['Chicken Curry', 'Spicy chicken curry with rice', 100.00, 'Main Course', 25, 10],
      ['Pasta Alfredo', 'Creamy pasta with parmesan cheese', 90.00, 'Main Course', 40, 10],

      // Limited Stock items (below threshold)
      ['Chicken Burger', 'Juicy chicken patty with fresh vegetables', 70.00, 'Fast Food', 5, 10],
      ['French Fries', 'Crispy golden fries', 40.00, 'Fast Food', 8, 10],
      ['Chocolate Cake', 'Rich chocolate cake slice', 60.00, 'Dessert', 7, 10],

      // Out of Stock items
      ['Pizza Margherita', 'Classic pizza with tomato and mozzarella', 150.00, 'Fast Food', 0, 10],
      ['Ice Cream', 'Vanilla ice cream scoop', 35.00, 'Dessert', 0, 10],

      // More items
      ['Samosa', 'Crispy fried pastry with spiced potatoes', 25.00, 'Snacks', 45, 10],
      ['Tea', 'Hot masala chai', 15.00, 'Beverages', 100, 10],
      ['Coffee', 'Hot coffee', 20.00, 'Beverages', 80, 10],
      ['Cold Drink', 'Carbonated soft drink', 25.00, 'Beverages', 60, 10],
      ['Sandwich', 'Vegetable sandwich with mayo', 50.00, 'Fast Food', 20, 10],
    ];

    for (const item of menuItems) {
      await pool.execute(
        `INSERT INTO menu_items (name, description, price, category, quantity, low_stock_threshold, is_available) 
         VALUES (?, ?, ?, ?, ?, ?, 1) 
         ON DUPLICATE KEY UPDATE 
           description=VALUES(description),
           price=VALUES(price),
           category=VALUES(category),
           quantity=VALUES(quantity),
           low_stock_threshold=VALUES(low_stock_threshold),
           is_available=1`,
        item
      );
    }

    console.log('Database seeded successfully!');
    console.log('Sample credentials:');
    console.log('Student - ID: STU001, Password: password123');
    console.log('Staff - ID: STAFF036, Password: whatisthepassword');
    console.log(`\nAdded ${menuItems.length} menu items with various stock levels.`);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit();
  }
}

seedDatabase();
