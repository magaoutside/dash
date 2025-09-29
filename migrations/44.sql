
CREATE TABLE user_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  gift_name TEXT NOT NULL,
  gift_icon TEXT NOT NULL,
  gift_background TEXT NOT NULL,
  gift_price REAL NOT NULL DEFAULT 0,
  obtained_from TEXT NOT NULL DEFAULT 'case',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_inventory_user_id ON user_inventory(user_id);
