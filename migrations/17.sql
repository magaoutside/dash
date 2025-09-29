
CREATE TABLE referral_earnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id TEXT NOT NULL,
  referee_id TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'topup',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
