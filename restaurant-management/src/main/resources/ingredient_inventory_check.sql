USE restaurant_db;

-- Check the legacy column that caused the INSERT failure.
SHOW COLUMNS FROM ingredients LIKE 'current_stock';

-- Check current inventory schema.
SHOW COLUMNS FROM inventory;
