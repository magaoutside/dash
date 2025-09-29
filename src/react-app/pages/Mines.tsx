import { useState, useRef, useEffect } from 'react';
import Lottie from 'lottie-react';
import UserHeader from '@/react-app/components/UserHeader';
import Footer from '@/react-app/components/Footer';
import { useBalance } from '@/react-app/hooks/useBalance';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { formatGiftPrice } from '@/react-app/utils/formatGiftPrice';

// Коэффициенты для мин
const MINES_MULTIPLIERS: Record<number, number[]> = {
  1: [1.01, 1.03, 1.07, 1.10, 1.13, 1.28, 1.24, 1.32, 1.45, 1.55, 1.67, 1.79, 1.96, 2.05, 2.17, 2.29, 2.56, 2.94, 3.22, 3.75, 5.19, 7.25, 10.37, 24.75],
  2: [1.05, 1.13, 1.20, 1.31, 1.46, 1.64, 1.84, 2.05, 2.27, 2.43, 2.96, 3.51, 4.2, 4.8, 5.6, 6.35, 8.61, 10.14, 15.8, 23.7, 41.5, 99, 297],
  3: [1.12, 1.29, 1.48, 1.71, 2.00, 2.35, 2.79, 3.35, 4.07, 5.00, 6.26, 7.96, 10.35, 13.8, 18.97, 27.11, 40.66, 65.06, 113.85, 227.7, 569.3, 2277],
  4: [1.18, 1.41, 1.71, 2.09, 2.58, 3.23, 4.09, 5.26, 6.88, 9.17, 12.51, 17.52, 25.3, 37.95, 59.64, 99.39, 178.91, 357.81, 834.9, 2504, 12523],
  5: [1.24, 1.56, 2.00, 2.58, 3.39, 4.52, 6.14, 8.5, 12.04, 17.52, 26.77, 40.87, 66.41, 113.9, 208.7, 417.45, 939.26, 2504, 8768, 52598],
  6: [1.3, 1.74, 2.35, 3.23, 4.52, 6.46, 9.44, 14.17, 21.89, 35.03, 58.38, 102.17, 189.75, 379.5, 834.9, 2087, 6261, 25047, 175329],
  7: [1.37, 1.94, 2.79, 4.09, 6.14, 9.44, 14.95, 24.47, 41.6, 73.95, 138.66, 277.33, 600.87, 1442, 3965, 13219, 59486, 475893],
  8: [1.46, 2.18, 3.35, 5.26, 8.5, 14.17, 24.47, 44.05, 83.2, 166.4, 356.56, 831.98, 2163, 6489, 23794, 118973, 1070759],
  9: [1.55, 2.47, 4.07, 6.88, 12.04, 21.89, 41.6, 83.2, 176.8, 404.1, 1010, 2828, 9193, 36773, 202254, 2022545],
  10: [1.65, 2.83, 5.00, 9.17, 17.52, 35.03, 73.95, 166.4, 404.1, 1077, 3232, 11314, 49031, 294188, 3236072],
  11: [1.77, 3.26, 6.26, 12.51, 26.27, 58.38, 138.66, 356.56, 1010, 3232, 12123, 56574, 367735, 4412826],
  12: [1.99, 3.81, 7.96, 17.52, 40.87, 102.17, 277.33, 831.98, 2828, 11314, 56574, 396022, 5148297],
  13: [2.06, 4.5, 10.35, 25.3, 66.41, 189.75, 600.87, 2163, 9193, 49031, 367735, 5148297],
  14: [2.25, 5.4, 13.8, 37.95, 113.9, 379.5, 1442, 6489, 36773, 294188, 4412826],
  15: [2.47, 6.6, 18.97, 59.64, 208.7, 834.9, 3965, 23794, 202254, 3236072],
  16: [2.75, 8.25, 27.11, 99.39, 417.5, 2087, 13219, 118973, 2022545],
  17: [3.09, 10.61, 40.66, 178.9, 939.3, 6261, 59486, 1070759],
  18: [3.54, 14.14, 65.06, 357.8, 2504, 25047, 475893],
  19: [4.12, 19.8, 113.9, 834.9, 8766, 175329],
  20: [4.95, 29.7, 227.7, 2504, 52598],
  21: [6.19, 49.5, 569.3, 12523],
  22: [8.25, 99, 2277],
  23: [12.38, 297],
  24: [24.75]
};

// Game state types
interface CellState {
  isRevealed: boolean;
  hasMine: boolean;
  animationData?: any;
  autoRevealed?: boolean; // Flag to track if cell was auto-revealed at game end
  giftIcon?: string; // Icon for gift mode
}

export default function Mines() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [betAmount, setBetAmount] = useState('1.00');
  const [isEditing, setIsEditing] = useState(false);
  const [tempBetAmount, setTempBetAmount] = useState('1.00');
  const [selectedMines, setSelectedMines] = useState<number>(3);
  const [isEditingMines, setIsEditingMines] = useState(false);
  const [tempCustomMines, setTempCustomMines] = useState('');
  const [customMines, setCustomMines] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const minesInputRef = useRef<HTMLInputElement>(null);
  const coefficientsRef = useRef<HTMLDivElement>(null);

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameField, setGameField] = useState<CellState[][]>(
    Array(5).fill(null).map(() => Array(5).fill(null).map(() => ({ isRevealed: false, hasMine: false, autoRevealed: false })))
  );
  const [bombAnimationData, setBombAnimationData] = useState<any>(null);
  const [gemAnimationData, setGemAnimationData] = useState<any>(null);
  const [gemsFound, setGemsFound] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [winAmount, setWinAmount] = useState('0.00');
  const [winGiftName, setWinGiftName] = useState<string | null>(null);
  const [animatingCells, setAnimatingCells] = useState<Set<string>>(new Set());
  const [glowKey, setGlowKey] = useState(0); // Key for forcing re-render
  
  // Live wins state
  const [liveWins, setLiveWins] = useState<Array<{
    timestamp: number;
    user: any;
    betAmount: string;
    winAmount: string;
    gemsFound: number;
    minesCount: number;
    multiplier: string;
    id: string;
  }>>([]);
  const [lastWinSyncTime, setLastWinSyncTime] = useState<number>(Date.now());
  const [animatingWins, setAnimatingWins] = useState<Set<string>>(new Set());
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  const [isToncoinActive, setIsToncoinActive] = useState(true);
  const { updateBalance, balance } = useBalance();
  const { user: telegramUser } = useTelegramAuth();
  
  // Gift selection modal states
  const [isAddGiftsModalOpen, setIsAddGiftsModalOpen] = useState(false);
  const [activeInfoOverlay, setActiveInfoOverlay] = useState<number | null>(null);
  const [selectedGifts, setSelectedGifts] = useState<number[]>([]);
  
  const [userInventory, setUserInventory] = useState<Array<{
    id: number;
    gift_name: string;
    gift_icon: string;
    gift_background: string;
    gift_price: number;
    obtained_from: string;
    created_at: string;
  }>>([]);
  
  // State for all available gifts
  const [allGifts, setAllGifts] = useState<Array<{
    name: string;
    price: number;
    icon: string;
    background: string;
  }>>([]);

  const handleModalStateChange = (isOpen: boolean) => {
    setIsModalOpen(isOpen);
  };

  // Handle gift selection
  const handleGiftClick = (giftId: number) => {
    setSelectedGifts(prev => {
      if (prev.includes(giftId)) {
        // Если подарок уже выбран, убираем его из выделения
        return prev.filter(id => id !== giftId);
      } else {
        // Добавляем подарок к выбранным (без ограничений)
        return [...prev, giftId];
      }
    });
  };

  // Функция для определения фона подарка на основе цены
  const getGiftBackground = (price: number): string => {
    if (price >= 500) return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg';
    if (price >= 100) return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg';
    if (price >= 50) return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
    if (price >= 20) return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg';
    return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
  };

  // Функция для определения фона подарка на основе цены (для выигрышей в минах)
  const getGiftBackgroundForWinning = (price: number): string => {
    if (price >= 500) return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg';
    if (price >= 250) return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg';
    if (price >= 100) return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
    if (price >= 50) return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg';
    return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
  };

  // Загружаем все подарки из базы данных
  const loadAllGifts = async () => {
    try {
      const response = await fetch('/api/gifts/prices');
      if (response.ok) {
        const data = await response.json();
        
        // Полный маппинг всех подарков из базы данных на иконки
        const giftMapping: { [key: string]: string } = {
          'Astral Shard': 'https://cdn.changes.tg/gifts/models/Astral%20Shard/png/Original.png',
          'B-Day Candle': 'https://cdn.changes.tg/gifts/models/B-Day%20Candle/png/Original.png',
          'Berry Box': 'https://cdn.changes.tg/gifts/models/Berry%20Box/png/Original.png',
          'Big Year': 'https://cdn.changes.tg/gifts/models/Big%20Year/png/Original.png',
          'Bonded Ring': 'https://cdn.changes.tg/gifts/models/Bonded%20Ring/png/Original.png',
          'Bow Tie': 'https://cdn.changes.tg/gifts/models/Bow%20Tie/png/Original.png',
          'Bunny Muffin': 'https://cdn.changes.tg/gifts/models/Bunny%20Muffin/png/Original.png',
          'Candy Cane': 'https://cdn.changes.tg/gifts/models/Candy%20Cane/png/Original.png',
          'Cookie Heart': 'https://cdn.changes.tg/gifts/models/Cookie%20Heart/png/Original.png',
          'Crystal Ball': 'https://cdn.changes.tg/gifts/models/Crystal%20Ball/png/Original.png',
          'Cupid Charm': 'https://cdn.changes.tg/gifts/models/Cupid%20Charm/png/Original.png',
          'Desk Calendar': 'https://cdn.changes.tg/gifts/models/Desk%20Calendar/png/Original.png',
          'Diamond Ring': 'https://cdn.changes.tg/gifts/models/Diamond%20Ring/png/Original.png',
          'Durov\'s Cap': 'https://cdn.changes.tg/gifts/models/Durov\'s%20Cap/png/Original.png',
          'Easter Egg': 'https://cdn.changes.tg/gifts/models/Easter%20Egg/png/Original.png',
          'Electric Skull': 'https://cdn.changes.tg/gifts/models/Electric%20Skull/png/Original.png',
          'Eternal Candle': 'https://cdn.changes.tg/gifts/models/Eternal%20Candle/png/Original.png',
          'Eternal Rose': 'https://cdn.changes.tg/gifts/models/Eternal%20Rose/png/Original.png',
          'Evil Eye': 'https://cdn.changes.tg/gifts/models/Evil%20Eye/png/Original.png',
          'Flying Broom': 'https://cdn.changes.tg/gifts/models/Flying%20Broom/png/Original.png',
          'Gem Signet': 'https://cdn.changes.tg/gifts/models/Gem%20Signet/png/Original.png',
          'Genie Lamp': 'https://cdn.changes.tg/gifts/models/Genie%20Lamp/png/Original.png',
          'Ginger Cookie': 'https://cdn.changes.tg/gifts/models/Ginger%20Cookie/png/Original.png',
          'Hanging Star': 'https://cdn.changes.tg/gifts/models/Hanging%20Star/png/Original.png',
          'Heart Locket': 'https://cdn.changes.tg/gifts/models/Heart%20Locket/png/Original.png',
          'Heroic Helmet': 'https://cdn.changes.tg/gifts/models/Heroic%20Helmet/png/Original.png',
          'Hex Pot': 'https://cdn.changes.tg/gifts/models/Hex%20Pot/png/Original.png',
          'Holiday Drink': 'https://cdn.changes.tg/gifts/models/Holiday%20Drink/png/Original.png',
          'Homemade Cake': 'https://cdn.changes.tg/gifts/models/Homemade%20Cake/png/Original.png',
          'Hypno Lollipop': 'https://cdn.changes.tg/gifts/models/Hypno%20Lollipop/png/Original.png',
          'Ion Gem': 'https://cdn.changes.tg/gifts/models/Ion%20Gem/png/Original.png',
          'Ionic Dryer': 'https://cdn.changes.tg/gifts/models/Ionic%20Dryer/png/Original.png',
          'Jack-in-the-Box': 'https://cdn.changes.tg/gifts/models/Jack-in-the-Box/png/Original.png',
          'Jelly Bunny': 'https://cdn.changes.tg/gifts/models/Jelly%20Bunny/png/Original.png',
          'Jester Hat': 'https://cdn.changes.tg/gifts/models/Jester%20Hat/png/Original.png',
          'Jingle Bells': 'https://cdn.changes.tg/gifts/models/Jingle%20Bells/png/Original.png',
          'Jolly Chimp': 'https://cdn.changes.tg/gifts/models/Jolly%20Chimp/png/Original.png',
          'Joyful Bundle': 'https://cdn.changes.tg/gifts/models/Joyful%20Bundle/png/Original.png',
          'Kissed Frog': 'https://cdn.changes.tg/gifts/models/Kissed%20Frog/png/Original.png',
          'Light Sword': 'https://cdn.changes.tg/gifts/models/Light%20Sword/png/Original.png',
          'Lol Pop': 'https://cdn.changes.tg/gifts/models/Lol%20Pop/png/Original.png',
          'Loot Bag': 'https://cdn.changes.tg/gifts/models/Loot%20Bag/png/Original.png',
          'Love Candle': 'https://cdn.changes.tg/gifts/models/Love%20Candle/png/Original.png',
          'Love Potion': 'https://cdn.changes.tg/gifts/models/Love%20Potion/png/Original.png',
          'Low Rider': 'https://cdn.changes.tg/gifts/models/Low%20Rider/png/Original.png',
          'Lunar Snake': 'https://cdn.changes.tg/gifts/models/Lunar%20Snake/png/Original.png',
          'Lush Bouquet': 'https://cdn.changes.tg/gifts/models/Lush%20Bouquet/png/Original.png',
          'Mad Pumpkin': 'https://cdn.changes.tg/gifts/models/Mad%20Pumpkin/png/Original.png',
          'Magic Potion': 'https://cdn.changes.tg/gifts/models/Magic%20Potion/png/Original.png',
          'Mini Oscar': 'https://cdn.changes.tg/gifts/models/Mini%20Oscar/png/Original.png',
          'Moon Pendant': 'https://cdn.changes.tg/gifts/models/Moon%20Pendant/png/Original.png',
          'Nail Bracelet': 'https://cdn.changes.tg/gifts/models/Nail%20Bracelet/png/Original.png',
          'Neko Helmet': 'https://cdn.changes.tg/gifts/models/Neko%20Helmet/png/Original.png',
          'Party Sparkler': 'https://cdn.changes.tg/gifts/models/Party%20Sparkler/png/Original.png',
          'Perfume Bottle': 'https://cdn.changes.tg/gifts/models/Perfume%20Bottle/png/Original.png',
          'Pet Snake': 'https://cdn.changes.tg/gifts/models/Pet%20Snake/png/Original.png',
          'Plush Pepe': 'https://cdn.changes.tg/gifts/models/Plush%20Pepe/png/Original.png',
          'Precious Peach': 'https://cdn.changes.tg/gifts/models/Precious%20Peach/png/Original.png',
          'Record Player': 'https://cdn.changes.tg/gifts/models/Record%20Player/png/Original.png',
          'Restless Jar': 'https://cdn.changes.tg/gifts/models/Restless%20Jar/png/Original.png',
          'Sakura Flower': 'https://cdn.changes.tg/gifts/models/Sakura%20Flower/png/Original.png',
          'Santa Hat': 'https://cdn.changes.tg/gifts/models/Santa%20Hat/png/Original.png',
          'Scared Cat': 'https://cdn.changes.tg/gifts/models/Scared%20Cat/png/Original.png',
          'Sharp Tongue': 'https://cdn.changes.tg/gifts/models/Sharp%20Tongue/png/Original.png',
          'Signet Ring': 'https://cdn.changes.tg/gifts/models/Signet%20Ring/png/Original.png',
          'Skull Flower': 'https://cdn.changes.tg/gifts/models/Skull%20Flower/png/Original.png',
          'Sleigh Bell': 'https://cdn.changes.tg/gifts/models/Sleigh%20Bell/png/Original.png',
          'Snake Box': 'https://cdn.changes.tg/gifts/models/Snake%20Box/png/Original.png',
          'Snoop Cigar': 'https://cdn.changes.tg/gifts/models/Snoop%20Cigar/png/Original.png',
          'Snoop Dogg': 'https://cdn.changes.tg/gifts/models/Snoop%20Dogg/png/Original.png',
          'Snow Globe': 'https://cdn.changes.tg/gifts/models/Snow%20Globe/png/Original.png',
          'Snow Mittens': 'https://cdn.changes.tg/gifts/models/Snow%20Mittens/png/Original.png',
          'Spiced Wine': 'https://cdn.changes.tg/gifts/models/Spiced%20Wine/png/Original.png',
          'Spy Agaric': 'https://cdn.changes.tg/gifts/models/Spy%20Agaric/png/Original.png',
          'Star Notepad': 'https://cdn.changes.tg/gifts/models/Star%20Notepad/png/Original.png',
          'Stellar Rocket': 'https://cdn.changes.tg/gifts/models/Stellar%20Rocket/png/Original.png',
          'Swag Bag': 'https://cdn.changes.tg/gifts/models/Swag%20Bag/png/Original.png',
          'Swiss Watch': 'https://cdn.changes.tg/gifts/models/Swiss%20Watch/png/Original.png',
          'Tama Gadget': 'https://cdn.changes.tg/gifts/models/Tama%20Gadget/png/Original.png',
          'Top Hat': 'https://cdn.changes.tg/gifts/models/Top%20Hat/png/Original.png',
          'Toy Bear': 'https://cdn.changes.tg/gifts/models/Toy%20Bear/png/Original.png',
          'Trapped Heart': 'https://cdn.changes.tg/gifts/models/Trapped%20Heart/png/Original.png',
          'Valentine Box': 'https://cdn.changes.tg/gifts/models/Valentine%20Box/png/Original.png',
          'Vintage Cigar': 'https://cdn.changes.tg/gifts/models/Vintage%20Cigar/png/Original.png',
          'Voodoo Doll': 'https://cdn.changes.tg/gifts/models/Voodoo%20Doll/png/Original.png',
          'Westside Sign': 'https://cdn.changes.tg/gifts/models/Westside%20Sign/png/Original.png',
          'Whip Cupcake': 'https://cdn.changes.tg/gifts/models/Whip%20Cupcake/png/Original.png',
          'Winter Wreath': 'https://cdn.changes.tg/gifts/models/Winter%20Wreath/png/Original.png',
          'Witch Hat': 'https://cdn.changes.tg/gifts/models/Witch%20Hat/png/Original.png',
          'Xmas Stocking': 'https://cdn.changes.tg/gifts/models/Xmas%20Stocking/png/Original.png'
        };
        
        const giftsArray = Object.entries(data.gifts).map(([name, price]) => ({
          name,
          price: price as number,
          icon: giftMapping[name] || '',
          background: getGiftBackground(price as number)
        })).filter(gift => gift.icon); // Убираем подарки без иконок (если такие есть)
        
        setAllGifts(giftsArray);
      }
    } catch (error) {
      console.error('Failed to load gifts:', error);
    }
  };

  // Функция для получения подарка по цене (для режима подарков и гибридного режима TON)
  const getGiftByPrice = (targetPrice: number) => {
    // Ищем подарок с максимальной ценой, которая не превышает целевую цену
    const suitableGifts = allGifts.filter(gift => gift.price <= targetPrice);
    if (suitableGifts.length === 0) {
      // Если нет подходящих подарков, возвращаем самый дешевый
      return allGifts.reduce((cheapest, current) => 
        current.price < cheapest.price ? current : cheapest, allGifts[0]);
    }
    
    // Возвращаем подарок с максимальной ценой среди подходящих
    return suitableGifts.reduce((most_expensive, current) => 
      current.price > most_expensive.price ? current : most_expensive);
  };

  // Функция для получения минимальной стоимости подарка
  const getMinGiftPrice = () => {
    if (allGifts.length === 0) return 1; // Дефолтное значение если подарки не загружены
    return allGifts.reduce((min, current) => current.price < min ? current.price : min, allGifts[0].price);
  };

  // Загружаем инвентарь пользователя
  const loadUserInventory = async () => {
    if (!(window as any).Telegram?.WebApp?.initData) return;
    
    try {
      const response = await fetch('/api/user/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData: (window as any).Telegram.WebApp.initData }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserInventory(data.items || []);
      }
    } catch (error) {
      console.error('Failed to load user inventory:', error);
    }
  };

  // Formatting function for win amounts
  const formatWinAmount = (amount: string): string => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      return '+0.00';
    }
    
    if (numAmount >= 1000 && numAmount % 1 === 0) {
      // If >= 1000 and whole number, no decimals
      return `+${Math.round(numAmount)}`;
    } else if (numAmount >= 10) {
      // If >= 10, show decimals as they are or add .00 if whole
      if (numAmount % 1 === 0) {
        return `+${numAmount.toFixed(2)}`;
      } else {
        return `+${numAmount.toFixed(2)}`;
      }
    } else {
      // If < 10, always show two decimals
      return `+${numAmount.toFixed(2)}`;
    }
  };

  // Formatting function for user names in live history
  const formatUserName = (name: string): string => {
    if (!name) return 'Игрок';
    
    if (name.length >= 3) {
      return `${name.slice(0, 2)}...`;
    } else {
      return name;
    }
  };

  // Проверка новых выигрышей в минах
  const checkForNewMinesWins = async () => {
    try {
      const response = await fetch(`/api/sync/mines-wins?since=${lastWinSyncTime}`);
      if (response.ok) {
        const data = await response.json();
        const newWins = data.wins || [];
        
        // Добавляем новые выигрыши
        if (newWins.length > 0) {
          // Добавляем уникальные ID для анимации
          const winsWithIds = newWins.map((win: any) => ({
            ...win,
            id: `${win.timestamp}-${Math.random()}`
          }));
          
          // Помечаем новые выигрыши как анимирующиеся
          const newIds = winsWithIds.map((w: any) => w.id);
          setAnimatingWins(prev => new Set([...prev, ...newIds]));
          
          // Добавляем новые выигрыши в начало массива
          setLiveWins(prev => {
            const updated = [...winsWithIds, ...prev].slice(0, 5); // Показываем только последние 5
            return updated;
          });
          
          // Убираем анимацию через время завершения анимации
          setTimeout(() => {
            setAnimatingWins(prev => {
              const newSet = new Set(prev);
              newIds.forEach((id: string) => newSet.delete(id));
              return newSet;
            });
          }, 600); // Время должно соответствовать продолжительности CSS анимации
          
          // Обновляем время последней синхронизации
          const latestTimestamp = Math.max(...newWins.map((w: { timestamp: number }) => w.timestamp));
          setLastWinSyncTime(latestTimestamp);
        }
      }
    } catch (error) {
      console.error('Error checking for new mines wins:', error);
    }
  };

  // Polling для синхронизации выигрышей в минах
  useEffect(() => {
    const interval = setInterval(checkForNewMinesWins, 1000); // Каждую секунду
    return () => clearInterval(interval);
  }, [lastWinSyncTime]);

  // Загружаем инвентарь пользователя и все подарки
  useEffect(() => {
    loadUserInventory();
    loadAllGifts();
  }, [telegramUser]);

  // Блокируем скролл страницы когда модальное окно открыто
  useEffect(() => {
    if (isAddGiftsModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Очищаем при размонтировании компонента
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAddGiftsModalOpen]);

  // Load animation data
  useEffect(() => {
    const loadAnimations = async () => {
      try {
        const bombResponse = await fetch('https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/bomb.json');
        const bombData = await bombResponse.json();
        setBombAnimationData(bombData);
        
        const gemResponse = await fetch('https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gem.json');
        const gemData = await gemResponse.json();
        setGemAnimationData(gemData);
      } catch (error) {
        console.error('Failed to load animations:', error);
      }
    };

    loadAnimations();
  }, []);

  // Generate random mine positions
  const generateMinePositions = (numMines: number): Set<string> => {
    const positions = new Set<string>();
    
    while (positions.size < numMines) {
      const row = Math.floor(Math.random() * 5);
      const col = Math.floor(Math.random() * 5);
      positions.add(`${row}-${col}`);
    }
    
    return positions;
  };

  

  // Функция проверки баланса
  const checkBalance = () => {
    const currentBalance = parseFloat(balance || '0');
    const totalCost = parseFloat(betAmount);
    
    return currentBalance >= totalCost;
  };

  // Функция показа уведомления о недостатке средств
  const showInsufficientFundsNotification = () => {
    // Добавляем тактильную обратную связь для ошибки
    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('rigid');
    }
    
    setShowInsufficientFunds(true);
    setTimeout(() => {
      setShowInsufficientFunds(false);
    }, 3000); // Скрываем через 3 секунды
  };

  // Функция списания средств за игру (только для режима TON)
  const spendOnGame = async () => {
    try {
      const totalCost = parseFloat(betAmount);
      
      // Получаем initData из Telegram WebApp
      const initData = (window as any).Telegram?.WebApp?.initData;
      
      const response = await fetch('/api/user/spend-on-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData,
          amount: totalCost
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.newBalance) {
          // Обновляем баланс в UI только если сервер подтвердил
          updateBalance(data.newBalance);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error spending on mines:', error);
      return false;
    }
  };

  // Функция удаления выбранных подарков из инвентаря (для режима подарков)
  const removeSelectedGiftsFromInventory = async (giftIds: number[]) => {
    try {
      const initData = (window as any).Telegram?.WebApp?.initData;
      
      // Удаляем подарки из инвентаря через API
      const deletePromises = giftIds.map(giftId => 
        fetch('/api/user/inventory/sell', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            initData,
            itemId: giftId
          }),
        })
      );

      const responses = await Promise.all(deletePromises);
      
      // Проверяем, что все запросы прошли успешно
      const allSuccessful = responses.every(response => response.ok);
      
      if (allSuccessful) {
        // Обновляем локальный инвентарь
        setUserInventory(prev => prev.filter(item => !giftIds.includes(item.id)));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error removing gifts from inventory:', error);
      return false;
    }
  };

  // Функция зачисления выигрыша (только для режима TON)
  const addWinnings = async (winAmount: number) => {
    try {
      // Получаем initData из Telegram WebApp
      const initData = (window as any).Telegram?.WebApp?.initData;
      
      const response = await fetch('/api/user/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData,
          amount: winAmount,
          transactionHash: `mines_win_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.newBalance) {
          // Обновляем баланс в UI
          updateBalance(data.newBalance);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error adding winnings:', error);
      return false;
    }
  };

  // Функция добавления подарка в инвентарь (для режима подарков)
  const addGiftToInventory = async (giftPrice: number) => {
    try {
      // Получаем подарок по цене выигрыша
      const gift = getGiftByPrice(giftPrice);
      if (!gift) {
        console.error('No suitable gift found for price:', giftPrice);
        return false;
      }

      // Определяем правильный фон для выигрыша
      const giftBackground = getGiftBackgroundForWinning(giftPrice);

      // Получаем initData из Telegram WebApp
      const initData = (window as any).Telegram?.WebApp?.initData;
      
      const response = await fetch('/api/user/inventory/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData,
          items: [{
            giftName: gift.name,
            giftIcon: gift.icon,
            giftBackground: giftBackground,
            giftPrice: giftPrice
          }]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Обновляем локальный инвентарь
          await loadUserInventory();
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error adding gift to inventory:', error);
      return false;
    }
  };

  // Start game
  const handleStartGame = async (selectedGiftIds?: number[]) => {
    if (gameStarted && !gameEnded) return;
    
    // В режиме TON проверяем баланс
    if (isToncoinActive) {
      if (!checkBalance()) {
        showInsufficientFundsNotification();
        return;
      }
    }
    
    // Моментально запускаем игру
    setGameStarted(true);
    setGameEnded(false);
    setGemsFound(0);
    
    // Generate mine positions
    const minePositions = generateMinePositions(selectedMines);
    
    // Create new game field
    const newField = Array(5).fill(null).map((_, row) => 
      Array(5).fill(null).map((_, col) => ({
        isRevealed: false,
        hasMine: minePositions.has(`${row}-${col}`),
        animationData: null,
        autoRevealed: false,
        giftIcon: undefined
      }))
    );
    
    setGameField(newField);
    
    let success = false;
    
    if (isToncoinActive) {
      // Режим TON - списываем средства с баланса
      success = await spendOnGame();
    } else {
      // Режим подарков - удаляем выбранные подарки из инвентаря
      if (selectedGiftIds && selectedGiftIds.length > 0) {
        success = await removeSelectedGiftsFromInventory(selectedGiftIds);
        // Подарки успешно удалены из инвентаря
      } else {
        success = false;
      }
    }
    
    if (!success) {
      // Если не удалось списать средства/удалить подарки, возвращаем игру в исходное состояние
      setGameStarted(false);
      setGameEnded(false);
      setGemsFound(0);
      
      // Reset game field to initial state
      const initialField = Array(5).fill(null).map(() => 
        Array(5).fill(null).map(() => ({ isRevealed: false, hasMine: false, animationData: null, autoRevealed: false, giftIcon: undefined }))
      );
      setGameField(initialField);
      
      showInsufficientFundsNotification();
      return;
    }
  };

  // Cash out function
  const handleCashOut = async () => {
    if (!gameStarted || gameEnded) return;
    
    setGameEnded(true);
    
    // Reveal all unrevealed cells
    const newField = [...gameField];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (!newField[row][col].isRevealed) {
          newField[row][col].isRevealed = true;
          newField[row][col].autoRevealed = true; // Mark as auto-revealed
          // Set animation data based on mine presence
          if (newField[row][col].hasMine) {
            newField[row][col].animationData = bombAnimationData;
          } else {
            if (!isToncoinActive) {
              // В режиме подарков показываем статичную иконку gem для автоматически открытых чистых клеток
              newField[row][col].giftIcon = 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gem.svg';
            } else {
              // В режиме TON используем гибридную логику для автоматически открытых клеток
              const multiplier = gemsFound === 0 ? 1 : MINES_MULTIPLIERS[selectedMines]?.[gemsFound - 1] || 1;
              const betAmountNum = parseFloat(betAmount);
              const currentWinAmount = betAmountNum * multiplier;
              const minGiftPrice = getMinGiftPrice();
              
              if (currentWinAmount >= minGiftPrice) {
                // Выигрыш больше или равен минимальной цене подарка - показываем подарок
                const gift = getGiftByPrice(currentWinAmount);
                if (gift) {
                  newField[row][col].giftIcon = gift.icon;
                } else {
                  newField[row][col].giftIcon = 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gem.svg';
                }
              } else {
                // Выигрыш меньше минимальной цены подарка - показываем алмазы с анимацией
                newField[row][col].giftIcon = undefined;
                newField[row][col].animationData = gemAnimationData;
              }
            }
          }
        }
      }
    }
    setGameField(newField);
    
    // Calculate winnings based on gems found
    const multiplier = gemsFound === 0 ? 1 : MINES_MULTIPLIERS[selectedMines]?.[gemsFound - 1] || 1;
    const totalWinnings = parseFloat(betAmount) * multiplier;
    
    console.log(`Cashed out with ${gemsFound} gems. Multiplier: ${multiplier}x, Total winnings: ${totalWinnings}`);
    
    // Зачисляем выигрыш в зависимости от режима
    if (isToncoinActive) {
      // В режиме TON используем гибридную логику
      const minGiftPrice = getMinGiftPrice();
      
      if (totalWinnings >= minGiftPrice) {
        // Выигрыш больше или равен минимальной цене подарка - добавляем подарок в инвентарь
        const gift = getGiftByPrice(totalWinnings);
        if (gift) {
          setWinGiftName(gift.name);
          await addGiftToInventory(totalWinnings);
        }
      } else {
        // Выигрыш меньше минимальной цены подарка - начисляем TON
        if (totalWinnings > 0) {
          await addWinnings(totalWinnings);
        }
      }
    } else {
      // В режиме подарков добавляем предмет в инвентарь
      if (totalWinnings > 0) {
        const gift = getGiftByPrice(totalWinnings);
        if (gift) {
          setWinGiftName(gift.name);
        }
        await addGiftToInventory(totalWinnings);
      }
    }
    
    // Show win modal (показываем полный выигрыш в модальном окне)
    setWinAmount(totalWinnings.toFixed(2));
    setShowWinModal(true);
    
    // Уведомляем о выигрыше для Live блока
    const notifyMinesWin = async () => {
      try {
        await fetch('/api/sync/notify-mines-win', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp: Date.now(),
            initData: (window as any).Telegram?.WebApp?.initData,
            betAmount: betAmount,
            winAmount: totalWinnings.toFixed(2),
            gemsFound: gemsFound,
            minesCount: selectedMines,
            multiplier: multiplier.toFixed(2)
          }),
        });
      } catch (error) {
        console.error('Failed to notify mines win:', error);
      }
    };
    
    notifyMinesWin();
    
    // Hide modal after 3 seconds and reset game
    setTimeout(() => {
      setShowWinModal(false);
      setGameStarted(false);
      setGameEnded(false);
      setGemsFound(0);
      // Очищаем выбранные подарки
      
      // Reset game field to initial state
      const initialField = Array(5).fill(null).map(() => 
        Array(5).fill(null).map(() => ({ isRevealed: false, hasMine: false, animationData: null, autoRevealed: false, giftIcon: undefined }))
      );
      setGameField(initialField);
      
      // Reset coefficients scroll position to beginning
      if (coefficientsRef.current) {
        coefficientsRef.current.scrollLeft = 0;
      }
    }, 3000);
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (!gameStarted || gameField[row][col].isRevealed || gameEnded) return;
    
    // Add animation for this cell
    const cellKey = `${row}-${col}`;
    setAnimatingCells(prev => new Set(prev).add(cellKey));
    
    // Remove animation after it completes
    setTimeout(() => {
      setAnimatingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }, 200);
    
    const newField = [...gameField];
    const cell = newField[row][col];
    
    cell.isRevealed = true;
    
    // Set animation data based on mine presence
    if (cell.hasMine) {
      cell.animationData = bombAnimationData;
      
      // Intense vibration for bomb explosion
      if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('rigid');
        // Also trigger error notification for double impact
        setTimeout(() => {
          (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }, 100);
      }
      
      // Game over - end the game and reveal all unrevealed cells
      setGameEnded(true);
      
      // Reveal all unrevealed cells with auto-revealed flag
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (!newField[r][c].isRevealed) {
            newField[r][c].isRevealed = true;
            newField[r][c].autoRevealed = true; // Mark as auto-revealed
            // Set animation data based on mine presence
            if (newField[r][c].hasMine) {
              newField[r][c].animationData = bombAnimationData;
            } else {
              if (!isToncoinActive) {
                // В режиме подарков показываем статичную иконку gem для автоматически открытых чистых клеток
                newField[r][c].giftIcon = 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gem.svg';
              } else {
                // В режиме TON используем гибридную логику для автоматически открытых клеток при проигрыше
                const multiplier = gemsFound === 0 ? 1 : MINES_MULTIPLIERS[selectedMines]?.[gemsFound - 1] || 1;
                const betAmountNum = parseFloat(betAmount);
                const currentWinAmount = betAmountNum * multiplier;
                const minGiftPrice = getMinGiftPrice();
                
                if (currentWinAmount >= minGiftPrice) {
                  // Выигрыш больше или равен минимальной цене подарка - показываем подарок
                  const gift = getGiftByPrice(currentWinAmount);
                  if (gift) {
                    newField[r][c].giftIcon = gift.icon;
                  } else {
                    newField[r][c].giftIcon = 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gem.svg';
                  }
                } else {
                  // Выигрыш меньше минимальной цены подарка - показываем алмазы с анимацией
                  newField[r][c].giftIcon = undefined;
                  newField[r][c].animationData = gemAnimationData;
                }
              }
            }
          }
        }
      }
      
      // При проигрыше средства НЕ возвращаются (они уже списаны в handleStartGame)
      // Баланс остается тот, что был после списания ставки
      
      // Reset game after bomb animation plays (2.5 seconds delay)
      setTimeout(() => {
        setGameStarted(false);
        setGameEnded(false);
        setGemsFound(0);
        setWinGiftName(null);
        // Очищаем выбранные подарки
        // Reset game field to initial state
        const initialField = Array(5).fill(null).map(() => 
          Array(5).fill(null).map(() => ({ isRevealed: false, hasMine: false, animationData: null, autoRevealed: false, giftIcon: undefined }))
        );
        setGameField(initialField);
        
        // Reset coefficients scroll position to beginning
        if (coefficientsRef.current) {
          coefficientsRef.current.scrollLeft = 0;
        }
      }, 2500);
    } else {
      // Light vibration for gem found
      if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
      
      // Increment gems found first
      const newGemsFound = gemsFound + 1;
      setGemsFound(newGemsFound);
      
      if (!isToncoinActive) {
        // В режиме подарков вычисляем подарок на основе коэффициента
        const multiplier = MINES_MULTIPLIERS[selectedMines]?.[newGemsFound - 1] || 1;
        const betAmountNum = parseFloat(betAmount);
        const targetPrice = betAmountNum * multiplier;
        const gift = getGiftByPrice(targetPrice);
        
        if (gift) {
          // Обновляем все открытые клетки (включая новую) с иконкой текущего подарка
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
              if (newField[r][c].isRevealed && !newField[r][c].hasMine && !newField[r][c].autoRevealed) {
                newField[r][c].giftIcon = gift.icon;
                newField[r][c].animationData = null; // Убираем анимацию
              }
            }
          }
        } else {
          // Если подарок не найден, показываем алмазы с анимацией
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
              if (newField[r][c].isRevealed && !newField[r][c].hasMine && !newField[r][c].autoRevealed) {
                newField[r][c].giftIcon = undefined;
                newField[r][c].animationData = gemAnimationData;
              }
            }
          }
        }
      } else {
        // В режиме TON используем гибридную логику
        const multiplier = MINES_MULTIPLIERS[selectedMines]?.[newGemsFound - 1] || 1;
        const betAmountNum = parseFloat(betAmount);
        const currentWinAmount = betAmountNum * multiplier;
        const minGiftPrice = getMinGiftPrice();
        
        if (currentWinAmount >= minGiftPrice) {
          // Выигрыш больше или равен минимальной цене подарка - показываем подарок
          const gift = getGiftByPrice(currentWinAmount);
          if (gift) {
            // Обновляем все открытые клетки (включая новую) с иконкой текущего подарка
            for (let r = 0; r < 5; r++) {
              for (let c = 0; c < 5; c++) {
                if (newField[r][c].isRevealed && !newField[r][c].hasMine && !newField[r][c].autoRevealed) {
                  newField[r][c].giftIcon = gift.icon;
                  newField[r][c].animationData = null; // Убираем анимацию
                }
              }
            }
          }
        } else {
          // Выигрыш меньше минимальной цены подарка - показываем алмазы с анимацией
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
              if (newField[r][c].isRevealed && !newField[r][c].hasMine && !newField[r][c].autoRevealed) {
                newField[r][c].giftIcon = undefined;
                newField[r][c].animationData = gemAnimationData;
              }
            }
          }
        }
      }
    }
    
    setGameField(newField);
  };

  const handleBetClick = () => {
    setIsEditing(true);
    setTempBetAmount(''); // Очищаем поле при нажатии
  };

  const handleInputBlur = () => {
    const value = parseFloat(tempBetAmount);
    if (!isNaN(value) && value > 0) {
      setBetAmount(value.toFixed(2));
    } else {
      setBetAmount('1.00'); // Если ничего не введено, устанавливаем 1.00
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setTempBetAmount('');
      setIsEditing(false);
    }
  };

  const handleHalfBet = () => {
    const currentValue = parseFloat(betAmount);
    const newValue = currentValue / 2;
    setBetAmount(newValue.toFixed(2));
  };

  const handleDoubleBet = () => {
    const currentValue = parseFloat(betAmount);
    const newValue = currentValue * 2;
    setBetAmount(newValue.toFixed(2));
  };

  const handleMineSelection = (mines: number) => {
    setSelectedMines(mines);
    setCustomMines(null); // Сбрасываем кастомное значение при выборе предустановленного
    // Force re-render of glow element to fix mobile rendering issues
    setGlowKey(prev => prev + 1);
  };

  const handleCustomMinesClick = () => {
    setIsEditingMines(true);
    setTempCustomMines(''); // Очищаем поле при нажатии
  };

  const handleMinesInputBlur = () => {
    let value = parseInt(tempCustomMines);
    if (!isNaN(value) && value > 0) {
      // Ограничиваем значение от 1 до 24
      if (value > 24) value = 24;
      if (value < 1) value = 1;
      
      // Если введено предустановленное значение (3, 5, 10), то используем предустановленную кнопку
      if (value === 3 || value === 5 || value === 10) {
        setSelectedMines(value);
        setCustomMines(null);
      } else {
        // Если введено другое значение, то используем кастомную кнопку
        setCustomMines(value);
        setSelectedMines(value);
      }
    } else {
      setCustomMines(null);
    }
    setIsEditingMines(false);
    // Force re-render of glow element to fix mobile rendering issues
    setGlowKey(prev => prev + 1);
  };

  const handleMinesInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMinesInputBlur();
    } else if (e.key === 'Escape') {
      setTempCustomMines('');
      setIsEditingMines(false);
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Focus mines input when editing starts
  useEffect(() => {
    if (isEditingMines && minesInputRef.current) {
      minesInputRef.current.focus();
      minesInputRef.current.select();
    }
  }, [isEditingMines]);

  // Auto-scroll to current coefficient when gems are found
  useEffect(() => {
    if (gemsFound > 0 && coefficientsRef.current) {
      const coefficientElements = coefficientsRef.current.querySelectorAll('[data-coefficient-index]');
      const currentCoefficientElement = coefficientElements[gemsFound - 1] as HTMLElement;
      
      if (currentCoefficientElement) {
        // Smooth scroll to the current coefficient
        currentCoefficientElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [gemsFound]);

  return (
    <div className="min-h-screen text-white flex flex-col items-center" style={{ backgroundColor: '#060E15' }}>
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl flex flex-col">
        <UserHeader onModalStateChange={handleModalStateChange} isLocked={gameStarted || showWinModal} />
        
        <div className="px-3 sm:px-4 md:px-6 flex flex-col">
          {/* Три прямоугольника под хедером */}
          <div className="flex justify-between" style={{ marginTop: '6px' }}>
        <div 
          className="flex items-center"
          style={{
            width: '88px',
            height: '44px',
            backgroundColor: '#1D252C',
            borderRadius: '20px',
            paddingLeft: '16px',
            opacity: gameStarted || showWinModal || showInsufficientFunds ? 0.5 : 1,
            pointerEvents: gameStarted || showWinModal || showInsufficientFunds ? 'none' : 'auto',
            transition: 'opacity 0.3s ease'
          }}
        >
          <img 
            src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gem.svg"
            alt="Gem"
            style={{
              width: '24px',
              height: '24px',
              marginRight: '10px'
            }}
          />
          <span 
            className="text-white font-gilroy-bold"
            style={{
              fontSize: '16px'
            }}
          >
            {25 - selectedMines - gemsFound}
          </span>
        </div>
        
        {/* Средний прямоугольник с переключающимися логотипами */}
        <div 
          className="flex items-center self-center"
          style={{
            width: '66px',
            height: '36px',
            backgroundColor: '#1D252C',
            borderRadius: '20px',
            opacity: gameStarted || showWinModal || showInsufficientFunds ? 0.5 : 1,
            pointerEvents: gameStarted || showWinModal || showInsufficientFunds ? 'none' : 'auto',
            transition: 'opacity 0.3s ease',
            paddingLeft: '6px',
            paddingRight: '6px'
          }}
        >
          <img 
            src={isToncoinActive 
              ? "https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/toncoin_active.svg"
              : "https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/toncoin_inactive.svg"
            }
            alt="Toncoin"
            className="cursor-pointer"
            onClick={() => {
              if (!isToncoinActive) {
                setIsToncoinActive(true);
              }
            }}
            style={{
              width: '24px',
              height: '24px',
              marginRight: '6px'
            }}
          />
          <img 
            src={isToncoinActive 
              ? "https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gifts_inactive.svg"
              : "https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gifts_active.svg"
            }
            alt="Gifts"
            className="cursor-pointer"
            onClick={() => {
              if (isToncoinActive) {
                setIsToncoinActive(false);
              }
            }}
            style={{
              width: '24px',
              height: '24px'
            }}
          />
        </div>
        
        <div 
          className="flex items-center justify-end"
          style={{
            width: '88px',
            height: '44px',
            backgroundColor: '#1D252C',
            borderRadius: '20px',
            paddingRight: '16px',
            opacity: gameStarted || showWinModal || showInsufficientFunds ? 0.5 : 1,
            pointerEvents: gameStarted || showWinModal || showInsufficientFunds ? 'none' : 'auto',
            transition: 'opacity 0.3s ease'
          }}
        >
          <span 
            className="text-white font-gilroy-bold"
            style={{
              fontSize: '16px',
              marginRight: '10px'
            }}
          >
            {selectedMines}
          </span>
          <img 
            src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/bomb.svg"
            alt="Bomb"
            style={{
              width: '24px',
              height: '24px'
            }}
          />
        </div>
      </div>
      
      {/* 5 рядов прямоугольников */}
      <div 
        key={`game-field-${glowKey}`}
        className="relative"
        style={{
          marginTop: '20px',
          filter: 'drop-shadow(0px 0px 76.3px rgba(10, 123, 246, 0.43))',
          // Force GPU acceleration and prevent rendering issues
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          WebkitPerspective: '1000px',
          perspective: '1000px',
          // Ensure proper isolation
          isolation: 'isolate',
          // Force layer creation
          willChange: 'transform, filter',
          // Additional mobile-specific fixes
          WebkitTransformStyle: 'preserve-3d',
          transformStyle: 'preserve-3d'
        }}
      >
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <div key={rowIndex} style={{ marginTop: rowIndex === 0 ? '0px' : '12px' }}>
            <div className="flex justify-center" style={{ gap: '12px' }}>
              {Array.from({ length: 5 }).map((_, colIndex) => {
                const cell = gameField[rowIndex][colIndex];
                const isRevealed = cell.isRevealed;
                const hasMine = cell.hasMine;
                const isAutoRevealed = cell.autoRevealed;
                
                return (
                  <div key={colIndex} className="relative">
                    {/* Фоновый прямоугольник 60x56 */}
                    <div 
                      style={{
                        width: '60px',
                        height: '56px',
                        borderRadius: '12px',
                        backgroundColor: isRevealed 
                          ? (hasMine ? '#4C1A13' : '#19452D')
                          : '#0A487C',
                        opacity: isAutoRevealed ? 0.3 : 1
                      }}
                    />
                    {/* Градиентный прямоугольник поверх 60x50 - всегда показываем для нераскрытых */}
                    {!isRevealed && (
                      <div 
                        className={`absolute top-0 left-0 flex items-center justify-center cursor-pointer ${
                          animatingCells.has(`${rowIndex}-${colIndex}`) ? 'cell-pulse' : ''
                        }`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        style={{
                          width: '60px',
                          height: '50px',
                          borderRadius: '12px',
                          background: 'linear-gradient(180deg, #1686FF 0%, #0072EE 100%)',
                          pointerEvents: gameEnded ? 'none' : 'auto',
                          opacity: gameEnded ? 0.5 : 1
                        }}
                      >
                        <span 
                          className="font-gilroy-bold"
                          style={{
                            fontSize: '30px',
                            color: '#98C9FF',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none'
                          }}
                        >
                          ?
                        </span>
                      </div>
                    )}
                    {/* Контент для раскрытых клеток */}
                    {isRevealed && (
                      <div 
                        className="absolute top-0 left-0 flex items-center justify-center"
                        style={{
                          width: '60px',
                          height: '50px',
                          borderRadius: '12px',
                          background: hasMine 
                            ? 'linear-gradient(180deg, #242E37 0%, #682E26 100%)'
                            : 'linear-gradient(180deg, #242E37 0%, #1D6C3E 100%)',
                          border: hasMine 
                            ? '1px solid transparent'
                            : '1px solid #33FF88',
                          backgroundImage: hasMine 
                            ? 'linear-gradient(180deg, #242E37 0%, #682E26 100%), linear-gradient(180deg, #FF6817 0%, #D81900 100%)'
                            : undefined,
                          backgroundOrigin: hasMine ? 'border-box' : undefined,
                          backgroundClip: hasMine ? 'content-box, border-box' : undefined,
                          opacity: isAutoRevealed ? 0.3 : 1
                        }}
                      >
                        {cell.giftIcon ? (
                          // В режиме подарков показываем иконку подарка
                          <img 
                            src={cell.giftIcon}
                            alt="Gift"
                            style={{ 
                              width: '42px', 
                              height: '42px',
                              opacity: isAutoRevealed ? 0.3 : 1
                            }}
                          />
                        ) : isAutoRevealed && !hasMine ? (
                          // Для автоматически открытых чистых клеток в режиме TON показываем статичную иконку
                          <img 
                            src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gem.svg"
                            alt="Gem"
                            style={{ 
                              width: '42px', 
                              height: '42px',
                              opacity: 0.3
                            }}
                          />
                        ) : cell.animationData && (
                          // Для остальных клеток (включая автоматически открытые бомбы) показываем анимацию
                          <Lottie 
                            animationData={cell.animationData}
                            style={{ 
                              width: '42px', 
                              height: '42px',
                              opacity: isAutoRevealed ? 0.3 : 1
                            }}
                            loop={false}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Коэффициенты под игровой областью */}
          <div style={{ marginTop: '20px' }}>
        <div 
          style={{
            width: '100%',
            height: '64px',
            backgroundColor: '#1D252C',
            borderRadius: '20px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div 
            ref={coefficientsRef}
            className="overflow-x-auto"
            style={{
              width: '100%',
              height: '100%',
              padding: '10px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <div 
              style={{
                display: 'flex',
                gap: '10px',
                paddingRight: '10px'
              }}
            >
              {MINES_MULTIPLIERS[selectedMines]?.map((multiplier, index) => {
                // Determine if this coefficient should be highlighted
                const isActive = gemsFound > 0 && index === gemsFound - 1;
                
                return (
                  <div 
                    key={index}
                    data-coefficient-index={index}
                    className="flex items-center justify-center"
                    style={{
                      width: '68px',
                      height: '44px',
                      background: isActive 
                        ? 'linear-gradient(180deg, #1686FF 0%, #0072EE 100%)'
                        : '#242E37',
                      borderRadius: '20px',
                      flexShrink: 0
                    }}
                  >
                    <span 
                      className="font-gilroy-bold text-white"
                      style={{
                        fontSize: '14px',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                      }}
                    >
                      {multiplier}x
                    </span>
                  </div>
                );
              }) || []}
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка "Начать игру!" - показывается только в режиме TON */}
      {isToncoinActive && (
        <div style={{ marginTop: '16px' }}>
          <div 
            className="flex items-center justify-center cursor-pointer"
            onClick={gameStarted && !gameEnded ? handleCashOut : () => handleStartGame()}
            style={{
              width: '100%',
              height: '44px',
              background: gameStarted && !gameEnded
                ? 'linear-gradient(180deg, #1686FF 0%, #0072EE 100%)'
                : gameEnded
                ? '#666'
                : 'linear-gradient(180deg, #1686FF 0%, #0072EE 100%)',
              borderRadius: '20px',
              filter: gameStarted && !gameEnded
                ? 'drop-shadow(0px 4px 12.67px rgba(21, 133, 254, 0.45))'
                : gameEnded
                ? 'none'
                : 'drop-shadow(0px 4px 12.67px rgba(21, 133, 254, 0.45))',
              opacity: gameEnded ? 0.5 : 1,
              pointerEvents: gameEnded ? 'none' : 'auto',
              transition: 'all 0.3s ease'
            }}
          >
            <span 
              className="font-gilroy-semibold text-white"
              style={{
                fontSize: '15px',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            >
              {gameStarted && !gameEnded ? 'Забрать!' : gameEnded ? 'Игра окончена' : 'Начать игру!'}
            </span>
          </div>
        </div>
      )}

      {/* Кнопка "Забрать!" - показывается только в режиме подарков и когда игра активна */}
      {!isToncoinActive && gameStarted && !gameEnded && (
        <div style={{ marginTop: '16px' }}>
          <div 
            className="flex items-center justify-center cursor-pointer"
            onClick={handleCashOut}
            style={{
              width: '100%',
              height: '44px',
              background: 'linear-gradient(180deg, #1686FF 0%, #0072EE 100%)',
              borderRadius: '20px',
              filter: 'drop-shadow(0px 4px 12.67px rgba(21, 133, 254, 0.45))',
              transition: 'all 0.3s ease'
            }}
          >
            <span 
              className="font-gilroy-semibold text-white"
              style={{
                fontSize: '15px',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            >
              Забрать!
            </span>
          </div>
        </div>
      )}

      {/* Прямоугольник под кнопкой */}
          <div style={{ marginTop: '16px' }}>
        <div 
          style={{
            width: '100%',
            height: '244px',
            backgroundColor: '#181F25',
            borderRadius: '20px',
            border: '1px solid #303E4A',
            position: 'relative',
            opacity: gameStarted || showInsufficientFunds ? 0.5 : 1,
            pointerEvents: gameStarted || showInsufficientFunds ? 'none' : 'auto',
            transition: 'opacity 0.3s ease'
          }}
        >
          <span 
            className="font-gilroy-semibold"
            style={{
              fontSize: '14px',
              color: '#445768',
              position: 'absolute',
              left: '16px',
              top: '16px',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            Ставка
          </span>
          {isToncoinActive ? (
            <div 
              style={{
                position: 'absolute',
                left: '16px',
                top: '48px',
                width: 'calc(100% - 32px)',
                height: '64px',
                backgroundColor: '#242E37',
                borderRadius: '20px'
              }}
            >
              <img 
                src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/toncoin_active.svg"
                alt="TON"
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '30px',
                  height: '30px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              />
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={tempBetAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numbers and one decimal point
                    if (/^\d*\.?\d*$/.test(value)) {
                      setTempBetAmount(value);
                    }
                  }}
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown}
                  placeholder="0.00"
                  className="text-white font-gilroy-bold bg-transparent border-none outline-none"
                  style={{
                    position: 'absolute',
                    left: '62px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '20px',
                    width: '100px',
                    color: tempBetAmount ? '#FFFFFF' : '#445768'
                  }}
                />
              ) : (
                <span 
                  className="text-white font-gilroy-bold cursor-pointer"
                  onClick={handleBetClick}
                  style={{
                    position: 'absolute',
                    left: '62px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '20px'
                  }}
                >
                  {betAmount}
                </span>
              )}
              
              {/* Два прямоугольника справа */}
              <div 
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  gap: '6px'
                }}
              >
                <div 
                  className="flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors duration-200"
                  onClick={handleHalfBet}
                  style={{
                    width: '64px',
                    height: '40px',
                    backgroundColor: '#303E4A',
                    borderRadius: '20px'
                  }}
                >
                  <span 
                    className="text-white font-gilroy-bold"
                    style={{
                      fontSize: '15px',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    1/2
                  </span>
                </div>
                <div 
                  className="flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors duration-200"
                  onClick={handleDoubleBet}
                  style={{
                    width: '64px',
                    height: '40px',
                    backgroundColor: '#303E4A',
                    borderRadius: '20px'
                  }}
                >
                  <span 
                    className="text-white font-gilroy-bold"
                    style={{
                      fontSize: '15px',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    x2
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="flex items-center justify-center cursor-pointer"
              onClick={() => setIsAddGiftsModalOpen(true)}
              style={{
                position: 'absolute',
                left: '16px',
                top: '48px',
                width: 'calc(100% - 32px)',
                height: '64px',
                background: 'linear-gradient(180deg, #1686FF 0%, #0072EE 100%)',
                borderRadius: '20px'
              }}
            >
              <span 
                className="text-white font-gilroy-semibold"
                style={{
                  fontSize: '18px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                Выбрать подарок
              </span>
            </div>
          )}
          <span 
            className="font-gilroy-semibold"
            style={{
              fontSize: '14px',
              color: '#445768',
              position: 'absolute',
              left: '16px',
              top: '128px',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            Кол-во мин
          </span>
          
          {/* Четыре прямоугольника под текстом "Кол-во мин" */}
          <div 
            style={{
              position: 'absolute',
              left: '16px',
              top: '160px',
              display: 'flex',
              gap: '16px',
              width: 'calc(100% - 32px)'
            }}
          >
            {/* Первый прямоугольник */}
            <div 
              className="flex items-center justify-center cursor-pointer"
              onClick={() => handleMineSelection(3)}
              style={{
                width: '54px',
                height: '64px',
                background: selectedMines === 3 ? 'linear-gradient(180deg, #242E37 0%, #4C3026 100%)' : '#242E37',
                borderRadius: '20px',
                border: selectedMines === 3 ? '2px solid transparent' : 'none',
                backgroundImage: selectedMines === 3 ? 'linear-gradient(180deg, #242E37 0%, #4C3026 100%), linear-gradient(180deg, #FF6817 0%, #D81900 100%)' : undefined,
                backgroundOrigin: selectedMines === 3 ? 'border-box' : undefined,
                backgroundClip: selectedMines === 3 ? 'content-box, border-box' : undefined
              }}
            >
              <span 
                className="font-gilroy-bold text-white"
                style={{
                  fontSize: '20px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                3
              </span>
            </div>
            {/* Второй прямоугольник */}
            <div 
              className="flex items-center justify-center cursor-pointer"
              onClick={() => handleMineSelection(5)}
              style={{
                width: '54px',
                height: '64px',
                background: selectedMines === 5 ? 'linear-gradient(180deg, #242E37 0%, #4C3026 100%)' : '#242E37',
                borderRadius: '20px',
                border: selectedMines === 5 ? '2px solid transparent' : 'none',
                backgroundImage: selectedMines === 5 ? 'linear-gradient(180deg, #242E37 0%, #4C3026 100%), linear-gradient(180deg, #FF6817 0%, #D81900 100%)' : undefined,
                backgroundOrigin: selectedMines === 5 ? 'border-box' : undefined,
                backgroundClip: selectedMines === 5 ? 'content-box, border-box' : undefined
              }}
            >
              <span 
                className="font-gilroy-bold text-white"
                style={{
                  fontSize: '20px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                5
              </span>
            </div>
            {/* Третий прямоугольник */}
            <div 
              className="flex items-center justify-center cursor-pointer"
              onClick={() => handleMineSelection(10)}
              style={{
                width: '54px',
                height: '64px',
                background: selectedMines === 10 ? 'linear-gradient(180deg, #242E37 0%, #4C3026 100%)' : '#242E37',
                borderRadius: '20px',
                border: selectedMines === 10 ? '2px solid transparent' : 'none',
                backgroundImage: selectedMines === 10 ? 'linear-gradient(180deg, #242E37 0%, #4C3026 100%), linear-gradient(180deg, #FF6817 0%, #D81900 100%)' : undefined,
                backgroundOrigin: selectedMines === 10 ? 'border-box' : undefined,
                backgroundClip: selectedMines === 10 ? 'content-box, border-box' : undefined
              }}
            >
              <span 
                className="font-gilroy-bold text-white"
                style={{
                  fontSize: '20px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                10
              </span>
            </div>
            {/* Четвертый прямоугольник */}
            <div 
              className="flex items-center justify-center cursor-pointer"
              onClick={!isEditingMines ? handleCustomMinesClick : undefined}
              style={{
                width: '138px',
                height: '64px',
                background: customMines !== null ? 'linear-gradient(180deg, #242E37 0%, #4C3026 100%)' : '#242E37',
                borderRadius: '20px',
                border: customMines !== null ? '2px solid transparent' : 'none',
                backgroundImage: customMines !== null ? 'linear-gradient(180deg, #242E37 0%, #4C3026 100%), linear-gradient(180deg, #FF6817 0%, #D81900 100%)' : undefined,
                backgroundOrigin: customMines !== null ? 'border-box' : undefined,
                backgroundClip: customMines !== null ? 'content-box, border-box' : undefined
              }}
            >
              {isEditingMines ? (
                <input
                  ref={minesInputRef}
                  type="text"
                  value={tempCustomMines}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numbers
                    if (/^\d*$/.test(value)) {
                      setTempCustomMines(value);
                    }
                  }}
                  onBlur={handleMinesInputBlur}
                  onKeyDown={handleMinesInputKeyDown}
                  placeholder="1-24"
                  className="text-white font-gilroy-bold bg-transparent border-none outline-none text-center"
                  style={{
                    fontSize: '20px',
                    width: '100%',
                    color: tempCustomMines ? '#FFFFFF' : '#445768'
                  }}
                />
              ) : (
                <span 
                  className="font-gilroy-bold"
                  style={{
                    fontSize: '20px',
                    color: customMines !== null ? '#FFFFFF' : '#445768',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                >
                  {customMines !== null ? customMines : 'Изменить'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Новый прямоугольник под настройками */}
      <div style={{ marginTop: '16px' }}>
        <div 
          style={{
            width: '100%',
            height: '34px',
            backgroundColor: '#1D252C',
            borderRadius: '20px 20px 4px 4px',
            opacity: gameStarted ? 0.5 : 1,
            pointerEvents: gameStarted ? 'none' : 'auto',
            transition: 'opacity 0.3s ease',
            display: 'flex'
          }}
        >
          {/* Игрок */}
          <div 
            className="flex items-center justify-center"
            style={{
              width: '25%',
              height: '100%'
            }}
          >
            <span 
              className="font-gilroy-bold"
              style={{
                fontSize: '12px',
                color: '#445768',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            >
              Игрок
            </span>
          </div>
          
          {/* Ставка */}
          <div 
            className="flex items-center justify-center"
            style={{
              width: '25%',
              height: '100%'
            }}
          >
            <span 
              className="font-gilroy-bold"
              style={{
                fontSize: '12px',
                color: '#445768',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            >
              Ставка
            </span>
          </div>
          
          {/* Бомб */}
          <div 
            className="flex items-center justify-center"
            style={{
              width: '25%',
              height: '100%'
            }}
          >
            <span 
              className="font-gilroy-bold"
              style={{
                fontSize: '12px',
                color: '#445768',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            >
              Бомб
            </span>
          </div>
          
          {/* Выигрыш */}
          <div 
            className="flex items-center justify-center"
            style={{
              width: '25%',
              height: '100%'
            }}
          >
            <span 
              className="font-gilroy-bold"
              style={{
                fontSize: '12px',
                color: '#445768',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            >
              Выигрыш
            </span>
          </div>
        </div>
      </div>

      {/* Live wins display */}
      {liveWins.length > 0 && (
        <div 
          style={{ 
            marginTop: '4px',
            opacity: gameStarted || showWinModal || showInsufficientFunds ? 0.5 : 1,
            pointerEvents: gameStarted || showWinModal || showInsufficientFunds ? 'none' : 'auto',
            transition: 'opacity 0.3s ease'
          }}
        >
          {liveWins.map((win, index) => {
            const isNewWin = win && animatingWins.has(win.id);
            
            return (
              <div
                key={win.id}
                className={`transition-all duration-500 ease-out ${
                  isNewWin ? 'live-win-enter' : ''
                }`}
                style={{
                  width: '100%',
                  height: '44px',
                  backgroundColor: '#1D252C',
                  borderRadius: '4px',
                  marginTop: index === 0 ? '0px' : '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {/* Игрок */}
                <div 
                  className="flex items-center justify-center"
                  style={{
                    width: '25%',
                    height: '100%'
                  }}
                >
                  <div className="flex items-center">
                    {/* Аватарка пользователя */}
                    <div 
                      className="rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{ 
                        width: '26px', 
                        height: '26px',
                        backgroundColor: '#303E4A'
                      }}
                    >
                      {win.user?.photo_url ? (
                        <img 
                          src={win.user.photo_url} 
                          alt="User Avatar" 
                          className="w-full h-full object-cover rounded-full"
                          style={{ imageRendering: 'auto' }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-gilroy-bold">
                            {(win.user?.first_name?.charAt(0) || win.user?.username?.charAt(0) || '?')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Имя пользователя */}
                    <span 
                      className="font-gilroy-bold"
                      style={{
                        fontSize: '12px',
                        color: '#FFFFFF',
                        marginLeft: '6px',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                      }}
                    >
                      {formatUserName(win.user?.first_name || win.user?.username || 'Игрок')}
                    </span>
                  </div>
                </div>
                
                {/* Ставка */}
                <div 
                  className="flex items-center justify-center"
                  style={{
                    width: '25%',
                    height: '100%'
                  }}
                >
                  <img 
                    src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/toncoin_active.svg"
                    alt="TON"
                    style={{
                      width: '13px',
                      height: '13px',
                      marginRight: '4px',
                      transform: 'translateY(-1.5px)'
                    }}
                  />
                  <span 
                    className="font-gilroy-bold"
                    style={{
                      fontSize: '12px',
                      color: '#FFFFFF',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    {win.betAmount}
                  </span>
                </div>
                
                {/* Бомб */}
                <div 
                  className="flex items-center justify-center"
                  style={{
                    width: '25%',
                    height: '100%'
                  }}
                >
                  <span 
                    className="font-gilroy-bold"
                    style={{
                      fontSize: '12px',
                      color: '#FFFFFF',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    {win.minesCount}
                  </span>
                </div>
                
                {/* Выигрыш */}
                <div 
                  className="flex items-center justify-center"
                  style={{
                    width: '25%',
                    height: '100%'
                  }}
                >
                  <span 
                    className="font-gilroy-bold"
                    style={{
                      fontSize: '12px',
                      color: '#1686FF',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    {formatWinAmount(win.winAmount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main content area - currently empty as requested */}
          <div className="flex-1 pb-24">
            {/* Content will be added later */}
          </div>
        </div>
      </div>

      <Footer currentPage="mines" isModalOpen={isModalOpen} isLocked={gameStarted || showWinModal} />
      
      {/* Win Modal */}
      {showWinModal && (
        <div
          className="absolute z-[80] flex items-center justify-center"
          style={{
            top: '240px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '306px',
            height: '126px',
            borderRadius: '20px',
            background: 'linear-gradient(45deg, rgba(29, 37, 44, 0.55) 0%, rgba(51, 255, 136, 0.55) 100%), #1D252C',
            backgroundBlendMode: 'overlay',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
        >
          <div 
            className="absolute inset-0 rounded-[20px] pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.06) 100%)',
              mixBlendMode: 'overlay',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'xor',
              WebkitMaskComposite: 'xor',
              padding: '1px'
            }}
          />
          <div className="flex flex-col items-center justify-center">
            <span 
              className="font-gilroy-bold"
              style={{
                fontSize: (isToncoinActive && !winGiftName) ? '30px' : '24px',
                color: '#33FF88',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                textAlign: 'center',
                lineHeight: (isToncoinActive && !winGiftName) ? 'normal' : '28px'
              }}
            >
              {winGiftName ? `+${winGiftName}` : `+${winAmount} TON`}
            </span>
            <span 
              className="font-gilroy-semibold"
              style={{
                fontSize: '28px',
                color: '#FFFFFF',
                mixBlendMode: 'overlay',
                marginTop: '0px',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            >
              x{gemsFound === 0 ? '1.00' : (MINES_MULTIPLIERS[selectedMines]?.[gemsFound - 1] || 1).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Insufficient funds notification */}
      {showInsufficientFunds && (
        <div
          className="fixed z-[70] transition-all duration-300 ease-out"
          style={{
            top: '20px',
            right: '20px',
            width: '160px',
            height: '66px',
            backgroundColor: 'rgba(29, 37, 44, 0.8)',
            borderRadius: '20px',
            border: '1px solid transparent',
            background: 'url(https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/not_enough.jpg?v2) padding-box, linear-gradient(180deg, rgba(48, 66, 78, 1) 0%, rgba(48, 66, 78, 0.2) 100%) border-box',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div
            className="font-gilroy-semibold"
            style={{
              fontSize: '12px',
              color: '#FF4646',
              marginLeft: '16px',
              marginTop: '10px',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            Недостаточно средств
          </div>
          <div
            className="font-gilroy-semibold"
            style={{
              fontSize: '9px',
              background: 'linear-gradient(90deg, #34434F 38%, #6E454D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginLeft: '16px',
              marginTop: '0px',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            Для продолжения необходимо пополнить баланс
          </div>
        </div>
      )}

      {/* Модальное окно добавления гифтов */}
      {isAddGiftsModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto z-[60]" 
          onClick={() => {
            setIsAddGiftsModalOpen(false);
            setActiveInfoOverlay(null);
            setSelectedGifts([]);
          }}
        >
          <div 
            className="flex justify-center pt-10 pb-10"
          >
            <div 
              className="bg-white mx-4 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '380px',
                minHeight: '634px',
                borderRadius: '20px',
                backgroundColor: '#111A21',
                border: '1px solid #303E4A'
              }}
            >
            {/* Содержимое модального окна */}
              <div className="p-6">
                <div className="relative flex items-center justify-center mb-6">
                  <h2 className="font-gilroy-semibold text-white" style={{ fontSize: '20px' }}>
                    Выбрать подарки
                  </h2>
                  <button 
                    onClick={() => {
                      setIsAddGiftsModalOpen(false);
                      setActiveInfoOverlay(null);
                      setSelectedGifts([]);
                    }}
                    className="absolute text-gray-400 hover:text-white cursor-pointer transition-colors"
                    style={{
                      top: '50%',
                      right: '0px',
                      transform: 'translateY(-50%)',
                      width: '31px',
                      height: '31px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              
              {/* Предметы из инвентаря */}
              <div style={{ marginTop: '10px' }}>
                {userInventory.length === 0 ? (
                  <div 
                    className="flex flex-col items-center justify-center"
                    style={{ 
                      height: '120px',
                      backgroundColor: '#181F25',
                      borderRadius: '20px',
                      border: '1px solid #303E4A'
                    }}
                  >
                    <div
                      className="mb-2"
                      style={{
                        textAlign: 'center'
                      }}
                    >
                      <span
                        className="font-gilroy-semibold"
                        style={{
                          fontSize: '14px',
                          color: '#445768'
                        }}
                      >
                        Подарков нет,{' '}
                      </span>
                      <span
                        className="font-gilroy-semibold"
                        style={{
                          fontSize: '14px',
                          color: '#1686FF'
                        }}
                      >
                        но это исправимо
                      </span>
                    </div>
                    <div
                      className="font-gilroy-regular"
                      style={{
                        fontSize: '12px',
                        color: '#445768',
                        textAlign: 'center'
                      }}
                    >
                      Выигрывайте подарки в кейсах
                    </div>
                  </div>
                ) : (
                  <div>
                    {Array.from({ length: Math.ceil(userInventory.length / 3) }).map((_, rowIndex) => (
                      <div 
                        key={rowIndex} 
                        className="flex"
                        style={{ 
                          marginBottom: rowIndex < Math.ceil(userInventory.length / 3) - 1 ? '12px' : '0px',
                          gap: '12px'
                        }}
                      >
                        {userInventory.slice(rowIndex * 3, rowIndex * 3 + 3).map((item) => {
                          const isSelected = selectedGifts.includes(item.id);
                          const hasSelectedItems = selectedGifts.length > 0;
                          return (
                          <div
                            key={item.id}
                            className="relative flex items-center justify-center cursor-pointer"
                            style={{
                              width: '108px',
                              height: '108px',
                              background: 'linear-gradient(45deg, #161D24 0%, #1B232B 100%)',
                              borderRadius: '20px',
                              border: isSelected ? '1px solid #007AFF' : '1px solid #303E4A',
                              backgroundImage: item.gift_background ? `url(${item.gift_background})` : 'none',
                              backgroundSize: '108px 108px',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              opacity: hasSelectedItems && !isSelected ? 0.2 : 1,
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => handleGiftClick(item.id)}
                          >
                            {item.gift_icon && (
                              <img 
                                src={item.gift_icon}
                                alt={item.gift_name}
                                style={{
                                  width: '72px',
                                  height: '72px',
                                  objectFit: 'contain',
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none',
                                  MozUserSelect: 'none',
                                  msUserSelect: 'none'
                                }}
                              />
                            )}
                            
                            {/* Info overlay */}
                            {activeInfoOverlay === item.id && (
                              <div
                                className="absolute inset-0 flex flex-col items-center justify-center"
                                style={{
                                  backgroundColor: 'rgba(6, 14, 21, 0.85)',
                                  borderRadius: '20px',
                                  backdropFilter: 'blur(4px)',
                                  zIndex: 40,
                                  paddingTop: '13px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div
                                  className="font-gilroy-semibold text-white"
                                  style={{
                                    fontSize: '10px',
                                    textAlign: 'center',
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    MozUserSelect: 'none',
                                    msUserSelect: 'none'
                                  }}
                                >
                                  {item.gift_name}
                                </div>
                                <div
                                  className="flex items-center justify-center"
                                  style={{
                                    width: '47px',
                                    height: '18px',
                                    marginTop: '3px',
                                    background: 'linear-gradient(135deg, #0067D7 0%, #1686FF 100%)',
                                    cursor: 'pointer',
                                    borderRadius: '20px'
                                  }}
                                >
                                  <span 
                                    className="font-gilroy-bold text-white"
                                    style={{
                                      fontSize: '8px',
                                      userSelect: 'none',
                                      WebkitUserSelect: 'none',
                                      MozUserSelect: 'none',
                                      msUserSelect: 'none'
                                    }}
                                  >
                                    {formatGiftPrice(item.gift_price)} TON
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* Info icon in top right corner */}
                            <div
                              className="absolute cursor-pointer"
                              style={{
                                top: '6px',
                                right: '6px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 50
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveInfoOverlay(activeInfoOverlay === item.id ? null : item.id);
                              }}
                            >
                              {activeInfoOverlay === item.id ? (
                                <svg 
                                  width="10" 
                                  height="10" 
                                  viewBox="0 0 10 10" 
                                  fill="none" 
                                  xmlns="http://www.w3.org/2000/svg"
                                  style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    MozUserSelect: 'none',
                                    msUserSelect: 'none'
                                  }}
                                >
                                  <path d="M8.5 1.5L1.5 8.5M1.5 1.5L8.5 8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                              ) : (
                                <svg 
                                  width="12" 
                                  height="12" 
                                  viewBox="0 0 10 10" 
                                  fill="none" 
                                  xmlns="http://www.w3.org/2000/svg"
                                  style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    MozUserSelect: 'none',
                                    msUserSelect: 'none'
                                  }}
                                >
                                  <path d="M5.0249 6.2251C5.30104 6.2251 5.5249 6.44896 5.5249 6.7251V6.7749C5.5249 6.90782 5.47209 7.03558 5.37793 7.12939C5.28374 7.22322 5.15589 7.27542 5.02295 7.2749H4.97314C4.69777 7.27382 4.4751 7.05028 4.4751 6.7749V6.7251C4.4751 6.44896 4.69896 6.2251 4.9751 6.2251H5.0249Z" fill="white"/>
                                  <path d="M5 2.7251C5.27614 2.7251 5.5 2.94896 5.5 3.2251V5.2251C5.5 5.50124 5.27614 5.7251 5 5.7251C4.72386 5.7251 4.5 5.50124 4.5 5.2251V3.2251C4.5 2.94896 4.72386 2.7251 5 2.7251Z" fill="white"/>
                                  <path fillRule="evenodd" clipRule="evenodd" d="M5 0C7.76142 0 10 2.23858 10 5C10 7.76142 7.76142 10 5 10C2.23858 10 0 7.76142 0 5C0 2.23858 2.23858 0 5 0ZM5 1C2.79086 1 1 2.79086 1 5C1 7.20914 2.79086 9 5 9C7.20914 9 9 7.20914 9 5C9 2.79086 7.20914 1 5 1Z" fill="white"/>
                                </svg>
                              )}
                            </div>
                          </div>
                        );
                        })}
                        
                        {/* Заполнение пустых мест в ряду */}
                        {userInventory.slice(rowIndex * 3, rowIndex * 3 + 3).length < 3 && 
                          Array.from({ length: 3 - userInventory.slice(rowIndex * 3, rowIndex * 3 + 3).length }).map((_, emptyIndex) => (
                            <div
                              key={`empty-${emptyIndex}`}
                              style={{ width: '108px', height: '108px' }}
                            />
                          ))
                        }
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>
            
            
            </div>
          </div>
        </div>
      )}

      {/* Кнопка "Начать игру" - показывается только когда есть выбранные подарки в модальном окне */}
      {isAddGiftsModalOpen && selectedGifts.length > 0 && (
        <div 
          className="fixed left-1/2 transform -translate-x-1/2 transition-all duration-150 ease-in-out"
          style={{
            bottom: '20px',
            zIndex: 80
          }}
        >
          <button 
            onClick={() => {
              // Вычисляем сумму выбранных подарков
              const selectedItems = userInventory.filter(item => selectedGifts.includes(item.id));
              const totalGiftValue = selectedItems.reduce((sum, item) => sum + item.gift_price, 0);
              
              // Устанавливаем сумму ставки равной сумме подарков
              setBetAmount(totalGiftValue.toFixed(2));
              
              // Сохраняем выбранные подарки для передачи в игру
              const currentSelectedGifts = [...selectedGifts];
              
              // Закрываем модальное окно
              setIsAddGiftsModalOpen(false);
              setActiveInfoOverlay(null);
              setSelectedGifts([]);
              
              // Запускаем игру с выбранными подарками
              handleStartGame(currentSelectedGifts);
            }}
            className="font-gilroy-semibold text-white"
            style={{
              width: '348px',
              height: '44px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0067D7 0%, #1686FF 100%)',
              fontSize: '15px',
              border: 'none',
              cursor: 'pointer',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            Начать игру
          </button>
        </div>
      )}
    </div>
  );
}
