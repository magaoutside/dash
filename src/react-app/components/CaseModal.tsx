import { useEffect, useState, useMemo, useRef } from 'react';
import { useBalance } from '@/react-app/hooks/useBalance';
import { formatGiftPrice } from '@/react-app/utils/formatGiftPrice';

interface CaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseType?: 'bordered' | 'borderless';
  caseName?: string;
  casePrice?: number;
}

export default function CaseModal({ isOpen, onClose, caseType = 'bordered', caseName = 'Love Party', casePrice = 6 }: CaseModalProps) {
  const [selectedMultiplier, setSelectedMultiplier] = useState<string>('x1');
  const [isDemoToggled, setIsDemoToggled] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [canSkip, setCanSkip] = useState<boolean>(false);
  const [hasSkipped, setHasSkipped] = useState<boolean>(false);
  const scrollContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [squareBackgrounds, setSquareBackgrounds] = useState<string[][]>([]);
  const [squareGiftIcons, setSquareGiftIcons] = useState<string[][]>([]);
  const [hasWinningSquare, setHasWinningSquare] = useState<boolean>(false);
  const [winningGiftPrice, setWinningGiftPrice] = useState<number>(0);
  const [isSelling, setIsSelling] = useState<boolean>(false);
  const [isAddingToInventory, setIsAddingToInventory] = useState<boolean>(false);
  const [isClosingWithPrizes, setIsClosingWithPrizes] = useState<boolean>(false);
  const [winningItems, setWinningItems] = useState<Array<{
    giftName: string;
    giftIcon: string;
    giftBackground: string;
    giftPrice: number;
  }>>([]);
  const [activeInfoOverlay, setActiveInfoOverlay] = useState<number | null>(null);
  const [showInsufficientFunds, setShowInsufficientFunds] = useState<boolean>(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'ton' | 'stars'>('ton');
  const [tonPrice, setTonPrice] = useState<number>(3.21); // Default TONCOIN price in USD
  const { updateBalance, balance } = useBalance();

  

  // Маппинг названий подарков на иконки и фоны
  const giftMapping: { [key: string]: { icon: string; background: string } } = {
    // Love Party кейс
    'Heart Locket': { 
      icon: 'https://cdn.changes.tg/gifts/models/Heart%20Locket/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg'
    },
    'Neko Helmet': { 
      icon: 'https://cdn.changes.tg/gifts/models/Neko%20Helmet/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg'
    },
    'Toy Bear': { 
      icon: 'https://cdn.changes.tg/gifts/models/Toy%20Bear/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg'
    },
    'Ionic Dryer': { 
      icon: 'https://cdn.changes.tg/gifts/models/Ionic%20Dryer/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg'
    },
    'Love Potion': { 
      icon: 'https://cdn.changes.tg/gifts/models/Love%20Potion/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg'
    },
    'Valentine Box': { 
      icon: 'https://cdn.changes.tg/gifts/models/Valentine%20Box/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg'
    },
    'Joyful Bundle': { 
      icon: 'https://cdn.changes.tg/gifts/models/Joyful%20Bundle/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg'
    },
    // Gold Rush кейс (Nail Bracelet теперь используется в Rich Holder как Rare)
    'Nail Bracelet': { 
      icon: 'https://cdn.changes.tg/gifts/models/Nail%20Bracelet/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg'
    },
    'Bonded Ring': { 
      icon: 'https://cdn.changes.tg/gifts/models/Bonded%20Ring/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg'
    },
    'Genie Lamp': { 
      icon: 'https://cdn.changes.tg/gifts/models/Genie%20Lamp/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg'
    },
    'Swiss Watch': { 
      icon: 'https://cdn.changes.tg/gifts/models/Swiss%20Watch/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg'
    },
    'Signet Ring': { 
      icon: 'https://cdn.changes.tg/gifts/models/Signet%20Ring/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg'
    },
    'Cupid Charm': { 
      icon: 'https://cdn.changes.tg/gifts/models/Cupid%20Charm/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg'
    },
    'Sleigh Bell': { 
      icon: 'https://cdn.changes.tg/gifts/models/Sleigh%20Bell/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg'
    },
    // Gangsta кейс
    'Westside Sign': { 
      icon: 'https://cdn.changes.tg/gifts/models/Westside%20Sign/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg'
    },
    'Low Rider': { 
      icon: 'https://cdn.changes.tg/gifts/models/Low%20Rider/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg'
    },
    'Vintage Cigar': { 
      icon: 'https://cdn.changes.tg/gifts/models/Vintage%20Cigar/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg'
    },
    'Record Player': { 
      icon: 'https://cdn.changes.tg/gifts/models/Record%20Player/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg'
    },
    'Snoop Cigar': { 
      icon: 'https://cdn.changes.tg/gifts/models/Snoop%20Cigar/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg'
    },
    'Swag Bag': { 
      icon: 'https://cdn.changes.tg/gifts/models/Swag%20Bag/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg'
    },
    'Snoop Dogg': { 
      icon: 'https://cdn.changes.tg/gifts/models/Snoop%20Dogg/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg'
    },
    // Rich Holder кейс
    'Plush Pepe': { 
      icon: 'https://cdn.changes.tg/gifts/models/Plush%20Pepe/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg'
    },
    'Precious Peach': { 
      icon: 'https://cdn.changes.tg/gifts/models/Precious%20Peach/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg'
    },
    'Mighty Arm': { 
      icon: 'https://cdn.changes.tg/gifts/models/Mighty%20Arm/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg'
    },
    'Loot Bag': { 
      icon: 'https://cdn.changes.tg/gifts/models/Loot%20Bag/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg'
    },
    'Ion Gem': { 
      icon: 'https://cdn.changes.tg/gifts/models/Ion%20Gem/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg'
    },
    // Rich Mood кейс
    'Durov\'s Cap': { 
      icon: 'https://cdn.changes.tg/gifts/models/Durov\'s%20Cap/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg'
    },
    // VIP Box кейс
    'Diamond Ring': { 
      icon: 'https://cdn.changes.tg/gifts/models/Diamond%20Ring/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg'
    },
    'Bow Tie': { 
      icon: 'https://cdn.changes.tg/gifts/models/Bow%20Tie/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg'
    },
    'Fresh Socks': { 
      icon: 'https://cdn.changes.tg/gifts/models/Fresh%20Socks/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg'
    },
    // Lunch Box кейс
    'Bunny Muffin': { 
      icon: 'https://cdn.changes.tg/gifts/models/Bunny%20Muffin/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg'
    },
    'Easter Egg': { 
      icon: 'https://cdn.changes.tg/gifts/models/Easter%20Egg/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg'
    },
    'Candy Cane': { 
      icon: 'https://cdn.changes.tg/gifts/models/Candy%20Cane/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg'
    },
    'Whip Cupcake': { 
      icon: 'https://cdn.changes.tg/gifts/models/Whip%20Cupcake/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg'
    },
    'Berry Box': { 
      icon: 'https://cdn.changes.tg/gifts/models/Berry%20Box/png/Original.png',
      background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg'
    }
  };

  // Функция для получения фона подарка в зависимости от кейса
  const getGiftBackground = (giftName: string, caseName: string): string => {
    // Для Rich Holder используем специальные редкости
    if (caseName === 'Rich Holder') {
      switch (giftName) {
        case 'Plush Pepe': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg';
        case 'Heart Locket': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg';
        case 'Precious Peach': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
        case 'Mighty Arm': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
        case 'Nail Bracelet': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg';
        case 'Loot Bag': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
        case 'Ion Gem': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
        default: return giftMapping[giftName]?.background || 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
      }
    }
    
    // Для Rich Mood используем специальные редкости
    if (caseName === 'Rich Mood') {
      switch (giftName) {
        case 'Plush Pepe': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg';
        case 'Heart Locket': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg';
        case 'Durov\'s Cap': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
        case 'Precious Peach': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg';
        default: return giftMapping[giftName]?.background || 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
      }
    }
    
    // Для VIP Box используем специальные редкости
    if (caseName === 'VIP Box') {
      switch (giftName) {
        case 'Swiss Watch': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg';
        case 'Vintage Cigar': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg';
        case 'Diamond Ring': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
        case 'Cupid Charm': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
        case 'Record Player': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg';
        case 'Bow Tie': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
        case 'Fresh Socks': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
        default: return giftMapping[giftName]?.background || 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
      }
    }
    
    // Для Lunch Box используем специальные редкости
    if (caseName === 'Lunch Box') {
      switch (giftName) {
        case 'Valentine Box': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg';
        case 'Berry Box': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg';
        case 'Bunny Muffin': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
        case 'Easter Egg': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg';
        case 'Candy Cane': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
        case 'Whip Cupcake': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
        default: return giftMapping[giftName]?.background || 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
      }
    }
    
    // Для Love Party используем специальные редкости
    if (caseName === 'Love Party') {
      switch (giftName) {
        case 'Heart Locket': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg';
        case 'Neko Helmet': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg';
        case 'Toy Bear': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
        case 'Ionic Dryer': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
        case 'Love Potion': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg';
        case 'Valentine Box': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
        case 'Joyful Bundle': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
        default: return giftMapping[giftName]?.background || 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
      }
    }
    
    // Для Gold Rush используем специальные редкости
    if (caseName === 'Gold Rush') {
      switch (giftName) {
        case 'Nail Bracelet': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg';
        case 'Bonded Ring': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg';
        case 'Genie Lamp': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
        case 'Swiss Watch': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
        case 'Signet Ring': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg';
        case 'Cupid Charm': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
        case 'Sleigh Bell': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
        default: return giftMapping[giftName]?.background || 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
      }
    }
    
    // Для Tasty Bundle используем те же редкости что и Gold Rush
    if (caseName === 'Tasty Bundle') {
      switch (giftName) {
        case 'Nail Bracelet': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg';
        case 'Bonded Ring': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg';
        case 'Genie Lamp': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
        case 'Swiss Watch': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
        case 'Signet Ring': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg';
        case 'Cupid Charm': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
        case 'Sleigh Bell': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
        default: return giftMapping[giftName]?.background || 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
      }
    }
    
    // Для Gangsta используем специальные редкости
    if (caseName === 'Gangsta') {
      switch (giftName) {
        case 'Westside Sign': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg';
        case 'Low Rider': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg';
        case 'Vintage Cigar': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg';
        case 'Record Player': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
        case 'Snoop Cigar': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg';
        case 'Swag Bag': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
        case 'Snoop Dogg': return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
        default: return giftMapping[giftName]?.background || 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
      }
    }
    
    // Для остальных кейсов используем стандартный маппинг
    return giftMapping[giftName]?.background || 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg';
  };

  // Состояние для вероятностей подарков из базы данных
  const [giftProbabilities, setGiftProbabilities] = useState<Array<{
    background: string;
    icon: string;
    weight: number;
    price: number;
    name: string;
  }>>([]);

  // Загружаем цены подарков из API при монтировании компонента и смене кейса
  useEffect(() => {
    const loadGiftPrices = async () => {
      try {
        const response = await fetch('/api/gifts/prices');
        if (response.ok) {
          const data = await response.json();
          
          // Генерируем вероятности на основе загруженных цен
          const probabilities = generateGiftProbabilities(data.gifts);
          setGiftProbabilities(probabilities);
          console.log(`Generated probabilities for ${caseName}:`, probabilities);
          
          // Отладка для Fresh Socks в VIP Box
          if (caseName === 'VIP Box') {
            console.log('VIP Box - API gifts data:', data.gifts);
            console.log('VIP Box - Fresh Socks price from API:', data.gifts['Fresh Socks']);
            console.log('VIP Box - Fresh Socks in probabilities:', probabilities.find(p => p.name === 'Fresh Socks'));
          }
        }
      } catch (error) {
        console.error('Failed to load gift prices:', error);
        // В случае ошибки показываем ошибку в консоли и не устанавливаем никаких значений
        console.error('Failed to load gift prices, using empty array');
        setGiftProbabilities([]);
      }
    };

    // Загружаем курс TONCOIN
    const loadTonPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
        if (response.ok) {
          const data = await response.json();
          const price = data['the-open-network']?.usd;
          if (price && typeof price === 'number') {
            setTonPrice(price);
            console.log(`TONCOIN price updated: $${price}`);
          }
        }
      } catch (error) {
        console.error('Failed to load TONCOIN price, using default:', error);
      }
    };

    if (isOpen) {
      loadGiftPrices();
      loadTonPrice();
    }
  }, [caseName, isOpen]);

  // Функция для генерации вероятностей на основе цен подарков
  const generateGiftProbabilities = (prices: { [key: string]: number }) => {
    const probabilities = [];
    
    // Определяем какие подарки использовать в зависимости от кейса
    const caseGifts: { [key: string]: string[] } = {
      'Love Party': ['Heart Locket', 'Neko Helmet', 'Toy Bear', 'Ionic Dryer', 'Love Potion', 'Valentine Box', 'Joyful Bundle'],
      'Gold Rush': ['Nail Bracelet', 'Bonded Ring', 'Genie Lamp', 'Swiss Watch', 'Signet Ring', 'Cupid Charm', 'Sleigh Bell'],
      'Tasty Bundle': ['Nail Bracelet', 'Bonded Ring', 'Genie Lamp', 'Swiss Watch', 'Signet Ring', 'Cupid Charm', 'Sleigh Bell'], // use Gold Rush gifts
      'Gangsta': ['Westside Sign', 'Low Rider', 'Vintage Cigar', 'Record Player', 'Snoop Cigar', 'Swag Bag', 'Snoop Dogg'],
      'VIP Box': ['Swiss Watch', 'Vintage Cigar', 'Diamond Ring', 'Cupid Charm', 'Record Player', 'Bow Tie', 'Fresh Socks'],
      'Rich Holder': ['Plush Pepe', 'Heart Locket', 'Precious Peach', 'Mighty Arm', 'Nail Bracelet', 'Loot Bag', 'Ion Gem'],
      'Rich Mood': ['Plush Pepe', 'Heart Locket', 'Durov\'s Cap', 'Precious Peach'],
      'Lunch Box': ['Valentine Box', 'Berry Box', 'Bunny Muffin', 'Easter Egg', 'Candy Cane', 'Whip Cupcake']
    };
    
    const currentCaseGifts = caseGifts[caseName] || caseGifts['Gold Rush'];
    
    // Используем только подарки для текущего кейса
    for (const giftName of currentCaseGifts) {
      const price = prices[giftName];
      
      // Отладка для Fresh Socks
      if (giftName === 'Fresh Socks' && caseName === 'VIP Box') {
        console.log('Fresh Socks debug:', {
          giftName,
          price,
          hasGiftMapping: !!giftMapping[giftName],
          giftMapping: giftMapping[giftName]
        });
      }
      
      if (price && giftMapping[giftName]) {
        // Определяем вес на основе цены и кейса (настроено для RTP 97.8% с общей суммой 100%)
        let weight;
        
        if (caseName === 'Gangsta') {
          // Специальные веса для кейса Gangsta (RTP 97.8%)
          if (giftName === 'Westside Sign') {
            weight = 0.07; // 40.98 TON
          } else if (giftName === 'Low Rider') {
            weight = 0.5; // 19.70 TON
          } else if (giftName === 'Vintage Cigar') {
            weight = 0.5; // 19.50 TON
          } else if (giftName === 'Record Player') {
            weight = 2.0; // 8.50 TON
          } else if (giftName === 'Snoop Cigar') {
            weight = 5.5; // 4.10 TON
          } else if (giftName === 'Swag Bag') {
            weight = 45.715; // 2.00 TON
          } else if (giftName === 'Snoop Dogg') {
            weight = 45.715; // 2.00 TON
          } else {
            weight = 45.715; // fallback для остальных дешевых подарков
          }
        } else if (caseName === 'Love Party') {
          // Специальные веса для кейса Love Party (RTP 97.8%)
          if (giftName === 'Heart Locket') {
            weight = 0.003; // 1800.00 TON - крайне редкий (0.003%)
          } else if (giftName === 'Neko Helmet') {
            weight = 0.5; // 22.22 TON
          } else if (giftName === 'Toy Bear') {
            weight = 1.5; // 15.00 TON
          } else if (giftName === 'Ionic Dryer') {
            weight = 1.8; // 14.00 TON
          } else if (giftName === 'Love Potion') {
            weight = 12.0; // 7.90 TON
          } else if (giftName === 'Valentine Box') {
            weight = 42.097; // 3.70 TON
          } else if (giftName === 'Joyful Bundle') {
            weight = 42.1; // 2.48 TON
          } else {
            weight = 42.1; // fallback для остальных дешевых подарков
          }
        } else if (caseName === 'Rich Holder') {
          // Специальные веса для премиум кейса Rich Holder (RTP 97.7%)
          if (giftName === 'Plush Pepe') {
            weight = 0.2; // Arcane - крайне редкий (0.2%)
          } else if (giftName === 'Heart Locket') {
            weight = 1.2; // Immortal - очень редкий (1.2%)
          } else if (giftName === 'Precious Peach') {
            weight = 3.6; // Legendary - редкий (3.6%)
          } else if (giftName === 'Mighty Arm') {
            weight = 3.8; // Legendary - редкий (3.8%)
          } else if (giftName === 'Nail Bracelet') {
            weight = 10.8; // Rare - необычный (10.8%)
          } else if (giftName === 'Loot Bag') {
            weight = 40.2; // Common - обычный (40.2%)
          } else if (giftName === 'Ion Gem') {
            weight = 40.2; // Common - обычный (40.2%)
          } else {
            weight = 40.2; // fallback
          }
        } else if (caseName === 'Rich Mood') {
          // Специальные веса для кейса Rich Mood (RTP 97.4%)
          if (giftName === 'Plush Pepe') {
            weight = 0.2; // Arcane - крайне редкий (0.2%)
          } else if (giftName === 'Heart Locket') {
            weight = 4.8; // Immortal - очень редкий (4.8%)
          } else if (giftName === 'Durov\'s Cap') {
            weight = 59.0; // Legendary - редкий (59.0%)
          } else if (giftName === 'Precious Peach') {
            weight = 36.0; // Rare - частый (36.0%)
          } else {
            weight = 36.0; // fallback
          }
        } else if (caseName === 'VIP Box') {
          // Специальные веса для кейса VIP Box (RTP 97.8%)
          if (giftName === 'Swiss Watch') {
            weight = 0.15; // Arcane - крайне редкий (0.15%)
          } else if (giftName === 'Vintage Cigar') {
            weight = 1.2; // Immortal - очень редкий (1.2%)
          } else if (giftName === 'Diamond Ring') {
            weight = 3.8; // Legendary - редкий (3.8%)
          } else if (giftName === 'Cupid Charm') {
            weight = 4.2; // Legendary - редкий (4.2%)
          } else if (giftName === 'Record Player') {
            weight = 12.0; // Rare - необычный (12.0%)
          } else if (giftName === 'Bow Tie') {
            weight = 39.325; // Common - обычный (39.325%)
          } else if (giftName === 'Fresh Socks') {
            weight = 39.325; // Common - обычный (39.325%)
          } else {
            weight = 39.325; // fallback
          }
        } else if (caseName === 'Lunch Box') {
          // Специальные веса для кейса Lunch Box (RTP 97.5%)
          if (giftName === 'Valentine Box') {
            weight = 0.3; // Arcane - крайне редкий (0.3%)
          } else if (giftName === 'Berry Box') {
            weight = 2.5; // Immortal - очень редкий (2.5%)
          } else if (giftName === 'Bunny Muffin') {
            weight = 8.5; // Legendary - редкий (8.5%)
          } else if (giftName === 'Easter Egg') {
            weight = 18.0; // Rare - необычный (18.0%)
          } else if (giftName === 'Candy Cane') {
            weight = 35.35; // Common - обычный (35.35%)
          } else if (giftName === 'Whip Cupcake') {
            weight = 35.35; // Common - обычный (35.35%)
          } else {
            weight = 35.35; // fallback
          }
        } else {
          // Стандартные веса для других кейсов
          if (price >= 80) {
            weight = 0.985; // Nail Bracelet (99.99 TON)
          } else if (price >= 40) {
            weight = 2.305; // Bonded Ring (46.00 TON)
          } else if (price >= 30) {
            weight = 2.75; // Genie Lamp (35.56 TON)
          } else if (price >= 25) {
            weight = 3.94; // Swiss Watch (28.80 TON)
          } else if (price >= 15) {
            weight = 6.4; // Signet Ring (20.99 TON)
          } else if (price >= 7) {
            weight = 24.15; // Cupid Charm (8.44 TON)
          } else {
            weight = 59.46; // Sleigh Bell (5.40 TON)
          }
        }

        probabilities.push({
          background: getGiftBackground(giftName, caseName), // Используем фон в зависимости от кейса
          icon: giftMapping[giftName].icon,
          weight,
          price,
          name: giftName
        });
      }
    }

    // Если не удалось загрузить подарки, возвращаем пустой массив
    return probabilities;
  };

  // Функция для выбора подарка на основе вероятностей
  const selectGiftByProbability = () => {
    if (giftProbabilities.length === 0) {
      // Если вероятности не загружены, возвращаем подарок Gold Rush по умолчанию
      console.warn('Gift probabilities not loaded yet');
      return {
        background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg',
        icon: 'https://cdn.changes.tg/gifts/models/Sleigh%20Bell/png/Original.png',
        price: 0
      };
    }

    const random = Math.random() * 100; // Случайное число от 0 до 100
    let cumulativeWeight = 0;
    
    for (const gift of giftProbabilities) {
      cumulativeWeight += gift.weight;
      if (random <= cumulativeWeight) {
        return {
          background: gift.background,
          icon: gift.icon,
          price: gift.price
        };
      }
    }
    
    // Fallback к последнему подарку, если что-то пошло не так
    const lastGift = giftProbabilities[giftProbabilities.length - 1];
    return {
      background: lastGift.background,
      icon: lastGift.icon,
      price: lastGift.price
    };
  };

  

  // Функция для генерации случайных фонов для всех квадратов
  const generateRandomBackgrounds = () => {
    const totalRectangles = 1 + additionalRectangles;
    const newBackgrounds: string[][] = [];
    const newGiftIcons: string[][] = [];
    
    for (let rectIndex = 0; rectIndex < totalRectangles; rectIndex++) {
      const rectangleBackgrounds: string[] = [];
      const rectangleGiftIcons: string[] = [];
      for (let squareIndex = 0; squareIndex < 125; squareIndex++) {
        // Используем систему вероятностей для выбора подарка
        const selectedGift = selectGiftByProbability();
        rectangleBackgrounds.push(selectedGift.background);
        rectangleGiftIcons.push(selectedGift.icon);
      }
      newBackgrounds.push(rectangleBackgrounds);
      newGiftIcons.push(rectangleGiftIcons);
    }
    
    setSquareBackgrounds(newBackgrounds);
    setSquareGiftIcons(newGiftIcons);
  };

  const multipliers = [
    { id: 'x1', label: 'x1', width: 78 }, // 235/3 ≈ 78
    { id: 'x2', label: 'x2', width: 78 },
    { id: 'x3', label: 'x3', width: 79 } // Последний блок немного больше для компенсации округления
  ];

  // Вычисляем количество дополнительных прямоугольников и высоту модального окна
  const additionalRectangles = useMemo(() => {
    if (selectedMultiplier === 'x2') return 1;
    if (selectedMultiplier === 'x3') return 2;
    return 0;
  }, [selectedMultiplier]);

  const modalHeight = useMemo(() => {
    const baseHeight = 732;
    const rectangleHeight = baseHeight * 0.184; // Высота одного прямоугольника
    const gap = 16; // Отступ между прямоугольниками
    return baseHeight + (additionalRectangles * (rectangleHeight + gap));
  }, [additionalRectangles]);

  // Вычисляем позицию ползунка для GPU оптимизации
  const sliderStyle = useMemo(() => {
    const selectedIndex = multipliers.findIndex(m => m.id === selectedMultiplier);
    if (selectedIndex === -1) return { transform: 'translateX(0px)', width: 0 };

    let translateX = 0;
    for (let i = 0; i < selectedIndex; i++) {
      translateX += multipliers[i].width;
    }

    return {
      transform: `translateX(${translateX}px)`,
      width: `${multipliers[selectedIndex].width}px`
    };
  }, [selectedMultiplier, multipliers]);

  // Блокируем скролл страницы когда модальное окно открыто
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Очищаем при размонтировании компонента
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Функция сброса всех квадратов к базовому размеру (с генерацией новых фонов)
  const resetAllSquares = () => {
    // Генерируем новые случайные фоны при сбросе
    generateRandomBackgrounds();
    resetSquareStyles();
  };

  // Функция сброса только стилей квадратов без изменения содержимого
  const resetSquareStyles = () => {
    scrollContainerRefs.current.forEach((container) => {
      if (!container) return;
      
      const squares = container.children[0] as HTMLElement;
      if (!squares) return;
      
      // Сбрасываем маску к стандартной
      container.style.mask = 'linear-gradient(to right, rgba(18, 24, 28, 0) 0%, rgba(18, 24, 28, 1) 20%, rgba(27, 36, 44, 1) 80%, rgba(18, 24, 28, 0) 100%)';
      container.style.webkitMask = 'linear-gradient(to right, rgba(18, 24, 28, 0) 0%, rgba(18, 24, 28, 1) 20%, rgba(27, 36, 44, 1) 80%, rgba(18, 24, 28, 0) 100%)';
      
      // Сбрасываем позицию контейнера квадратов
      squares.style.transform = 'translateX(0px)';
      
      // Сбрасываем все квадраты к базовому размеру
      const squareElements = squares.children;
      for (let i = 0; i < squareElements.length; i++) {
        const square = squareElements[i] as HTMLElement;
        square.style.width = '108px';
        square.style.height = '108px';
        square.style.borderRadius = '20px';
        square.style.border = '1px solid #303E4A'; // Сброс обводки к стандартному состоянию
        square.style.zIndex = '1';
        square.style.position = 'static';
        square.style.transition = 'none';
        
        // Сбрасываем размер иконки подарка
        const giftIcon = square.querySelector('img') as HTMLImageElement;
        if (giftIcon) {
          giftIcon.style.width = '66px';
          giftIcon.style.height = '66px';
        }
      }
    });
  };

  // Регенерируем фоны квадратов когда изменяются вероятности подарков
  useEffect(() => {
    if (isOpen && giftProbabilities.length > 0) {
      console.log(`Regenerating backgrounds for ${caseName} with ${giftProbabilities.length} gift probabilities`);
      generateRandomBackgrounds();
    }
  }, [giftProbabilities, caseName, isOpen, additionalRectangles]);

  // Сбрасываем ползунок на x1 при закрытии модального окна
  useEffect(() => {
    if (!isOpen) {
      setSelectedMultiplier('x1');
      setSelectedCurrency('ton');
      setIsSpinning(false);
      setCanSkip(false);
      setHasSkipped(false);
      setHasWinningSquare(false);
      setWinningGiftPrice(0);
      setIsSelling(false);
      setIsAddingToInventory(false);
      setIsClosingWithPrizes(false);
      setWinningItems([]);
      setActiveInfoOverlay(null);
      setShowInsufficientFunds(false);
      skipAnimationRef.current = false;
      skipStartTimeRef.current = 0;
      // Сбрасываем все квадраты при закрытии модального окна, но не генерируем новые фоны
      resetSquareStyles();
    }
  }, [isOpen]);

  // Сбрасываем барабан при переключении демо режима
  useEffect(() => {
    if (isOpen && !isSpinning) {
      // Сбрасываем выигрышные состояния при изменении демо режима
      setHasWinningSquare(false);
      setWinningGiftPrice(0);
      setIsSelling(false);
      setIsAddingToInventory(false);
      skipAnimationRef.current = false;
      skipStartTimeRef.current = 0;
      // Сбрасываем только стили барабана без изменения содержимого (предотвращаем мерцание)
      resetSquareStyles();
    }
  }, [isDemoToggled, isOpen]);

  // Переменные для управления пропуском анимации
  const skipAnimationRef = useRef<boolean>(false);
  const skipStartTimeRef = useRef<number>(0);

  // Функция для пропуска анимации
  const skipAnimation = () => {
    if (!isSpinning || !canSkip || hasSkipped) return;
    
    setHasSkipped(true);
    skipAnimationRef.current = true;
    skipStartTimeRef.current = Date.now();
  };

  // Уведомление сервера о выигрыше в кейсе
  const notifyWinToServer = async (giftName: string, giftIcon: string, giftBackground: string) => {
    try {
      // Получаем initData из Telegram WebApp
      const initData = (window as any).Telegram?.WebApp?.initData;
      
      await fetch('/api/sync/notify-case-win', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          timestamp: Date.now(),
          initData,
          giftName,
          giftIcon,
          giftBackground
        }),
      });
    } catch (error) {
      console.error('Error notifying case win:', error);
    }
  };

  // Функция проверки баланса
  const checkBalance = () => {
    if (selectedCurrency === 'stars') {
      // Для Stars не проверяем баланс, создаем инвойс
      return true;
    }
    
    const currentBalance = parseFloat(balance || '0');
    const basePrice = casePrice;
    const multiplier = selectedMultiplier === 'x1' ? 1 : selectedMultiplier === 'x2' ? 2 : 3;
    const totalCost = basePrice * multiplier;
    
    return currentBalance >= totalCost;
  };

  // Функция показа уведомления о недостатке средств
  const showInsufficientFundsNotification = () => {
    // Добавляем тактильную обратную связь для ошибки
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('rigid');
    }
    
    setShowInsufficientFunds(true);
    setTimeout(() => {
      setShowInsufficientFunds(false);
    }, 3000); // Скрываем через 3 секунды
  };

  // Функция списания средств за кейс
  const spendOnCase = async () => {
    try {
      const basePrice = casePrice;
      const multiplier = selectedMultiplier === 'x1' ? 1 : selectedMultiplier === 'x2' ? 2 : 3;
      const totalCost = basePrice * multiplier;
      
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
          // Обновляем баланс в UI
          updateBalance();
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error spending on case:', error);
      return false;
    }
  };

  // Функция создания инвойса Stars для оплаты кейса
  const createStarsInvoiceForCase = async () => {
    try {
      const basePrice = casePrice;
      const multiplier = selectedMultiplier === 'x1' ? 1 : selectedMultiplier === 'x2' ? 2 : 3;
      const totalCostTon = basePrice * multiplier;
      
      // Рассчитываем стоимость в Stars
      const priceInUsd = totalCostTon * tonPrice;
      const priceInStars = priceInUsd / 0.013;
      const roundedStarsAmount = Math.round(priceInStars / 5) * 5;
      
      // Получаем initData из Telegram WebApp
      const initData = (window as any).Telegram?.WebApp?.initData;
      
      const response = await fetch('/api/buy-case-stars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData,
          amount: roundedStarsAmount,
          casePrice: totalCostTon,
          multiplier: multiplier
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.invoiceLink) {
          // Открываем инвойс
          if ((window as any).Telegram?.WebApp) {
            (window as any).Telegram.WebApp.openInvoice(data.invoiceLink, (status: string) => {
              if (status === 'paid') {
                console.log('Case purchase payment completed');
                // Запускаем анимацию после успешной оплаты
                startSpinAfterPayment();
              } else {
                console.log('Case purchase payment cancelled or failed');
              }
            });
          }
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error creating Stars invoice for case:', error);
      return false;
    }
  };

  // Функция запуска анимации после оплаты
  const startSpinAfterPayment = () => {
    // Добавляем тактильную обратную связь
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    // Сразу начинаем анимацию без дополнительных проверок
    setIsSpinning(true);
    setCanSkip(false);
    setHasSkipped(false);
    setHasWinningSquare(false);
    setWinningGiftPrice(0);
    setWinningItems([]);
    skipAnimationRef.current = false;
    skipStartTimeRef.current = 0;
    
    // Включаем возможность пропуска сразу
    setCanSkip(true);
    
    // Сбрасываем все квадраты и маску перед началом новой анимации
    resetAllSquares();
    
    // Дополнительно сбрасываем маску для всех контейнеров в начале спина
    scrollContainerRefs.current.forEach((container) => {
      if (!container) return;
      
      container.style.mask = 'linear-gradient(to right, rgba(18, 24, 28, 0) 0%, rgba(18, 24, 28, 1) 20%, rgba(27, 36, 44, 1) 80%, rgba(18, 24, 28, 0) 100%)';
      container.style.webkitMask = 'linear-gradient(to right, rgba(18, 24, 28, 0) 0%, rgba(18, 24, 28, 1) 20%, rgba(27, 36, 44, 1) 80%, rgba(18, 24, 28, 0) 100%)';
    });
    
    const totalRectangles = 1 + additionalRectangles;
    const normalAnimationDuration = 7000; // 7 секунд
    const skipAnimationDuration = 1500; // 1.5 секунды для быстрого завершения
    
    let animationsCompleted = 0;
    let winningSquares: HTMLElement[] = [];
    let totalWinningPrice = 0; // Общая сумма всех выигрышных подарков
    
    scrollContainerRefs.current.forEach((container, index) => {
      if (!container) return;
      
      const squares = container.children[0] as HTMLElement;
      if (!squares) return;
      
      // Увеличиваем расстояние для более быстрой анимации
      const startTime = Date.now();
      const totalDistance = 4000 + Math.random() * 2000; // увеличенное случайное расстояние
      
      const animate = () => {
        const currentTime = Date.now();
        let elapsed = currentTime - startTime;
        let animationDuration = normalAnimationDuration;
        let progress;
        
        // Обработка пропуска анимации
        if (skipAnimationRef.current) {
          // Если анимация была пропущена, ускоряем завершение
          const skipElapsed = currentTime - skipStartTimeRef.current;
          const progressAtSkip = Math.min((skipStartTimeRef.current - startTime) / normalAnimationDuration, 1);
          const remainingProgress = 1 - progressAtSkip;
          const skipProgress = Math.min(skipElapsed / skipAnimationDuration, 1);
          
          progress = progressAtSkip + (remainingProgress * skipProgress);
        } else {
          progress = Math.min(elapsed / animationDuration, 1);
        }
        
        // Более агрессивная функция замедления для очень быстрого старта
        // Используем степень 8 вместо 5 для более резкого торможения в конце
        const easeOut = 1 - Math.pow(1 - progress, 8);
        
        const currentDistance = totalDistance * easeOut;
        squares.style.transform = `translateX(-${currentDistance}px)`;
        
        // Определяем выигрышный квадрат ближе к концу анимации (при 90% завершения)
        if (progress >= 0.9 && winningSquares[index] === undefined) {
          const containerRect = container.getBoundingClientRect();
          const containerCenter = containerRect.left + containerRect.width / 2;
          
          let closestSquare: HTMLElement | null = null;
          let minDistance = Infinity;
          
          // Находим квадрат ближайший к центру
          const squareElements = squares.children;
          for (let i = 0; i < squareElements.length; i++) {
            const square = squareElements[i] as HTMLElement;
            const squareRect = square.getBoundingClientRect();
            const squareCenter = squareRect.left + squareRect.width / 2;
            const distance = Math.abs(squareCenter - containerCenter);
            
            if (distance < minDistance) {
              minDistance = distance;
              closestSquare = square;
            }
          }
          
          if (closestSquare) {
            winningSquares[index] = closestSquare;
            
            // Устанавливаем флаг выигрышного квадрата
            setHasWinningSquare(true);
            
            // Уведомляем сервер о выигрыше для всех барабанов
            if (caseType === 'borderless') {
              const squareBackground = closestSquare.style.backgroundImage;
              const giftIcon = closestSquare.querySelector('img')?.src || '';
              
              // Определяем название подарка по иконке с учетом текущего кейса
              let giftName = '';
              
              // Сначала проверяем специфичные для текущего кейса предметы
              if (caseName === 'VIP Box') {
                if (giftIcon.includes('Swiss%20Watch')) giftName = 'Swiss Watch';
                else if (giftIcon.includes('Vintage%20Cigar')) giftName = 'Vintage Cigar';
                else if (giftIcon.includes('Diamond%20Ring')) giftName = 'Diamond Ring';
                else if (giftIcon.includes('Cupid%20Charm')) giftName = 'Cupid Charm';
                else if (giftIcon.includes('Record%20Player')) giftName = 'Record Player';
                else if (giftIcon.includes('Bow%20Tie')) giftName = 'Bow Tie';
                else if (giftIcon.includes('Fresh%20Socks')) giftName = 'Fresh Socks';
              } else if (caseName === 'Lunch Box') {
                if (giftIcon.includes('Valentine%20Box')) giftName = 'Valentine Box';
                else if (giftIcon.includes('Berry%20Box')) giftName = 'Berry Box';
                else if (giftIcon.includes('Bunny%20Muffin')) giftName = 'Bunny Muffin';
                else if (giftIcon.includes('Easter%20Egg')) giftName = 'Easter Egg';
                else if (giftIcon.includes('Candy%20Cane')) giftName = 'Candy Cane';
                else if (giftIcon.includes('Whip%20Cupcake')) giftName = 'Whip Cupcake';
              } else {
                // Для всех остальных кейсов используем общую логику
                // Love Party кейс
                if (giftIcon.includes('Heart%20Locket')) giftName = 'Heart Locket';
                else if (giftIcon.includes('Neko%20Helmet')) giftName = 'Neko Helmet';
                else if (giftIcon.includes('Toy%20Bear')) giftName = 'Toy Bear';
                else if (giftIcon.includes('Ionic%20Dryer')) giftName = 'Ionic Dryer';
                else if (giftIcon.includes('Love%20Potion')) giftName = 'Love Potion';
                else if (giftIcon.includes('Valentine%20Box')) giftName = 'Valentine Box';
                else if (giftIcon.includes('Joyful%20Bundle')) giftName = 'Joyful Bundle';
                // Gold Rush кейс
                else if (giftIcon.includes('Nail%20Bracelet')) giftName = 'Nail Bracelet';
                else if (giftIcon.includes('Bonded%20Ring')) giftName = 'Bonded Ring';
                else if (giftIcon.includes('Genie%20Lamp')) giftName = 'Genie Lamp';
                else if (giftIcon.includes('Swiss%20Watch')) giftName = 'Swiss Watch';
                else if (giftIcon.includes('Signet%20Ring')) giftName = 'Signet Ring';
                else if (giftIcon.includes('Cupid%20Charm')) giftName = 'Cupid Charm';
                else if (giftIcon.includes('Sleigh%20Bell')) giftName = 'Sleigh Bell';
                // Gangsta кейс
                else if (giftIcon.includes('Westside%20Sign')) giftName = 'Westside Sign';
                else if (giftIcon.includes('Low%20Rider')) giftName = 'Low Rider';
                else if (giftIcon.includes('Vintage%20Cigar')) giftName = 'Vintage Cigar';
                else if (giftIcon.includes('Record%20Player')) giftName = 'Record Player';
                else if (giftIcon.includes('Snoop%20Cigar')) giftName = 'Snoop Cigar';
                else if (giftIcon.includes('Swag%20Bag')) giftName = 'Swag Bag';
                else if (giftIcon.includes('Snoop%20Dogg')) giftName = 'Snoop Dogg';
                // Rich Holder кейс
                else if (giftIcon.includes('Plush%20Pepe')) giftName = 'Plush Pepe';
                else if (giftIcon.includes('Precious%20Peach')) giftName = 'Precious Peach';
                else if (giftIcon.includes('Mighty%20Arm')) giftName = 'Mighty Arm';
                else if (giftIcon.includes('Loot%20Bag')) giftName = 'Loot Bag';
                else if (giftIcon.includes('Ion%20Gem')) giftName = 'Ion Gem';
                // Rich Mood кейс
                else if (giftIcon.includes('Durov%27s%20Cap') || giftIcon.includes('Durov\'s%20Cap')) giftName = 'Durov\'s Cap';
              }
              
              // Извлекаем URL фона из backgroundImage
              const match = squareBackground.match(/url\("(.+?)"\)/);
              const giftBackground = match ? match[1] : '';
              
              console.log('Processing winning item:', { giftName, giftIcon, giftBackground, index, caseName });
              
              // Добавляем цену текущего подарка к общей сумме
              const giftPriceData = giftProbabilities.find(gift => gift.name === giftName);
              console.log('Gift price lookup:', { giftName, giftPriceData, availableGifts: giftProbabilities.map(g => g.name) });
              
              if (giftPriceData) {
                totalWinningPrice += giftPriceData.price;
                setWinningGiftPrice(totalWinningPrice);
                
                // Добавляем предмет в массив выигрышных предметов
                const newItem = {
                  giftName: giftName,
                  giftIcon: giftIcon,
                  giftBackground: giftBackground,
                  giftPrice: giftPriceData.price
                };
                console.log('Adding item to winningItems:', newItem);
                setWinningItems(prev => {
                  const updated = [...prev, newItem];
                  console.log('Updated winningItems:', updated);
                  return updated;
                });
              } else {
                console.warn('No price data found for gift:', giftName, 'in case:', caseName);
              }
              
              // Уведомляем сервер о выигрыше для каждого барабана
              notifyWinToServer(giftName, giftIcon, giftBackground);
            }
            
            // Начинаем анимацию центрирования и увеличения во время основной анимации
            const centeringAndSizeProgress = (progress - 0.9) / 0.1; // От 0 до 1 за последние 10% времени
            centerAndAnimateWinningSquareDuringAnimation(closestSquare, centeringAndSizeProgress, container, squares);
          }
        }
        
        // Продолжаем анимацию центрирования и увеличения если квадрат уже найден
        if (progress >= 0.9 && winningSquares[index]) {
          const centeringAndSizeProgress = (progress - 0.9) / 0.1;
          centerAndAnimateWinningSquareDuringAnimation(winningSquares[index], centeringAndSizeProgress, container, squares);
        }
        
        // Анимируем маску во время спина (начиная с 80% прогресса)
        if (progress >= 0.8) {
          const maskProgress = (progress - 0.8) / 0.2; // От 0 до 1 за последние 20% времени
          animateMaskDuringAnimation(container, maskProgress);
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          animationsCompleted++;
          if (animationsCompleted === totalRectangles) {
            // Анимации завершены
            setIsSpinning(false);
            setCanSkip(false);
            
            // Финально устанавливаем общую цену всех выигрышных предметов
            if (totalWinningPrice > 0) {
              setWinningGiftPrice(totalWinningPrice);
            }
          }
        }
      };
      
      requestAnimationFrame(animate);
    });
  };

  // Функция анимации барабана
  const spinAnimation = async () => {
    if (isSpinning) return;
    
    // Проверяем баланс только если не в демо режиме
    if (!isDemoToggled && !checkBalance()) {
      showInsufficientFundsNotification();
      return;
    }
    
    // Добавляем тактильную обратную связь
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    // Обработка оплаты в зависимости от валюты
    if (!isDemoToggled) {
      if (selectedCurrency === 'stars') {
        // Для Stars создаем инвойс и ждем оплаты
        const invoiceCreated = await createStarsInvoiceForCase();
        if (!invoiceCreated) {
          console.error('Failed to create Stars invoice');
          return;
        }
        // Анимация запустится после успешной оплаты через startSpinAfterPayment
        return;
      } else {
        // Для TON списываем с баланса как обычно
        const basePrice = casePrice;
        const multiplier = selectedMultiplier === 'x1' ? 1 : selectedMultiplier === 'x2' ? 2 : 3;
        const totalCost = basePrice * multiplier;
        const currentBalance = parseFloat(balance || '0');
        const newBalance = (currentBalance - totalCost).toFixed(2);
        
        // Моментально обновляем баланс в UI
        updateBalance();
        
        // В фоновом режиме отправляем запрос на сервер для подтверждения
        spendOnCase().catch((error) => {
          console.error('Failed to confirm spending on server:', error);
          // В случае ошибки можно показать уведомление, но не останавливаем анимацию
        });
      }
    }
    
    setIsSpinning(true);
    setCanSkip(false);
    setHasSkipped(false);
    setHasWinningSquare(false); // Сбрасываем флаг выигрышного квадрата при новом прокруте
    setWinningGiftPrice(0); // Сбрасываем цену выигрышного подарка при новом прокруте
    setWinningItems([]); // Сбрасываем выигрышные предметы при новом прокруте
    skipAnimationRef.current = false;
    skipStartTimeRef.current = 0;
    
    // Включаем возможность пропуска сразу
    setCanSkip(true);
    
    // Сбрасываем все квадраты и маску перед началом новой анимации
    resetAllSquares();
    
    // Дополнительно сбрасываем маску для всех контейнеров в начале спина
    scrollContainerRefs.current.forEach((container) => {
      if (!container) return;
      
      container.style.mask = 'linear-gradient(to right, rgba(18, 24, 28, 0) 0%, rgba(18, 24, 28, 1) 20%, rgba(27, 36, 44, 1) 80%, rgba(18, 24, 28, 0) 100%)';
      container.style.webkitMask = 'linear-gradient(to right, rgba(18, 24, 28, 0) 0%, rgba(18, 24, 28, 1) 20%, rgba(27, 36, 44, 1) 80%, rgba(18, 24, 28, 0) 100%)';
    });
    
    const totalRectangles = 1 + additionalRectangles;
    const normalAnimationDuration = 7000; // 7 секунд
    const skipAnimationDuration = 1500; // 1.5 секунды для быстрого завершения
    
    let animationsCompleted = 0;
    let winningSquares: HTMLElement[] = [];
    let totalWinningPrice = 0; // Общая сумма всех выигрышных подарков
    
    scrollContainerRefs.current.forEach((container, index) => {
      if (!container) return;
      
      const squares = container.children[0] as HTMLElement;
      if (!squares) return;
      
      // Увеличиваем расстояние для более быстрой анимации
      const startTime = Date.now();
      const totalDistance = 4000 + Math.random() * 2000; // увеличенное случайное расстояние
      
      const animate = () => {
        const currentTime = Date.now();
        let elapsed = currentTime - startTime;
        let animationDuration = normalAnimationDuration;
        let progress;
        
        // Обработка пропуска анимации
        if (skipAnimationRef.current) {
          // Если анимация была пропущена, ускоряем завершение
          const skipElapsed = currentTime - skipStartTimeRef.current;
          const progressAtSkip = Math.min((skipStartTimeRef.current - startTime) / normalAnimationDuration, 1);
          const remainingProgress = 1 - progressAtSkip;
          const skipProgress = Math.min(skipElapsed / skipAnimationDuration, 1);
          
          progress = progressAtSkip + (remainingProgress * skipProgress);
        } else {
          progress = Math.min(elapsed / animationDuration, 1);
        }
        
        // Более агрессивная функция замедления для очень быстрого старта
        // Используем степень 8 вместо 5 для более резкого торможения в конце
        const easeOut = 1 - Math.pow(1 - progress, 8);
        
        const currentDistance = totalDistance * easeOut;
        squares.style.transform = `translateX(-${currentDistance}px)`;
        
        // Определяем выигрышный квадрат ближе к концу анимации (при 90% завершения)
        if (progress >= 0.9 && winningSquares[index] === undefined) {
          const containerRect = container.getBoundingClientRect();
          const containerCenter = containerRect.left + containerRect.width / 2;
          
          let closestSquare: HTMLElement | null = null;
          let minDistance = Infinity;
          
          // Находим квадрат ближайший к центру
          const squareElements = squares.children;
          for (let i = 0; i < squareElements.length; i++) {
            const square = squareElements[i] as HTMLElement;
            const squareRect = square.getBoundingClientRect();
            const squareCenter = squareRect.left + squareRect.width / 2;
            const distance = Math.abs(squareCenter - containerCenter);
            
            if (distance < minDistance) {
              minDistance = distance;
              closestSquare = square;
            }
          }
          
          if (closestSquare) {
            winningSquares[index] = closestSquare;
            
            // Устанавливаем флаг выигрышного квадрата
            setHasWinningSquare(true);
            
            // Уведомляем сервер о выигрыше для всех барабанов
            if (caseType === 'borderless') {
              const squareBackground = closestSquare.style.backgroundImage;
              const giftIcon = closestSquare.querySelector('img')?.src || '';
              
              // Определяем название подарка по иконке с учетом текущего кейса
              let giftName = '';
              
              // Сначала проверяем специфичные для текущего кейса предметы
              if (caseName === 'VIP Box') {
                if (giftIcon.includes('Swiss%20Watch')) giftName = 'Swiss Watch';
                else if (giftIcon.includes('Vintage%20Cigar')) giftName = 'Vintage Cigar';
                else if (giftIcon.includes('Diamond%20Ring')) giftName = 'Diamond Ring';
                else if (giftIcon.includes('Cupid%20Charm')) giftName = 'Cupid Charm';
                else if (giftIcon.includes('Record%20Player')) giftName = 'Record Player';
                else if (giftIcon.includes('Bow%20Tie')) giftName = 'Bow Tie';
                else if (giftIcon.includes('Fresh%20Socks')) giftName = 'Fresh Socks';
              } else if (caseName === 'Lunch Box') {
                if (giftIcon.includes('Valentine%20Box')) giftName = 'Valentine Box';
                else if (giftIcon.includes('Berry%20Box')) giftName = 'Berry Box';
                else if (giftIcon.includes('Bunny%20Muffin')) giftName = 'Bunny Muffin';
                else if (giftIcon.includes('Easter%20Egg')) giftName = 'Easter Egg';
                else if (giftIcon.includes('Candy%20Cane')) giftName = 'Candy Cane';
                else if (giftIcon.includes('Whip%20Cupcake')) giftName = 'Whip Cupcake';
              } else {
                // Для всех остальных кейсов используем общую логику
                // Love Party кейс
                if (giftIcon.includes('Heart%20Locket')) giftName = 'Heart Locket';
                else if (giftIcon.includes('Neko%20Helmet')) giftName = 'Neko Helmet';
                else if (giftIcon.includes('Toy%20Bear')) giftName = 'Toy Bear';
                else if (giftIcon.includes('Ionic%20Dryer')) giftName = 'Ionic Dryer';
                else if (giftIcon.includes('Love%20Potion')) giftName = 'Love Potion';
                else if (giftIcon.includes('Valentine%20Box')) giftName = 'Valentine Box';
                else if (giftIcon.includes('Joyful%20Bundle')) giftName = 'Joyful Bundle';
                // Gold Rush кейс
                else if (giftIcon.includes('Nail%20Bracelet')) giftName = 'Nail Bracelet';
                else if (giftIcon.includes('Bonded%20Ring')) giftName = 'Bonded Ring';
                else if (giftIcon.includes('Genie%20Lamp')) giftName = 'Genie Lamp';
                else if (giftIcon.includes('Swiss%20Watch')) giftName = 'Swiss Watch';
                else if (giftIcon.includes('Signet%20Ring')) giftName = 'Signet Ring';
                else if (giftIcon.includes('Cupid%20Charm')) giftName = 'Cupid Charm';
                else if (giftIcon.includes('Sleigh%20Bell')) giftName = 'Sleigh Bell';
                // Gangsta кейс
                else if (giftIcon.includes('Westside%20Sign')) giftName = 'Westside Sign';
                else if (giftIcon.includes('Low%20Rider')) giftName = 'Low Rider';
                else if (giftIcon.includes('Vintage%20Cigar')) giftName = 'Vintage Cigar';
                else if (giftIcon.includes('Record%20Player')) giftName = 'Record Player';
                else if (giftIcon.includes('Snoop%20Cigar')) giftName = 'Snoop Cigar';
                else if (giftIcon.includes('Swag%20Bag')) giftName = 'Swag Bag';
                else if (giftIcon.includes('Snoop%20Dogg')) giftName = 'Snoop Dogg';
                // Rich Holder кейс
                else if (giftIcon.includes('Plush%20Pepe')) giftName = 'Plush Pepe';
                else if (giftIcon.includes('Precious%20Peach')) giftName = 'Precious Peach';
                else if (giftIcon.includes('Mighty%20Arm')) giftName = 'Mighty Arm';
                else if (giftIcon.includes('Loot%20Bag')) giftName = 'Loot Bag';
                else if (giftIcon.includes('Ion%20Gem')) giftName = 'Ion Gem';
                // Rich Mood кейс
                else if (giftIcon.includes('Durov%27s%20Cap') || giftIcon.includes('Durov\'s%20Cap')) giftName = 'Durov\'s Cap';
              }
              
              // Извлекаем URL фона из backgroundImage
              const match = squareBackground.match(/url\("(.+?)"\)/);
              const giftBackground = match ? match[1] : '';
              
              console.log('Processing winning item:', { giftName, giftIcon, giftBackground, index, caseName });
              
              // Добавляем цену текущего подарка к общей сумме
              const giftPriceData = giftProbabilities.find(gift => gift.name === giftName);
              console.log('Gift price lookup:', { giftName, giftPriceData, availableGifts: giftProbabilities.map(g => g.name) });
              
              if (giftPriceData) {
                totalWinningPrice += giftPriceData.price;
                setWinningGiftPrice(totalWinningPrice);
                
                // Добавляем предмет в массив выигрышных предметов
                const newItem = {
                  giftName: giftName,
                  giftIcon: giftIcon,
                  giftBackground: giftBackground,
                  giftPrice: giftPriceData.price
                };
                console.log('Adding item to winningItems:', newItem);
                setWinningItems(prev => {
                  const updated = [...prev, newItem];
                  console.log('Updated winningItems:', updated);
                  return updated;
                });
              } else {
                console.warn('No price data found for gift:', giftName, 'in case:', caseName);
              }
              
              // Уведомляем сервер о выигрыше для каждого барабана
              notifyWinToServer(giftName, giftIcon, giftBackground);
            }
            
            // Начинаем анимацию центрирования и увеличения во время основной анимации
            const centeringAndSizeProgress = (progress - 0.9) / 0.1; // От 0 до 1 за последние 10% времени
            centerAndAnimateWinningSquareDuringAnimation(closestSquare, centeringAndSizeProgress, container, squares);
          }
        }
        
        // Продолжаем анимацию центрирования и увеличения если квадрат уже найден
        if (progress >= 0.9 && winningSquares[index]) {
          const centeringAndSizeProgress = (progress - 0.9) / 0.1;
          centerAndAnimateWinningSquareDuringAnimation(winningSquares[index], centeringAndSizeProgress, container, squares);
        }
        
        // Анимируем маску во время спина (начиная с 80% прогресса)
        if (progress >= 0.8) {
          const maskProgress = (progress - 0.8) / 0.2; // От 0 до 1 за последние 20% времени
          animateMaskDuringAnimation(container, maskProgress);
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          animationsCompleted++;
          if (animationsCompleted === totalRectangles) {
            // Анимации завершены
            setIsSpinning(false);
            setCanSkip(false);
            
            // Финально устанавливаем общую цену всех выигрышных предметов
            if (totalWinningPrice > 0) {
              setWinningGiftPrice(totalWinningPrice);
            }
          }
        }
      };
      
      requestAnimationFrame(animate);
    });
  };

  // Функция центрирования и анимации выигрышного квадрата во время основной анимации
  const centerAndAnimateWinningSquareDuringAnimation = (
    winningSquare: HTMLElement, 
    progress: number, 
    container: HTMLDivElement, 
    squares: HTMLElement
  ) => {
    // Получаем позиции элементов в глобальных координатах
    const containerRect = container.getBoundingClientRect();
    const squareRect = winningSquare.getBoundingClientRect();
    
    // Центр контейнера в глобальных координатах
    const containerCenterX = containerRect.left + containerRect.width / 2;
    
    // Центр квадрата в глобальных координатах
    const squareCenterX = squareRect.left + squareRect.width / 2;
    
    // Точное смещение для идеального центрирования
    const offsetNeeded = containerCenterX - squareCenterX;
    
    // Применяем центрирование с плавной анимацией
    const easeOut = 1 - Math.pow(1 - progress, 4);
    const currentTransform = squares.style.transform;
    const currentOffset = currentTransform.match(/-?(\d+(?:\.\d+)?)/);
    const basePosition = currentOffset ? parseFloat(currentOffset[1]) : 0;
    
    const newPosition = basePosition - (offsetNeeded * easeOut);
    squares.style.transform = `translateX(-${newPosition}px)`;
    
    // Применяем анимацию увеличения размера
    const sizeEaseOut = 1 - Math.pow(1 - progress, 3);
    const currentSize = 108 + (125 - 108) * sizeEaseOut;
    const currentBorderRadius = 20 + (23 - 20) * sizeEaseOut;
    
    // Определяем цвет обводки на основе фона квадрата
    const backgroundImage = winningSquare.style.backgroundImage;
    let borderColor = '#303E4A'; // дефолтный цвет
    
    if (backgroundImage.includes('arcane.svg')) {
      borderColor = '#00D948';
    } else if (backgroundImage.includes('immortal.svg')) {
      borderColor = '#FFA504';
    } else if (backgroundImage.includes('legendary.svg')) {
      borderColor = '#E719FF';
    } else if (backgroundImage.includes('rare.svg')) {
      borderColor = '#4D25FF';
    } else if (backgroundImage.includes('common.svg')) {
      borderColor = '#21A3FF';
    }
    
    // Устанавливаем постоянную толщину обводки в 1px
    const borderWidth = 1;
    
    winningSquare.style.width = `${currentSize}px`;
    winningSquare.style.height = `${currentSize}px`;
    winningSquare.style.borderRadius = `${currentBorderRadius}px`;
    winningSquare.style.backgroundSize = `${currentSize}px ${currentSize}px`;
    winningSquare.style.border = `${borderWidth}px solid ${borderColor}`;
    winningSquare.style.zIndex = '10';
    winningSquare.style.position = 'relative';
    winningSquare.style.transition = 'none';
    
    // Обновляем размер иконки подарка пропорционально
    const giftIcon = winningSquare.querySelector('img') as HTMLImageElement;
    if (giftIcon) {
      const giftIconSize = 66 + (76 - 66) * sizeEaseOut; // Пропорциональное увеличение иконки
      giftIcon.style.width = `${giftIconSize}px`;
      giftIcon.style.height = `${giftIconSize}px`;
    }
  };

  // Функция центрирования и анимации выигрышных квадратов (не используется, но оставлена для обратной совместимости)
  const centerAndAnimateWinningSquares = (winningSquares: HTMLElement[]) => {
    // Function kept for compatibility but not used
    void winningSquares;
    /*
    scrollContainerRefs.current.forEach((container, containerIndex) => {
      if (!container || !winningSquares[containerIndex]) return;
      
      const squares = container.children[0] as HTMLElement;
      if (!squares) return;
      
      const winningSquare = winningSquares[containerIndex];
      
      // Получаем текущую позицию выигрышного квадрата относительно контейнера
      const containerRect = container.getBoundingClientRect();
      const squareRect = winningSquare.getBoundingClientRect();
      
      // Динамически рассчитываем центр контейнера
      const containerCenterX = containerRect.width / 2;
      
      // Вычисляем текущую позицию квадрата относительно левого края контейнера
      const squareRelativeX = squareRect.left - containerRect.left;
      
      // Рассчитываем центрирование с учетом финального размера квадрата (125x125)
      const currentSquareSize = 108; // текущий размер квадрата
      
      // Центр квадрата с учетом будущего увеличения
      const squareFinalCenterX = squareRelativeX + (currentSquareSize / 2);
      
      // Рассчитываем необходимое смещение для центрирования финального квадрата
      const offsetNeeded = containerCenterX - squareFinalCenterX;
      
      // Анимация центрирования
      if (Math.abs(offsetNeeded) > 1) { // Если квадрат не идеально по центру
        const centeringDuration = 500; // 0.5 секунды для плавной анимации
        const startTime = Date.now();
        const currentTransform = squares.style.transform;
        const currentOffset = currentTransform.match(/-?(\d+(?:\.\d+)?)/);
        const startPosition = currentOffset ? parseFloat(currentOffset[1]) : 0;
        
        const centeringAnimation = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / centeringDuration, 1);
          
          // Плавная анимация с замедлением
          const easeOut = 1 - Math.pow(1 - progress, 4);
          const newPosition = startPosition - (offsetNeeded * easeOut);
          
          squares.style.transform = `translateX(-${newPosition}px)`;
          
          if (progress < 1) {
            requestAnimationFrame(centeringAnimation);
          } else {
            // После центрирования начинаем анимацию увеличения
            animateWinningSquareSize(winningSquare);
          }
        };
        
        requestAnimationFrame(centeringAnimation);
      } else {
        // Если уже по центру, сразу анимируем увеличение
        animateWinningSquareSize(winningSquare);
      }
    });
    */
  };

  // Функция анимации увеличения выигрышного квадрата (не используется, но оставлена для обратной совместимости)
  const animateWinningSquareSize = (winningSquare: HTMLElement) => {
    const animationDuration = 500; // 0.5 секунды
    const startTime = Date.now();
    
    const animateSize = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Плавная анимация увеличения
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentSize = 108 + (125 - 108) * easeOut;
      const currentBorderRadius = 20 + (23 - 20) * easeOut; // Пропорциональное увеличение скругления
      
      winningSquare.style.width = `${currentSize}px`;
      winningSquare.style.height = `${currentSize}px`;
      winningSquare.style.borderRadius = `${currentBorderRadius}px`;
      winningSquare.style.zIndex = '10';
      winningSquare.style.position = 'relative';
      winningSquare.style.transition = 'none';
      
      if (progress < 1) {
        requestAnimationFrame(animateSize);
      }
    };
    
    // Небольшая задержка перед анимацией увеличения
    setTimeout(() => {
      requestAnimationFrame(animateSize);
    }, 100);
  };

  // Функция анимации маски во время вращения
  const animateMaskDuringAnimation = (container: HTMLDivElement, progress: number) => {
    // Плавная анимация с замедлением в конце
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    // Интерполируем между начальной и финальной маской
    // Начальная маска: стандартная маска с краев
    // Финальная маска: сложный градиент с фокусом на центре
    
    // Начальные позиции (стандартная маска)
    const startStops = {
      stop1: 0,    // прозрачность 0
      stop2: 20,   // прозрачность 1
      stop3: 80,   // прозрачность 1
      stop4: 100   // прозрачность 0
    };
    
    // Финальные позиции (сложная маска)
    const endStops = {
      stop1: 31,   // прозрачность 0.5
      stop2: 34,   // прозрачность 1
      stop3: 67,   // прозрачность 1
      stop4: 69    // прозрачность 0.5
    };
    
    // Интерполяция позиций
    const currentStops = {
      stop1: startStops.stop1 + (endStops.stop1 - startStops.stop1) * easeOut,
      stop2: startStops.stop2 + (endStops.stop2 - startStops.stop2) * easeOut,
      stop3: startStops.stop3 + (endStops.stop3 - startStops.stop3) * easeOut,
      stop4: startStops.stop4 + (endStops.stop4 - startStops.stop4) * easeOut
    };
    
    // Интерполяция непрозрачности
    const opacity1 = 0.5 * easeOut; // от 0 к 0.5
    const opacity2 = 0.5 * easeOut; // от 0 к 0.5
    
    // Создаем анимированную маску
    const animatedMask = `linear-gradient(to right, 
      rgba(18, 24, 28, 0) 0%, 
      rgba(18, 24, 28, ${opacity1}) ${currentStops.stop1}%, 
      rgba(18, 24, 28, 1) ${currentStops.stop2}%, 
      rgba(27, 36, 44, 1) ${currentStops.stop3}%, 
      rgba(27, 36, 44, ${opacity2}) ${currentStops.stop4}%, 
      rgba(27, 36, 44, 0) 100%)`;
    
    container.style.mask = animatedMask;
    container.style.webkitMask = animatedMask;
  };

  // Функция анимации маски с плывущим эффектом (оставлена для обратной совместимости)
  const animateWinnerMask = () => {
    const animationDuration = 1500; // 1.5 секунды для плавной анимации
    const startTime = Date.now();
    
    scrollContainerRefs.current.forEach((container) => {
      if (!container) return;
      
      const animateMask = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        // Плавная анимация с замедлением в конце
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        // Интерполируем между начальной и финальной маской
        // Начальная маска: полностью прозрачная с краев
        // Финальная маска: сложный градиент с фокусом на центре
        
        // Начальные позиции (маска с краев)
        const startStops = {
          stop1: 0,    // прозрачность 0
          stop2: 45,   // прозрачность 1
          stop3: 55,   // прозрачность 1
          stop4: 100   // прозрачность 0
        };
        
        // Финальные позиции (сложная маска)
        const endStops = {
          stop1: 31,   // прозрачность 0.5
          stop2: 34,   // прозрачность 1
          stop3: 67,   // прозрачность 1
          stop4: 69    // прозрачность 0.5
        };
        
        // Интерполяция позиций
        const currentStops = {
          stop1: startStops.stop1 + (endStops.stop1 - startStops.stop1) * easeOut,
          stop2: startStops.stop2 + (endStops.stop2 - startStops.stop2) * easeOut,
          stop3: startStops.stop3 + (endStops.stop3 - startStops.stop3) * easeOut,
          stop4: startStops.stop4 + (endStops.stop4 - startStops.stop4) * easeOut
        };
        
        // Интерполяция непрозрачности
        const opacity1 = 0.5 * easeOut; // от 0 к 0.5
        const opacity2 = 0.5 * easeOut; // от 0 к 0.5
        
        // Создаем анимированную маску
        const animatedMask = `linear-gradient(to right, 
          rgba(18, 24, 28, 0) 0%, 
          rgba(18, 24, 28, ${opacity1}) ${currentStops.stop1}%, 
          rgba(18, 24, 28, 1) ${currentStops.stop2}%, 
          rgba(27, 36, 44, 1) ${currentStops.stop3}%, 
          rgba(27, 36, 44, ${opacity2}) ${currentStops.stop4}%, 
          rgba(27, 36, 44, 0) 100%)`;
        
        container.style.mask = animatedMask;
        container.style.webkitMask = animatedMask;
        
        if (progress < 1) {
          requestAnimationFrame(animateMask);
        }
      };
      
      requestAnimationFrame(animateMask);
    });
  };

  // Функция применения маски после завершения анимации выигрыша (оставлена для совместимости)
  const applyWinnerMask = () => {
    // Запускаем анимированную маску вместо мгновенного применения
    animateWinnerMask();
  };

  // Функция продажи предмета
  const sellItem = async () => {
    if (!hasWinningSquare || winningGiftPrice <= 0 || isSelling || isAddingToInventory) return;

    try {
      // Получаем initData из Telegram WebApp
      const initData = (window as any).Telegram?.WebApp?.initData;
      
      // Отправляем запрос на сервер для начисления баланса
      const response = await fetch('/api/user/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData,
          amount: winningGiftPrice,
          transactionHash: `case_sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.newBalance) {
          // Обновляем баланс в UI
          updateBalance(data.newBalance);
        }
      }
      
      // Сбрасываем состояния к исходным значениям (кроме множителя)
      setIsSpinning(false);
      setCanSkip(false);
      setHasSkipped(false);
      setHasWinningSquare(false);
      setWinningGiftPrice(0);
      setIsSelling(false);
      skipAnimationRef.current = false;
      skipStartTimeRef.current = 0;
      
      // Сбрасываем все квадраты
      resetAllSquares();
      
    } catch (error) {
      console.error('Error selling item:', error);
      // В случае ошибки все равно сбрасываем состояния (кроме множителя)
      setIsSpinning(false);
      setCanSkip(false);
      setHasSkipped(false);
      setHasWinningSquare(false);
      setWinningGiftPrice(0);
      setIsSelling(false);
      setIsAddingToInventory(false);
      skipAnimationRef.current = false;
      skipStartTimeRef.current = 0;
      resetAllSquares();
    }
  };

  // Функция добавления предметов в инвентарь
  const addToInventory = async () => {
    console.log('addToInventory called', { hasWinningSquare, winningItemsLength: winningItems.length, winningItems });
    
    if (!hasWinningSquare || winningItems.length === 0 || isAddingToInventory || isSelling) {
      console.log('Aborting: no winning square, no items, or action already in progress');
      return;
    }
    
    try {
      // Получаем initData из Telegram WebApp
      const initData = (window as any).Telegram?.WebApp?.initData;
      
      if (!initData) {
        console.error('No initData available');
        setIsAddingToInventory(false);
        return;
      }
      
      console.log('Sending items to inventory:', winningItems);
      
      // Отправляем запрос на сервер для добавления предметов в инвентарь
      const response = await fetch('/api/user/inventory/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData,
          items: winningItems,
          casePrice: casePrice
        }),
      });

      console.log('Inventory API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Inventory API response data:', data);
        if (data.success) {
          // Успешно добавили в инвентарь, сбрасываем состояния как при продаже
          console.log('Successfully added to inventory, resetting state');
          
          // Сбрасываем состояния к исходным значениям (кроме множителя)
          setIsSpinning(false);
          setCanSkip(false);
          setHasSkipped(false);
          setHasWinningSquare(false);
          setWinningGiftPrice(0);
          setIsSelling(false);
          setIsAddingToInventory(false);
          setWinningItems([]);
          skipAnimationRef.current = false;
          skipStartTimeRef.current = 0;
          
          // Сбрасываем все квадраты
          resetAllSquares();
        } else {
          console.error('API returned success: false', data);
          setIsAddingToInventory(false);
        }
      } else {
        const errorData = await response.text();
        console.error('API error:', response.status, errorData);
        setIsAddingToInventory(false);
      }
      
    } catch (error) {
      console.error('Error adding items to inventory:', error);
      // В случае ошибки только сбрасываем флаг добавления в инвентарь
      setIsAddingToInventory(false);
    }
  };

  // Функция закрытия модального окна с автоматическим сохранением призов
  const handleCloseModal = async () => {
    // Блокируем закрытие во время прокрута или других операций
    if (isSpinning || isClosingWithPrizes || isSelling || isAddingToInventory) return;
    
    // Если есть выигрышные предметы, добавляем их в инвентарь перед закрытием
    if (hasWinningSquare && winningItems.length > 0 && !isDemoToggled && !isAddingToInventory) {
      setIsClosingWithPrizes(true);
      
      try {
        // Получаем initData из Telegram WebApp
        const initData = (window as any).Telegram?.WebApp?.initData;
        
        if (initData) {
          // Отправляем запрос на сервер для добавления предметов в инвентарь
          const response = await fetch('/api/user/inventory/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              initData,
              items: winningItems
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              console.log('Items automatically added to inventory on modal close');
            }
          }
        }
      } catch (error) {
        console.error('Error auto-adding items to inventory:', error);
      } finally {
        setIsClosingWithPrizes(false);
      }
    }
    
    onClose();
  };

  // Suppress eslint warnings for functions kept for compatibility
  void centerAndAnimateWinningSquares;
  void animateWinningSquareSize;
  void applyWinnerMask;

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto z-[60]" 
        onClick={(isSpinning || isSelling || isAddingToInventory || isClosingWithPrizes) ? undefined : handleCloseModal}
      >
      <div 
        className="flex justify-center pt-10 pb-10"
      >
        <div 
          className="bg-white mx-4 w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '388px',
            minHeight: `${modalHeight}px`,
            borderRadius: '20px',
            backgroundColor: '#181F25',
            border: '1px solid #303E4A',
            padding: '20px'
          }}
        >
        {/* Header */}
        <div className="relative flex items-center justify-center" style={{ marginBottom: '20px' }}>
          <h2 className="font-gilroy-semibold text-white" style={{ fontSize: '20px' }}>
            {hasWinningSquare ? 'Поздравляем!' : caseName}
          </h2>
          <button 
            onClick={handleCloseModal}
            disabled={isSpinning || isClosingWithPrizes || isSelling || isAddingToInventory}
            className={`absolute transition-colors ${
              (isSpinning || isClosingWithPrizes || isSelling || isAddingToInventory)
                ? 'text-gray-600 opacity-50 cursor-not-allowed' 
                : 'text-gray-400 hover:text-white cursor-pointer'
            }`}
            style={{
              top: '50%',
              right: '6px',
              transform: 'translateY(-50%)'
            }}
          >
            <div 
              className="flex items-center justify-center rounded-full"
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </button>
        </div>

        {/* Rectangle under header */}
        {/* Main rectangle with arrows */}
        <div 
          className="relative"
          style={{
            width: 'calc(100% + 40px)',
            height: 'calc(732px * 0.184)',
            backgroundColor: '#12181C',
            borderRadius: '0px',
            marginLeft: '-20px',
            marginRight: '-20px'
          }}
        >
          {/* Up arrow icon */}
          <img 
            src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/up.svg"
            alt="Up"
            className="absolute top-0 left-0"
            style={{
              width: '100%',
              height: 'calc(732px * 0.184 * 0.0575)', // 7.76/135 ≈ 0.0575
              objectFit: 'cover',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              zIndex: 20
            }}
          />
          
          {/* Down arrow icon */}
          <img 
            src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/down.svg"
            alt="Down"
            className="absolute bottom-0 left-0"
            style={{
              width: '100%',
              height: 'calc(732px * 0.184 * 0.0575)', // 7.76/135 ≈ 0.0575
              objectFit: 'cover',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              zIndex: 20
            }}
          />

          {/* Squares container */}
          <div 
            ref={(el) => { scrollContainerRefs.current[0] = el; return undefined; }}
            className="absolute flex items-center justify-center overflow-hidden"
            style={{
              top: '0',
              bottom: '0',
              left: '0',
              right: '0',
              paddingLeft: '9px',
              paddingRight: '9px',
              mask: 'linear-gradient(to right, rgba(18, 24, 28, 0) 0%, rgba(18, 24, 28, 1) 20%, rgba(27, 36, 44, 1) 80%, rgba(18, 24, 28, 0) 100%)',
              WebkitMask: 'linear-gradient(to right, rgba(18, 24, 28, 0) 0%, rgba(18, 24, 28, 1) 20%, rgba(27, 36, 44, 1) 80%, rgba(18, 24, 28, 0) 100%)'
            }}
          >
            <div className="flex items-center" style={{ gap: '9px' }}>
              {Array.from({ length: 125 }).map((_, squareIndex) => (
                <div
                  key={squareIndex}
                  className="flex-shrink-0 relative flex items-center justify-center"
                  style={{
                    width: '108px',
                    height: '108px',
                    background: 'linear-gradient(45deg, #161D24 0%, #1B232B 100%)',
                    borderRadius: '20px',
                    border: '1px solid #303E4A',
                    backgroundImage: caseType === 'borderless' && squareBackgrounds[0]?.[squareIndex] ? `url(${squareBackgrounds[0][squareIndex]})` : 'none',
                    backgroundSize: '108px 108px',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {caseType === 'borderless' && squareGiftIcons[0]?.[squareIndex] && (
                    <img 
                      src={squareGiftIcons[0][squareIndex]}
                      alt="Gift"
                      style={{
                        width: '66px',
                        height: '66px',
                        objectFit: 'contain',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional rectangles for x2 and x3 */}
        {Array.from({ length: additionalRectangles }).map((_, rectIndex) => (
          <div 
            key={rectIndex}
            className="relative"
            style={{
              width: 'calc(100% + 40px)',
              height: 'calc(732px * 0.184)',
              backgroundColor: '#12181C',
              borderRadius: '0px',
              marginLeft: '-20px',
              marginRight: '-20px',
              marginTop: '16px'
            }}
          >
            {/* Up arrow icon */}
            <img 
              src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/up.svg"
              alt="Up"
              className="absolute top-0 left-0"
              style={{
                width: '100%',
                height: 'calc(732px * 0.184 * 0.0575)',
                objectFit: 'cover',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                zIndex: 20
              }}
            />
            
            {/* Down arrow icon */}
            <img 
              src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/down.svg"
              alt="Down"
              className="absolute bottom-0 left-0"
              style={{
                width: '100%',
                height: 'calc(732px * 0.184 * 0.0575)',
                objectFit: 'cover',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                zIndex: 20
              }}
            />

            {/* Squares container */}
            <div 
              ref={(el) => { scrollContainerRefs.current[1 + rectIndex] = el; return undefined; }}
              className="absolute flex items-center justify-center overflow-hidden"
              style={{
                top: '0',
                bottom: '0',
                left: '0',
                right: '0',
                paddingLeft: '9px',
                paddingRight: '9px',
                mask: 'linear-gradient(to right, rgba(18, 24, 28, 0) 0%, rgba(18, 24, 28, 1) 20%, rgba(27, 36, 44, 1) 80%, rgba(18, 24, 28, 0) 100%)',
                WebkitMask: 'linear-gradient(to right, rgba(18, 24, 28, 0) 0%, rgba(18, 24, 28, 1) 20%, rgba(27, 36, 44, 1) 80%, rgba(18, 24, 28, 0) 100%)'
              }}
            >
              <div className="flex items-center" style={{ gap: '9px' }}>
                {Array.from({ length: 125 }).map((_, squareIdx) => (
                  <div
                    key={squareIdx}
                    className="flex-shrink-0 relative flex items-center justify-center"
                    style={{
                      width: '108px',
                      height: '108px',
                      background: 'linear-gradient(45deg, #161D24 0%, #1B232B 100%)',
                      borderRadius: '20px',
                      border: '1px solid #303E4A',
                      backgroundImage: caseType === 'borderless' && squareBackgrounds[1 + rectIndex]?.[squareIdx] ? `url(${squareBackgrounds[1 + rectIndex][squareIdx]})` : 'none',
                      backgroundSize: '108px 108px',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    {caseType === 'borderless' && squareGiftIcons[1 + rectIndex]?.[squareIdx] && (
                      <img 
                        src={squareGiftIcons[1 + rectIndex][squareIdx]}
                        alt="Gift"
                        style={{
                          width: '66px',
                          height: '66px',
                          objectFit: 'contain',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none'
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Container for both rectangles or winning state buttons */}
        <div className="flex items-center" style={{ marginTop: '20px' }}>
          {hasWinningSquare && !isDemoToggled ? (
            /* Кнопка "Забрать в инвентарь" */
            <button 
              onClick={() => {
                console.log('Inventory button clicked!');
                setIsAddingToInventory(true);
                addToInventory();
              }}
              disabled={isAddingToInventory || isSelling || isClosingWithPrizes}
              className="flex items-center justify-center rounded-[20px] font-gilroy-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                width: '352px',
                height: '40px',
                background: (isAddingToInventory || isSelling || isClosingWithPrizes) 
                  ? 'linear-gradient(45deg, #666666 0%, #999999 100%)'
                  : 'linear-gradient(45deg, #0072EE 0%, #1686FF 100%)',
                fontSize: '15px',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                transition: 'none'
              }}
            >
              {(isAddingToInventory || isClosingWithPrizes) ? 'Добавление...' : `Забрать в инвентарь (${winningItems.length})`}
            </button>
          ) : (
            <>
              {/* First rectangle with 20px offset */}
              <div 
                className="relative flex"
                style={{
                  width: '235px',
                  height: '40px',
                  backgroundColor: '#232E37',
                  borderRadius: '20px'
                }}
              >
                {/* GPU оптимизированный ползунок с градиентом */}
                <div 
                  className="absolute top-0 bottom-0 rounded-[20px] transition-transform duration-300 ease-out"
                  style={{
                    background: 'linear-gradient(135deg, #0072EE 0%, #1686FF 100%)',
                    transform: sliderStyle.transform,
                    width: sliderStyle.width,
                    height: '40px',
                    willChange: 'transform'
                  }}
                />

                {multipliers.map((multiplier) => (
                  <div 
                    key={multiplier.id}
                    className={`flex items-center justify-center relative z-10 ${
                      isSpinning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}
                    style={{
                      width: `${multiplier.width}px`,
                      height: '40px'
                    }}
                    onClick={() => !isSpinning && setSelectedMultiplier(multiplier.id)}
                  >
                    <span 
                      className="font-gilroy-bold text-white"
                      style={{
                        fontSize: '15px',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                      }}
                    >
                      {multiplier.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Second rectangle with 10px offset - currency selector */}
              <div 
                className="relative flex items-center cursor-pointer"
                style={{
                  width: '107px',
                  height: '40px',
                  backgroundColor: '#232E37',
                  borderRadius: '20px',
                  marginLeft: '10px'
                }}
                onClick={() => !isSpinning && setSelectedCurrency(selectedCurrency === 'ton' ? 'stars' : 'ton')}
              >
                <img 
                  src={selectedCurrency === 'ton' ? 
                    "https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/toncoin_active.svg" :
                    "https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/stars_active.svg"
                  }
                  alt={selectedCurrency === 'ton' ? "TON" : "Stars"}
                  className="absolute"
                  style={{
                    width: '29px',
                    height: '29px',
                    left: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                />
                <span 
                  className="absolute font-gilroy-bold"
                  style={{
                    left: '42px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '15px',
                    color: '#FFFFFF',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                >
                  {(() => {
                    const basePrice = casePrice;
                    const multiplier = selectedMultiplier === 'x1' ? 1 : selectedMultiplier === 'x2' ? 2 : 3;
                    const price = basePrice * multiplier;
                    
                    // Показываем цену в выбранной валюте
                    if (selectedCurrency === 'ton') {
                      return `${price.toFixed(2)}`;
                    } else {
                      // Для Stars рассчитываем по формуле: TON * курс USD * 1/0.013
                      const priceInUsd = price * tonPrice;
                      const priceInStars = priceInUsd / 0.013;
                      // Округляем до ближайшего кратного 5
                      const rounded = Math.round(priceInStars / 5) * 5;
                      return rounded.toString();
                    }
                  })()}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Кнопка Вращать!/Пропустить (скрываем когда выиграл) */}
        {!(hasWinningSquare && !isDemoToggled) && (
          <div className="flex justify-center" style={{ marginTop: '16px' }}>
            <button 
              className="flex items-center justify-center rounded-[20px] font-gilroy-semibold text-white"
              style={{
                width: '352px',
                height: '40px',
                background: isSpinning && canSkip
                  ? 'linear-gradient(135deg, #2D3C48 0%, #405262 100%)'
                  : isSpinning 
                    ? 'linear-gradient(135deg, #666666 0%, #999999 100%)' 
                    : 'linear-gradient(135deg, #0072EE 0%, #1686FF 100%)',
                fontSize: '15px',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                opacity: (isSpinning && !canSkip) ? 0.7 : 1,
                cursor: (isSpinning && !canSkip) ? 'not-allowed' : 'pointer',
                transition: 'none'
              }}
              onClick={isSpinning && canSkip && !hasSkipped ? skipAnimation : spinAnimation}
              disabled={(isSpinning && !canSkip) || (isSpinning && hasSkipped)}
            >
              {isSpinning && canSkip && !hasSkipped
                ? 'Пропустить' 
                : isSpinning 
                  ? 'Вращение...' 
                  : (isDemoToggled ? 'Вращать демо!' : 'Вращать!')
              }
            </button>
          </div>
        )}

        {/* Прямоугольник под кнопкой Вращать или блок "Продать" */}
        <div className="flex items-center" style={{ marginTop: '16px' }}>
          {hasWinningSquare && !isDemoToggled ? (
            /* Блок "Продать" с ценой предмета */
            <div 
              className="relative flex"
              style={{
                width: '235px',
                height: '40px',
                background: 'linear-gradient(45deg, #2D3C48 0%, #405262 100%)',
                borderRadius: '20px',
                margin: '0 auto'
              }}
            >
              <div 
                className={`flex items-center justify-center relative z-10 ${(isSelling || isAddingToInventory) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  width: '235px',
                  height: '40px',
                  opacity: (isSelling || isAddingToInventory || isClosingWithPrizes) ? 0.7 : 1,
                  transition: 'none'
                }}
                onClick={(isSelling || isAddingToInventory || isClosingWithPrizes) ? undefined : () => {
                  setIsSelling(true);
                  sellItem();
                }}
              >
                <span 
                  className="font-gilroy-semibold text-white"
                  style={{
                    fontSize: '15px',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    fontFamily: 'Gilroy-SemiBold, sans-serif',
                    fontWeight: '600',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%'
                  }}
                >
                  {isSelling ? 'Продано!' : (selectedMultiplier === 'x1' ? 'Продать' : 'Продать все')}
                </span>
              </div>
            </div>
          ) : (
            /* Демо режим */
            <div 
              className="relative flex items-center"
              style={{
                width: '180px',
                height: '40px',
                backgroundColor: '#181F25',
                borderRadius: '20px',
                border: isDemoToggled 
                  ? '1px solid transparent'
                  : '1px solid #303E4A',
                background: isDemoToggled 
                  ? 'linear-gradient(#181F25, #181F25) padding-box, linear-gradient(135deg, #0072EE 0%, #1686FF 100%) border-box'
                  : '#181F25',
                margin: '0 auto',
                paddingLeft: '16px',
                paddingRight: '16px'
              }}
            >
              <span 
                className="font-gilroy-semibold"
                style={{
                  fontSize: '14px',
                  color: isDemoToggled ? '#007AFF' : '#445768',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  textAlign: 'center',
                  marginRight: '10px',
                  transform: 'translateX(-13px)'
                }}
              >
                Демо режим
              </span>
              
              {/* GPU оптимизированный переключатель */}
              <div 
                style={{
                  position: 'absolute',
                  right: '3px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '48px',
                  height: '29px',
                  backgroundColor: isDemoToggled ? '#007AFF' : '#303E4A',
                  borderRadius: '60px',
                  cursor: isSpinning ? 'not-allowed' : 'pointer',
                  opacity: isSpinning ? 0.5 : 1,
                  willChange: 'background-color'
                }}
                onClick={() => !isSpinning && setIsDemoToggled(!isDemoToggled)}
              >
                {/* GPU оптимизированный белый круг */}
                <div 
                  style={{
                    position: 'absolute',
                    left: '4px',
                    top: '4px',
                    width: '22px',
                    height: '22px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%',
                    transform: isDemoToggled ? 'translateX(19px)' : 'translateX(0px)',
                    transition: 'transform 0.3s ease',
                    willChange: 'transform'
                  }}
                />
              </div>
            </div>
          )}
          
          {hasWinningSquare && !isDemoToggled && (
            /* Прямоугольник с ценой предмета - всегда показывается в TON */
            <div 
              className="relative flex items-center"
              style={{
                width: '107px',
                height: '40px',
                backgroundColor: '#232E37',
                borderRadius: '20px',
                marginLeft: '10px'
              }}
            >
              <img 
                src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/toncoin_active.svg"
                alt="TON"
                className="absolute"
                style={{
                  width: '29px',
                  height: '29px',
                  left: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              />
              <span 
                className="absolute font-gilroy-bold"
                style={{
                  left: '42px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '15px',
                  color: '#FFFFFF',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                {winningGiftPrice > 0 ? `${winningGiftPrice.toFixed(2)}` : '0'}
              </span>
            </div>
          )}
        </div>

        {/* Текст под демо режимом */}
        {caseType === 'borderless' && (
          <div 
            className="font-gilroy-semibold"
            style={{
              fontSize: '12px',
              color: '#445768',
              marginTop: '10px',
              marginLeft: '19.5px', // Выровнено по левому краю первого квадрата
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            Содержимое:
          </div>
        )}

        {/* Квадраты под текстом "Содержимое:" */}
        {(() => {
          // Определяем содержимое кейса в зависимости от названия
          const caseContents: { [key: string]: Array<{ name: string; icon: string; background: string }> } = {
            'Love Party': [
              { name: 'Heart Locket', icon: 'https://cdn.changes.tg/gifts/models/Heart%20Locket/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg' },
              { name: 'Neko Helmet', icon: 'https://cdn.changes.tg/gifts/models/Neko%20Helmet/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg' },
              { name: 'Toy Bear', icon: 'https://cdn.changes.tg/gifts/models/Toy%20Bear/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg' },
              { name: 'Ionic Dryer', icon: 'https://cdn.changes.tg/gifts/models/Ionic%20Dryer/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg' },
              { name: 'Love Potion', icon: 'https://cdn.changes.tg/gifts/models/Love%20Potion/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg' },
              { name: 'Valentine Box', icon: 'https://cdn.changes.tg/gifts/models/Valentine%20Box/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg' },
              { name: 'Joyful Bundle', icon: 'https://cdn.changes.tg/gifts/models/Joyful%20Bundle/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg' }
            ],
            'Gold Rush': [
              { name: 'Nail Bracelet', icon: 'https://cdn.changes.tg/gifts/models/Nail%20Bracelet/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg' },
              { name: 'Bonded Ring', icon: 'https://cdn.changes.tg/gifts/models/Bonded%20Ring/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg' },
              { name: 'Genie Lamp', icon: 'https://cdn.changes.tg/gifts/models/Genie%20Lamp/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg' },
              { name: 'Swiss Watch', icon: 'https://cdn.changes.tg/gifts/models/Swiss%20Watch/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg' },
              { name: 'Signet Ring', icon: 'https://cdn.changes.tg/gifts/models/Signet%20Ring/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg' },
              { name: 'Cupid Charm', icon: 'https://cdn.changes.tg/gifts/models/Cupid%20Charm/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg' },
              { name: 'Sleigh Bell', icon: 'https://cdn.changes.tg/gifts/models/Sleigh%20Bell/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg' }
            ],
            'Tasty Bundle': [
              { name: 'Nail Bracelet', icon: 'https://cdn.changes.tg/gifts/models/Nail%20Bracelet/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg' },
              { name: 'Bonded Ring', icon: 'https://cdn.changes.tg/gifts/models/Bonded%20Ring/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg' },
              { name: 'Genie Lamp', icon: 'https://cdn.changes.tg/gifts/models/Genie%20Lamp/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg' },
              { name: 'Swiss Watch', icon: 'https://cdn.changes.tg/gifts/models/Swiss%20Watch/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg' },
              { name: 'Signet Ring', icon: 'https://cdn.changes.tg/gifts/models/Signet%20Ring/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg' },
              { name: 'Cupid Charm', icon: 'https://cdn.changes.tg/gifts/models/Cupid%20Charm/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg' }
            ],
            'Gangsta': [
              { name: 'Westside Sign', icon: 'https://cdn.changes.tg/gifts/models/Westside%20Sign/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg' },
              { name: 'Low Rider', icon: 'https://cdn.changes.tg/gifts/models/Low%20Rider/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg' },
              { name: 'Vintage Cigar', icon: 'https://cdn.changes.tg/gifts/models/Vintage%20Cigar/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg' },
              { name: 'Record Player', icon: 'https://cdn.changes.tg/gifts/models/Record%20Player/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg' },
              { name: 'Snoop Cigar', icon: 'https://cdn.changes.tg/gifts/models/Snoop%20Cigar/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg' },
              { name: 'Swag Bag', icon: 'https://cdn.changes.tg/gifts/models/Swag%20Bag/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg' },
              { name: 'Snoop Dogg', icon: 'https://cdn.changes.tg/gifts/models/Snoop%20Dogg/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg' }
            ],
            'Rich Holder': [
              { name: 'Plush Pepe', icon: 'https://cdn.changes.tg/gifts/models/Plush%20Pepe/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg' },
              { name: 'Heart Locket', icon: 'https://cdn.changes.tg/gifts/models/Heart%20Locket/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg' },
              { name: 'Precious Peach', icon: 'https://cdn.changes.tg/gifts/models/Precious%20Peach/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg' },
              { name: 'Mighty Arm', icon: 'https://cdn.changes.tg/gifts/models/Mighty%20Arm/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg' },
              { name: 'Nail Bracelet', icon: 'https://cdn.changes.tg/gifts/models/Nail%20Bracelet/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg' },
              { name: 'Loot Bag', icon: 'https://cdn.changes.tg/gifts/models/Loot%20Bag/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg' },
              { name: 'Ion Gem', icon: 'https://cdn.changes.tg/gifts/models/Ion%20Gem/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg' }
            ],
            'Rich Mood': [
              { name: 'Plush Pepe', icon: 'https://cdn.changes.tg/gifts/models/Plush%20Pepe/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg' },
              { name: 'Heart Locket', icon: 'https://cdn.changes.tg/gifts/models/Heart%20Locket/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg' },
              { name: 'Durov\'s Cap', icon: 'https://cdn.changes.tg/gifts/models/Durov\'s%20Cap/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg' },
              { name: 'Precious Peach', icon: 'https://cdn.changes.tg/gifts/models/Precious%20Peach/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg' }
            ],
            'VIP Box': [
              { name: 'Swiss Watch', icon: 'https://cdn.changes.tg/gifts/models/Swiss%20Watch/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg' },
              { name: 'Vintage Cigar', icon: 'https://cdn.changes.tg/gifts/models/Vintage%20Cigar/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg' },
              { name: 'Diamond Ring', icon: 'https://cdn.changes.tg/gifts/models/Diamond%20Ring/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg' },
              { name: 'Cupid Charm', icon: 'https://cdn.changes.tg/gifts/models/Cupid%20Charm/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg' },
              { name: 'Record Player', icon: 'https://cdn.changes.tg/gifts/models/Record%20Player/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg' },
              { name: 'Bow Tie', icon: 'https://cdn.changes.tg/gifts/models/Bow%20Tie/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg' },
              { name: 'Fresh Socks', icon: 'https://cdn.changes.tg/gifts/models/Fresh%20Socks/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg' }
            ],
            'Lunch Box': [
              { name: 'Valentine Box', icon: 'https://cdn.changes.tg/gifts/models/Valentine%20Box/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg' },
              { name: 'Berry Box', icon: 'https://cdn.changes.tg/gifts/models/Berry%20Box/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg' },
              { name: 'Bunny Muffin', icon: 'https://cdn.changes.tg/gifts/models/Bunny%20Muffin/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg' },
              { name: 'Easter Egg', icon: 'https://cdn.changes.tg/gifts/models/Easter%20Egg/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg' },
              { name: 'Candy Cane', icon: 'https://cdn.changes.tg/gifts/models/Candy%20Cane/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg' },
              { name: 'Whip Cupcake', icon: 'https://cdn.changes.tg/gifts/models/Whip%20Cupcake/png/Original.png', background: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg' }
            ]
          };

          const currentContent = caseContents[caseName] || caseContents['Gold Rush'];
          const contentToShow = currentContent.slice(0, 6); // Показываем только первые 6

          return (
            <>
              <div 
                className="flex justify-center"
                style={{
                  marginTop: '13px',
                  gap: '11px'
                }}
              >
                {contentToShow.slice(0, 3).map((gift, index) => (
                  <div
                    key={index}
                    className="relative flex items-center justify-center"
                    style={{
                      width: '97px',
                      height: '97px',
                      background: 'linear-gradient(45deg, #161D24 0%, #1B232B 100%)',
                      borderRadius: '20px',
                      border: '1px solid #303E4A',
                      backgroundImage: `url(${gift.background})`,
                      backgroundSize: '97px 97px',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    <img 
                      src={gift.icon}
                      alt={gift.name}
                      style={{
                        width: '66px',
                        height: '66px',
                        objectFit: 'contain',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                      }}
                    />
                    
                    {/* Info overlay */}
                    {activeInfoOverlay === index && (
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
                          {gift.name}
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
                            {(() => {
                              const giftPrice = giftProbabilities.find(g => g.name === gift.name)?.price || 0;
                              return `${formatGiftPrice(giftPrice)} TON`;
                            })()}
                          </span>
                        </div>
                        <div
                          className="font-gilroy-semibold text-white"
                          style={{
                            fontSize: '10px',
                            textAlign: 'center',
                            marginTop: '3px',
                            color: '#FFFFFF',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none'
                          }}
                        >
                          {(() => {
                            const giftData = giftProbabilities.find(g => g.name === gift.name);
                            if (!giftData) return '0%';
                            
                            // Для очень маленьких значений показываем больше знаков после запятой
                            if (giftData.weight < 0.01 && giftData.weight > 0) {
                              return `${Math.max(giftData.weight, 0.001).toFixed(3)}%`;
                            }
                            return `${giftData.weight.toFixed(2)}%`;
                          })()}
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
                        setActiveInfoOverlay(activeInfoOverlay === index ? null : index);
                      }}
                    >
                      {activeInfoOverlay === index ? (
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
                ))}
              </div>
              
              {/* Второй ряд квадратов с отступом 11px */}
              <div 
                className="flex justify-center"
                style={{
                  marginTop: '11px',
                  gap: '11px'
                }}
              >
                {contentToShow.slice(3, 6).map((gift, index) => (
                  <div
                    key={index + 3}
                    className="relative flex items-center justify-center"
                    style={{
                      width: '97px',
                      height: '97px',
                      background: 'linear-gradient(45deg, #161D24 0%, #1B232B 100%)',
                      borderRadius: '20px',
                      border: '1px solid #303E4A',
                      backgroundImage: `url(${gift.background})`,
                      backgroundSize: '97px 97px',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    <img 
                      src={gift.icon}
                      alt={gift.name}
                      style={{
                        width: '66px',
                        height: '66px',
                        objectFit: 'contain',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                      }}
                    />
                    
                    {/* Info overlay */}
                    {activeInfoOverlay === (index + 3) && (
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
                          {gift.name}
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
                            {(() => {
                              const giftPrice = giftProbabilities.find(g => g.name === gift.name)?.price || 0;
                              return `${formatGiftPrice(giftPrice)} TON`;
                            })()}
                          </span>
                        </div>
                        <div
                          className="font-gilroy-semibold text-white"
                          style={{
                            fontSize: '10px',
                            textAlign: 'center',
                            marginTop: '3px',
                            color: '#FFFFFF',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none'
                          }}
                        >
                          {(() => {
                            const giftData = giftProbabilities.find(g => g.name === gift.name);
                            if (!giftData) return '0%';
                            
                            // Для очень маленьких значений показываем больше знаков после запятой
                            if (giftData.weight < 0.01 && giftData.weight > 0) {
                              return `${Math.max(giftData.weight, 0.001).toFixed(3)}%`;
                            }
                            return `${giftData.weight.toFixed(2)}%`;
                          })()}
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
                        setActiveInfoOverlay(activeInfoOverlay === (index + 3) ? null : (index + 3));
                      }}
                    >
                      {activeInfoOverlay === (index + 3) ? (
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
                ))}
              </div>
              
              {/* Третий ряд с одним квадратом, если есть 7-й подарок */}
              {currentContent.length > 6 && (
                <div 
                  className="flex"
                  style={{
                    marginTop: '11px',
                    marginLeft: '14.5px' // Выровнено по левому краю первого квадрата
                  }}
                >
                  <div
                    className="relative flex items-center justify-center"
                    style={{
                      width: '97px',
                      height: '97px',
                      background: 'linear-gradient(45deg, #161D24 0%, #1B232B 100%)',
                      borderRadius: '20px',
                      border: '1px solid #303E4A',
                      backgroundImage: `url(${currentContent[6].background})`,
                      backgroundSize: '97px 97px',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    <img 
                      src={currentContent[6].icon}
                      alt={currentContent[6].name}
                      style={{
                        width: '66px',
                        height: '66px',
                        objectFit: 'contain',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                      }}
                    />
                    
                    {/* Info overlay */}
                    {activeInfoOverlay === 6 && (
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
                          {currentContent[6].name}
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
                            {(() => {
                              const giftPrice = giftProbabilities.find(g => g.name === currentContent[6].name)?.price || 0;
                              return `${formatGiftPrice(giftPrice)} TON`;
                            })()}
                          </span>
                        </div>
                        <div
                          className="font-gilroy-semibold text-white"
                          style={{
                            fontSize: '10px',
                            textAlign: 'center',
                            marginTop: '3px',
                            color: '#FFFFFF',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none'
                          }}
                        >
                          {(() => {
                            const giftData = giftProbabilities.find(g => g.name === currentContent[6].name);
                            if (!giftData) return '0%';
                            
                            // Для очень маленьких значений показываем больше знаков после запятой
                            if (giftData.weight < 0.01 && giftData.weight > 0) {
                              return `${Math.max(giftData.weight, 0.001).toFixed(3)}%`;
                            }
                            return `${giftData.weight.toFixed(2)}%`;
                          })()}
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
                        setActiveInfoOverlay(activeInfoOverlay === 6 ? null : 6);
                      }}
                    >
                      {activeInfoOverlay === 6 ? (
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
                </div>
              )}
            </>
          );
        })()}
        
        </div>
      </div>
      </div>
      
      {/* Уведомление о недостатке средств */}
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
    </>
  );
}
