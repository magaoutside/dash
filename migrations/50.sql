
CREATE TABLE pvp_games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  total_participants INTEGER NOT NULL DEFAULT 0,
  total_bet_amount REAL NOT NULL DEFAULT 0,
  winner_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pvp_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  user_data TEXT NOT NULL,
  bet_amount REAL NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0,
  win_percentage REAL NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pvp_game_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  participant_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  inventory_item_id INTEGER NOT NULL,
  gift_name TEXT NOT NULL,
  gift_icon TEXT NOT NULL,
  gift_background TEXT NOT NULL,
  gift_price REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pvp_games_status ON pvp_games(status);
CREATE INDEX idx_pvp_participants_game_id ON pvp_participants(game_id);
CREATE INDEX idx_pvp_participants_user_id ON pvp_participants(user_id);
CREATE INDEX idx_pvp_game_items_game_id ON pvp_game_items(game_id);
CREATE INDEX idx_pvp_game_items_participant_id ON pvp_game_items(participant_id);
