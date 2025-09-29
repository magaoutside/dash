
-- Drop the existing gifts_prices table 
DROP TABLE IF EXISTS gifts_prices;

-- Create the new gifts_prices table with name and price columns
CREATE TABLE gifts_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert all 90 gift prices from the external database
INSERT INTO gifts_prices (name, price) VALUES ('Snoop Cigar', 4.1);
INSERT INTO gifts_prices (name, price) VALUES ('Swag Bag', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Lol Pop', 1.87);
INSERT INTO gifts_prices (name, price) VALUES ('Homemade Cake', 1.89);
INSERT INTO gifts_prices (name, price) VALUES ('Valentine Box', 3.7);
INSERT INTO gifts_prices (name, price) VALUES ('Light Sword', 2.75);
INSERT INTO gifts_prices (name, price) VALUES ('Durov''s Cap', 593.5);
INSERT INTO gifts_prices (name, price) VALUES ('Lush Bouquet', 2.34);
INSERT INTO gifts_prices (name, price) VALUES ('Joyful Bundle', 2.48);
INSERT INTO gifts_prices (name, price) VALUES ('Diamond Ring', 13.99);
INSERT INTO gifts_prices (name, price) VALUES ('Astral Shard', 78.39);
INSERT INTO gifts_prices (name, price) VALUES ('Whip Cupcake', 1.91);
INSERT INTO gifts_prices (name, price) VALUES ('Skull Flower', 6.2);
INSERT INTO gifts_prices (name, price) VALUES ('Heroic Helmet', 185.0);
INSERT INTO gifts_prices (name, price) VALUES ('Ginger Cookie', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Snow Mittens', 3.0);
INSERT INTO gifts_prices (name, price) VALUES ('Cookie Heart', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Spiced Wine', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Big Year', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Restless Jar', 2.2);
INSERT INTO gifts_prices (name, price) VALUES ('Genie Lamp', 35.56);
INSERT INTO gifts_prices (name, price) VALUES ('Sleigh Bell', 5.4);
INSERT INTO gifts_prices (name, price) VALUES ('Holiday Drink', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Snoop Dogg', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Spy Agaric', 2.89);
INSERT INTO gifts_prices (name, price) VALUES ('Top Hat', 7.3);
INSERT INTO gifts_prices (name, price) VALUES ('Candy Cane', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Berry Box', 3.3);
INSERT INTO gifts_prices (name, price) VALUES ('Record Player', 8.5);
INSERT INTO gifts_prices (name, price) VALUES ('Love Candle', 5.8);
INSERT INTO gifts_prices (name, price) VALUES ('Xmas Stocking', 1.89);
INSERT INTO gifts_prices (name, price) VALUES ('Winter Wreath', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Easter Egg', 3.1);
INSERT INTO gifts_prices (name, price) VALUES ('Mad Pumpkin', 11.55);
INSERT INTO gifts_prices (name, price) VALUES ('Hex Pot', 2.44);
INSERT INTO gifts_prices (name, price) VALUES ('Bow Tie', 3.17);
INSERT INTO gifts_prices (name, price) VALUES ('Jelly Bunny', 2.99);
INSERT INTO gifts_prices (name, price) VALUES ('Pet Snake', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Snake Box', 1.85);
INSERT INTO gifts_prices (name, price) VALUES ('Lunar Snake', 1.84);
INSERT INTO gifts_prices (name, price) VALUES ('Tama Gadget', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Sakura Flower', 3.83);
INSERT INTO gifts_prices (name, price) VALUES ('Desk Calendar', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Neko Helmet', 22.22);
INSERT INTO gifts_prices (name, price) VALUES ('Vintage Cigar', 19.5);
INSERT INTO gifts_prices (name, price) VALUES ('Gem Signet', 55.89);
INSERT INTO gifts_prices (name, price) VALUES ('Party Sparkler', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Witch Hat', 2.29);
INSERT INTO gifts_prices (name, price) VALUES ('Hanging Star', 4.5);
INSERT INTO gifts_prices (name, price) VALUES ('Swiss Watch', 28.8);
INSERT INTO gifts_prices (name, price) VALUES ('Star Notepad', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Magic Potion', 51.7);
INSERT INTO gifts_prices (name, price) VALUES ('Toy Bear', 15.0);
INSERT INTO gifts_prices (name, price) VALUES ('Signet Ring', 20.99);
INSERT INTO gifts_prices (name, price) VALUES ('Jack-in-the-Box', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Santa Hat', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('B-Day Candle', 1.79);
INSERT INTO gifts_prices (name, price) VALUES ('Jester Hat', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Low Rider', 19.7);
INSERT INTO gifts_prices (name, price) VALUES ('Jingle Bells', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Snow Globe', 2.32);
INSERT INTO gifts_prices (name, price) VALUES ('Eternal Rose', 12.5);
INSERT INTO gifts_prices (name, price) VALUES ('Flying Broom', 8.65);
INSERT INTO gifts_prices (name, price) VALUES ('Love Potion', 7.9);
INSERT INTO gifts_prices (name, price) VALUES ('Voodoo Doll', 13.4);
INSERT INTO gifts_prices (name, price) VALUES ('Evil Eye', 3.2);
INSERT INTO gifts_prices (name, price) VALUES ('Bunny Muffin', 2.99);
INSERT INTO gifts_prices (name, price) VALUES ('Hypno Lollipop', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Heart Locket', 1800.0);
INSERT INTO gifts_prices (name, price) VALUES ('Bonded Ring', 46.0);
INSERT INTO gifts_prices (name, price) VALUES ('Electric Skull', 23.4);
INSERT INTO gifts_prices (name, price) VALUES ('Westside Sign', 40.98);
INSERT INTO gifts_prices (name, price) VALUES ('Eternal Candle', 2.7);
INSERT INTO gifts_prices (name, price) VALUES ('Scared Cat', 35.95);
INSERT INTO gifts_prices (name, price) VALUES ('Trapped Heart', 6.6);
INSERT INTO gifts_prices (name, price) VALUES ('Sharp Tongue', 29.15);
INSERT INTO gifts_prices (name, price) VALUES ('Loot Bag', 74.99);
INSERT INTO gifts_prices (name, price) VALUES ('Crystal Ball', 5.9);
INSERT INTO gifts_prices (name, price) VALUES ('Nail Bracelet', 99.99);
INSERT INTO gifts_prices (name, price) VALUES ('Mini Oscar', 73.99);
INSERT INTO gifts_prices (name, price) VALUES ('Kissed Frog', 24.6);
INSERT INTO gifts_prices (name, price) VALUES ('Perfume Bottle', 74.0);
INSERT INTO gifts_prices (name, price) VALUES ('Precious Peach', 250.0);
INSERT INTO gifts_prices (name, price) VALUES ('Cupid Charm', 8.44);
INSERT INTO gifts_prices (name, price) VALUES ('Ion Gem', 69.98);
INSERT INTO gifts_prices (name, price) VALUES ('Plush Pepe', 4689.0);
INSERT INTO gifts_prices (name, price) VALUES ('Ionic Dryer', 14.0);
INSERT INTO gifts_prices (name, price) VALUES ('Jolly Chimp', 2.5);
INSERT INTO gifts_prices (name, price) VALUES ('Moon Pendant', 2.0);
INSERT INTO gifts_prices (name, price) VALUES ('Stellar Rocket', 2.1);
