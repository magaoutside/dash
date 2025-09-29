
-- Добавляем уникальное ограничение на game_id в pvp_game_results чтобы предотвратить дублирование
CREATE UNIQUE INDEX IF NOT EXISTS idx_pvp_game_results_game_id ON pvp_game_results(game_id);
