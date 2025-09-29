
CREATE TABLE banks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  currency TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO banks (currency, amount) VALUES ('ton', 0);
INSERT INTO banks (currency, amount) VALUES ('stars', 0);
