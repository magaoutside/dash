
ALTER TABLE user_balances ADD COLUMN user_ip TEXT;
ALTER TABLE user_wallets DROP COLUMN user_ip;
