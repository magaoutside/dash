
CREATE TABLE mines_wins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  user_data TEXT,
  bet_amount TEXT,
  win_amount TEXT,
  gems_found INTEGER,
  mines_count INTEGER,
  multiplier TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
