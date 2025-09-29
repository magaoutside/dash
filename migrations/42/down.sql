
-- Drop the new gifts_prices table
DROP TABLE IF EXISTS gifts_prices;

-- Recreate the original table structure exactly as it was
CREATE TABLE gifts_prices (
id INTEGER PRIMARY KEY AUTOINCREMENT,
background TEXT NOT NULL,
icon TEXT NOT NULL,
weight REAL NOT NULL,
price REAL NOT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
