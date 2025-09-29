
ALTER TABLE user_wallets ADD COLUMN user_ip TEXT;
ALTER TABLE user_balances DROP COLUMN user_ip;
