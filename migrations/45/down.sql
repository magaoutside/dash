
-- Удаляем добавленные подарки
DELETE FROM gifts_prices WHERE name IN (
  'Heart Locket', 'Neko Helmet', 'Toy Bear', 'Ionic Dryer', 
  'Love Potion', 'Valentine Box', 'Joyful Bundle',
  'Nail Bracelet', 'Bonded Ring', 'Genie Lamp', 'Swiss Watch',
  'Signet Ring', 'Cupid Charm', 'Sleigh Bell'
);
