import { useState, useMemo, useEffect } from 'react';
import Footer from '@/react-app/components/Footer';
import UserHeader from '@/react-app/components/UserHeader';
import { useTelegramAuth } from '@/react-app/hooks/useTelegramAuth';
import { formatGiftPrice } from '@/react-app/utils/formatGiftPrice';

export default function Upgrade() {
  const [selectedMultiplier, setSelectedMultiplier] = useState<string>('x1.5');
  const [selectedMode, setSelectedMode] = useState<string>('gifts');
  const { user: telegramUser } = useTelegramAuth();
  const [userInventory, setUserInventory] = useState<Array<{
    id: number;
    gift_name: string;
    gift_icon: string;
    gift_background: string;
    gift_price: number;
    obtained_from: string;
    created_at: string;
  }>>([]);
  const [activeInfoOverlay, setActiveInfoOverlay] = useState<number | null>(null);
  const [selectedGifts, setSelectedGifts] = useState<number[]>([]);
  const [selectedUpgradeItem, setSelectedUpgradeItem] = useState<number | null>(null);
  const [allGifts, setAllGifts] = useState<Array<{
    name: string;
    price: number;
    icon: string;
    background: string;
  }>>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [arrowRotation, setArrowRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [liveWins, setLiveWins] = useState<Array<{
    timestamp: number;
    user: any;
    giftName: string;
    giftIcon: string;
    giftBackground: string;
    id: string;
  }>>([]);
  const [lastWinSyncTime, setLastWinSyncTime] = useState<number>(Date.now());
  const [animatingWins, setAnimatingWins] = useState<Set<string>>(new Set());

  // Функция для определения фона подарка на основе цены
  const getGiftBackground = (price: number): string => {
    if (price >= 500) return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg';
    if (price >= 100) return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg';
    if (price >= 50) return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg';
    if (price >= 20) return 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg';
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

  // Загружаем инвентарь пользователя
  const loadUserInventory = async () => {
    if (!window.Telegram?.WebApp?.initData) return;
    
    try {
      const response = await fetch('/api/user/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData: window.Telegram.WebApp.initData }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserInventory(data.items || []);
      }
    } catch (error) {
      console.error('Failed to load user inventory:', error);
    }
  };

  useEffect(() => {
    loadUserInventory();
    loadAllGifts();
  }, [telegramUser]);

  // Handle item selection
  const handleItemClick = (itemId: number) => {
    if (selectedMode === 'gifts') {
      setSelectedGifts(prev => {
        if (prev.includes(itemId)) {
          // Если предмет уже выбран, убираем его из выделения
          return prev.filter(id => id !== itemId);
        } else {
          // В режиме подарков можно выбирать максимум 6 предметов
          if (prev.length >= 6) {
            return prev; // Не добавляем новый предмет, если уже выбрано 6
          }
          return [...prev, itemId];
        }
      });
    } else if (selectedMode === 'upgrade') {
      setSelectedUpgradeItem(prev => {
        // В режиме апгрейда можно выбрать только 1 предмет
        return prev === itemId ? null : itemId;
      });
    }
  };

  // Calculate total bet amount from selected gifts (always sum of selected inventory items)
  const totalBetAmount = useMemo(() => {
    const selectedGiftItems = userInventory.filter(item => selectedGifts.includes(item.id));
    const total = selectedGiftItems.reduce((sum, item) => sum + item.gift_price, 0);
    return total.toFixed(2);
  }, [selectedGifts, userInventory]);

  // Calculate total win amount (always price of selected upgrade item WITHOUT multiplier)
  const totalWinAmount = useMemo(() => {
    if (selectedUpgradeItem !== null) {
      const selectedGift = allGifts[selectedUpgradeItem];
      if (selectedGift) {
        // Price without any multiplier applied
        return selectedGift.price.toFixed(2);
      }
    }
    return '0.00';
  }, [selectedUpgradeItem, allGifts]);

  // Calculate success chance
  const successChance = useMemo(() => {
    const betAmount = parseFloat(totalBetAmount);
    const winAmount = parseFloat(totalWinAmount);
    
    if (betAmount > 0 && winAmount > 0) {
      const chance = (betAmount / winAmount) * 100;
      return Math.min(chance, 75);
    }
    
    return 0;
  }, [totalBetAmount, totalWinAmount]);

  // Проверка новых выигрышей из апгрейдов
  const checkForNewUpgradeWins = async () => {
    try {
      const response = await fetch(`/api/sync/upgrade-wins?since=${lastWinSyncTime}`);
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
      console.error('Error checking for new upgrade wins:', error);
    }
  };

  // Polling для синхронизации выигрышей апгрейдов
  useEffect(() => {
    const interval = setInterval(checkForNewUpgradeWins, 1000); // Каждую секунду
    return () => clearInterval(interval);
  }, [lastWinSyncTime]);

  // Function to check if arrow lands in success zone
  const checkArrowInSuccessZone = (finalRotation: number) => {
    // Нормализуем угол поворота стрелочки к диапазону 0-360
    const normalizedAngle = finalRotation % 360;
    
    // Зона успеха в градусах (successChance от 0% до 75% = от 0° до 270°)
    const successZoneDegrees = (successChance / 100) * 360;
    
    // Стрелочка стартует с верхней точки (0°), зона успеха тоже начинается с 0°
    // Проверяем, попадает ли финальный угол в зону успеха
    return normalizedAngle <= successZoneDegrees;
  };

  // Calculate if app is in locked state
  const isAppLocked = isSpinning || showResult;

  // Handle user leaving during spin - enhanced for Telegram Mini App
  useEffect(() => {
    // Function to forfeit gifts
    const forfeitGifts = async (method: 'beacon' | 'fetch' = 'fetch') => {
      if (isSpinning && selectedGifts.length > 0) {
        try {
          const initData = window.Telegram?.WebApp?.initData;
          if (initData) {
            const requestBody = JSON.stringify({
              initData,
              selectedGiftIds: selectedGifts
            });

            if (method === 'beacon' && navigator.sendBeacon) {
              // Use sendBeacon for reliable delivery during page unload
              navigator.sendBeacon('/api/upgrade/forfeit-spin', requestBody);
            } else {
              // Use regular fetch for other cases
              await fetch('/api/upgrade/forfeit-spin', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: requestBody,
              });
            }
          }
        } catch (error) {
          console.error('Failed to forfeit gifts on exit:', error);
        }
      }
    };

    // Standard web events
    const handleBeforeUnload = () => {
      forfeitGifts('beacon');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        forfeitGifts('fetch');
      }
    };

    // Additional mobile/app events
    const handlePageHide = () => {
      forfeitGifts('beacon');
    };

    const handleBlur = () => {
      forfeitGifts('fetch');
    };

    const handleFocus = () => {
      // When page regains focus, check if we're still spinning with gifts
      // If not, something went wrong and we should reload inventory
      if (!isSpinning && selectedGifts.length > 0) {
        loadUserInventory();
        setSelectedGifts([]);
      }
    };

    // Telegram WebApp specific handling
    if (window.Telegram?.WebApp) {
      // Additional mobile/app events can be handled here if needed
    }

    // Periodic check for disconnected state (fallback)
    const periodicCheck = setInterval(() => {
      if (isSpinning && selectedGifts.length > 0) {
        // Check if page is hidden for more than 3 seconds
        if (document.hidden) {
          forfeitGifts('fetch');
        }
        
        // Check if Telegram WebApp is available and active
        if (window.Telegram?.WebApp && !window.Telegram.WebApp.isExpanded) {
          forfeitGifts('fetch');
        }
      }
    }, 3000);

    // Add all event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      clearInterval(periodicCheck);
      
      // Remove Telegram-specific listeners  
      // Note: offEvent may not be available in all Telegram WebApp versions
    };
  }, [isSpinning, selectedGifts]);

  // Handle upgrade button click
  const handleUpgradeClick = async () => {
    if (selectedGifts.length > 0 && selectedUpgradeItem !== null && !isSpinning) {
      // Добавляем тактильную обратную связь при нажатии активной кнопки
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
      
      setIsSpinning(true);
      setShowResult(false);
      
      // Generate random end position (0-360 degrees)
      const randomEndDegrees = Math.random() * 360;
      
      // Calculate total rotation (multiple full rotations + random end position)
      const fullRotations = 5; // Number of full spins
      const totalRotation = fullRotations * 360 + randomEndDegrees;
      
      setArrowRotation(totalRotation);
      
      // Stop spinning after animation completes and show result
      setTimeout(async () => {
        setIsSpinning(false);
        
        // Check if arrow landed in success zone
        const won = checkArrowInSuccessZone(randomEndDegrees);
        setIsWin(won);
        setShowResult(true);
        
        // Плавно доворачиваем стрелку до 0 градусов кратчайшим путем
        setTimeout(() => {
          // Вычисляем текущую позицию стрелки (нормализованную)
          const currentAngle = totalRotation % 360;
          
          // Вычисляем кратчайший путь до 0 градусов
          let targetRotation = totalRotation;
          if (currentAngle > 180) {
            // Если больше 180°, идем по часовой до 360° (что равно 0°)
            targetRotation = totalRotation + (360 - currentAngle);
          } else {
            // Если меньше 180°, идем против часовой до 0°
            targetRotation = totalRotation - currentAngle;
          }
          
          setArrowRotation(targetRotation);
        }, 100); // Небольшая задержка для плавности
        
        // Обрабатываем результат апгрейда - удаляем ставки и добавляем выигрыш при победе
        try {
          const selectedUpgradeGift = selectedUpgradeItem !== null ? allGifts[selectedUpgradeItem] : null;
          
          const response = await fetch('/api/upgrade/process-result', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              initData: window.Telegram?.WebApp?.initData,
              isWin: won,
              selectedGiftIds: selectedGifts,
              selectedUpgradeGift: selectedUpgradeGift
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // Обновляем инвентарь пользователя
            setUserInventory(data.updatedInventory || []);
            
            // Сбрасываем выбранные предметы
            setSelectedGifts([]);
            setSelectedUpgradeItem(null);
          }
        } catch (error) {
          console.error('Failed to process upgrade result:', error);
        }

        // Если выигрыш - уведомляем о победе в апгрейде для Live блока
        if (won && selectedUpgradeItem !== null) {
          const selectedGift = allGifts[selectedUpgradeItem];
          if (selectedGift) {
            try {
              await fetch('/api/sync/notify-upgrade-win', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  timestamp: Date.now(),
                  initData: window.Telegram?.WebApp?.initData,
                  giftName: selectedGift.name,
                  giftIcon: selectedGift.icon,
                  giftBackground: selectedGift.background
                }),
              });
            } catch (error) {
              console.error('Failed to notify upgrade win:', error);
            }
          }
        }
        
        // Hide result after 1.5 seconds
        setTimeout(() => {
          setShowResult(false);
          // Reset arrow rotation to 0 for next animation
          setArrowRotation(0);
        }, 1500);
      }, 6000);
    }
  };

  // Multipliers with their calculated widths
  const multipliers = [
    { id: 'x1.5', label: 'x1.5' },
    { id: 'x2', label: 'x2' },
    { id: 'x3', label: 'x3' },
    { id: 'x5', label: 'x5' },
    { id: 'x10', label: 'x10' }
  ];

  // Mode options for second slider
  const modeOptions = [
    { id: 'gifts', label: 'Выбрать подарки' },
    { id: 'upgrade', label: 'Апгрейд' }
  ];

  // Calculate slider position and width using left positioning
  const sliderStyle = useMemo(() => {
    const selectedIndex = multipliers.findIndex(m => m.id === selectedMultiplier);
    if (selectedIndex === -1) return { left: '0px', width: 'calc((100% - 8px - 16px) / 5)' };

    // Each block width: (container width - left padding - right padding - 4 gaps of 4px) / 5 blocks
    const blockWidth = 'calc((100% - 8px - 16px) / 5)';
    
    // Calculate left position: (block width + gap) * selected index
    const leftPosition = selectedIndex === 0 
      ? '0px'
      : `calc((((100% - 8px - 16px) / 5) + 4px) * ${selectedIndex})`;

    return {
      left: leftPosition,
      width: blockWidth
    };
  }, [selectedMultiplier, multipliers]);

  // Calculate slider position and width for mode selector
  const modeSliderStyle = useMemo(() => {
    const selectedIndex = modeOptions.findIndex(m => m.id === selectedMode);
    if (selectedIndex === -1) return { left: '0px', width: 'calc((100% - 8px - 4px) / 2)' };

    // Each block width: (container width - left padding - right padding - 1 gap of 4px) / 2 blocks
    const blockWidth = 'calc((100% - 8px - 4px) / 2)';
    
    // Calculate left position: (block width + gap) * selected index
    const leftPosition = selectedIndex === 0 
      ? '0px'
      : `calc((((100% - 8px - 4px) / 2) + 4px) * ${selectedIndex})`;

    return {
      left: leftPosition,
      width: blockWidth
    };
  }, [selectedMode, modeOptions]);
  return (
    <div className="min-h-screen text-white flex flex-col items-center" style={{ backgroundColor: '#060E15' }}>
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl flex flex-col">
        <UserHeader onModalStateChange={() => {}} isLocked={isAppLocked} />
        
        <div className="px-3 sm:px-4 md:px-6 flex-1 flex flex-col">
          {/* Live кнопка и квадраты */}
          <div className="flex items-center mb-5">
            {/* Прямоугольник Live */}
            <div 
              className="w-4 sm:w-5 md:w-6 h-10 sm:h-12 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#1D252C' }}
            >
              <span
                className="font-gilroy-semibold"
                style={{
                  fontSize: '13px',
                  background: 'linear-gradient(90deg, #31DB77 0%, #21AD5B 74%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  transform: 'rotate(-90deg)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                •Live
              </span>
            </div>
            
            {/* 5 квадратов справа */}
            <div className="flex items-center space-x-[7px] ml-[7px] relative">
              {Array.from({ length: 5 }).map((_, index) => {
                const win = liveWins[index];
                const isNewWin = win && animatingWins.has(win.id);
                
                return (
                  <div
                    key={win?.id || `empty-${index}`}
                    className={`w-[63px] h-[63px] rounded-[20px] relative flex items-center justify-center transition-all duration-500 ease-out ${
                      isNewWin ? 'live-win-enter' : ''
                    }`}
                    style={{ 
                      backgroundColor: '#1D252C',
                      border: '1px solid #303E4A'
                    }}
                  >
                    {/* Background image layer */}
                    {win?.giftBackground && (
                      <div
                        className="absolute inset-[1px] rounded-[19px]"
                        style={{
                          backgroundImage: `url(${win.giftBackground})`,
                          backgroundSize: '61px 61px',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      />
                    )}
                    {win?.giftIcon && (
                      <img 
                        src={win.giftIcon}
                        alt={win.giftName || 'Gift'}
                        className="relative z-10"
                        style={{
                          width: '38px',
                          height: '38px',
                          objectFit: 'contain',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none'
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Arrow Logo */}
          <div className="w-full flex justify-center items-center relative">
            <img 
              src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arrow.svg"
              alt="Arrow"
              style={{ 
                width: '13px', 
                height: '8px',
                position: 'absolute',
                top: '-5px',
                left: '50%',
                transform: `translate(-50%, 0px) rotate(${arrowRotation}deg)`,
                transformOrigin: '50% 138px', // Distance from arrow to yellow circle center (138px radius + 5px offset)
                transition: isSpinning 
                  ? 'transform 6s cubic-bezier(0.23, 1, 0.32, 1)' 
                  : showResult 
                    ? 'transform 2s ease-out' 
                    : 'none',
                zIndex: 10
              }}
            />
          </div>

          {/* Circle with border */}
          <div className="w-full flex justify-center items-center mt-[7px] relative">
            {/* Arrow Path Progress Circle with Yellow Color */}
            <svg 
              width="276" 
              height="276" 
              className="absolute"
              style={{ 
                transform: 'rotate(-90deg)',
                zIndex: 1
              }}
            >
              <defs>
                <linearGradient id="arrowProgressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFC300" stopOpacity="0" />
                  <stop offset="100%" stopColor="#FF7700" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle
                cx="138"
                cy="138"
                r="138"
                fill="none"
                stroke="url(#arrowProgressGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 138}`}
                strokeDashoffset={`${2 * Math.PI * 138 * (1 - successChance / 100)}`}
                style={{
                  transition: 'stroke-dashoffset 0.5s ease-out'
                }}
              />
            </svg>
            
            {/* Progress Circle with Gradient Border */}
            <svg 
              width="250" 
              height="250" 
              className="absolute"
              style={{ 
                transform: 'rotate(-90deg)',
                zIndex: 2
              }}
            >
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={showResult && !isWin ? "#FF3B4E" : "#1686FF"} />
                  <stop offset="100%" stopColor={showResult && !isWin ? "#FF3B4E" : "#1686FF"} />
                </linearGradient>
              </defs>
              <circle
                cx="125"
                cy="125"
                r="113.75"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="22.5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 113.75}`}
                strokeDashoffset={`${2 * Math.PI * 113.75 * (1 - successChance / 100)}`}
                style={{
                  transition: 'stroke-dashoffset 0.5s ease-out'
                }}
              />
            </svg>
            
            {/* Base Circle with border */}
            <div 
              className="rounded-full flex items-center justify-center relative z-1"
              style={{
                width: '250px',
                height: '250px',
                border: '22.5px solid #181F25',
                backgroundColor: 'transparent'
              }}
            >
              {/* Inner circle */}
              <div 
                className="rounded-full flex items-center justify-center"
                style={{
                  width: '160px',
                  height: '160px',
                  backgroundColor: '#1D252C'
                }}
              >
                <div className="flex flex-col items-center" style={{ marginTop: '-8px' }}>
                  <div 
                    className="font-gilroy-bold"
                    style={{
                      fontSize: showResult ? '24px' : '30px',
                      color: showResult
                        ? (isWin ? '#1686FF' : '#FF3B4E')
                        : '#1686FF',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    {showResult
                      ? (isWin ? 'Победа!' : 'Проигрыш')
                      : `${successChance.toFixed(2)}%`
                    }
                  </div>
                  <div 
                    className="font-gilroy-semibold"
                    style={{
                      fontSize: '14px',
                      marginTop: '-8px',
                      color: '#445768',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    {showResult
                      ? (isWin ? 'Поздравляем!' : 'Ты... проиграл?')
                      : 'Шанс успеха'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two rectangles below circle */}
          <div className="flex items-center justify-between" style={{ marginTop: '23px', paddingLeft: '3px', paddingRight: '3px' }}>
            {/* Left rectangle - aligned with Live rectangle */}
            <div 
              className="rounded-[20px] flex items-center relative"
              style={{
                width: '143px',
                height: '40px',
                backgroundColor: '#1D252C',
                marginLeft: '0px' // Aligned with Live rectangle position
              }}
            >
              <img 
                src="https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/add.svg"
                alt="Add"
                className="cursor-pointer"
                style={{ 
                  width: '32px', 
                  height: '32px',
                  marginLeft: '5px',
                  opacity: isAppLocked ? 0.5 : 1,
                  pointerEvents: isAppLocked ? 'none' : 'auto',
                  transition: 'opacity 0.3s ease'
                }}
                onClick={() => {
                  setSelectedMode('gifts');
                  // Прокрутка к разделу выбора режима с отступом 16px
                  setTimeout(() => {
                    const modeSection = document.querySelector('[data-section="mode-selector"]');
                    if (modeSection) {
                      const yOffset = -16; // отступ 16px сверху
                      const y = modeSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }, 100);
                }}
              />
              <span 
                className="font-gilroy-semibold text-white absolute"
                style={{
                  fontSize: '8px',
                  left: '42px', // 5px margin from logo + 32px logo width + 5px spacing
                  top: '6px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                Сумма ставки
              </span>
              <img 
                src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/toncoin_active.svg"
                alt="Toncoin"
                className="absolute"
                style={{ 
                  width: '12px', 
                  height: '12px',
                  left: '42px', // Same as text left edge
                  top: '22px' // 6px (text top) + 8px spacing + 8px text height
                }}
              />
              <span 
                className="font-gilroy-bold text-white absolute"
                style={{
                  fontSize: '12px',
                  left: '57px', // 42px (logo left) + 12px (logo width) + 3px (spacing)
                  top: '20px', // Same as logo top
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                {totalBetAmount}
              </span>
            </div>
            
            {/* Right rectangle - aligned with last square in Live */}
            <div 
              className="rounded-[20px] flex items-center justify-end relative"
              style={{
                width: '143px',
                height: '40px',
                backgroundColor: '#1D252C',
                marginRight: '0px' // Will be positioned by the justify-between and container padding
              }}
            >
              <img 
                src="https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/add.svg"
                alt="Add"
                className="cursor-pointer"
                style={{ 
                  width: '32px', 
                  height: '32px',
                  marginRight: '5px',
                  opacity: isAppLocked ? 0.5 : 1,
                  pointerEvents: isAppLocked ? 'none' : 'auto',
                  transition: 'opacity 0.3s ease'
                }}
                onClick={() => {
                  setSelectedMode('upgrade');
                  // Прокрутка к разделу выбора режима с отступом 16px
                  setTimeout(() => {
                    const modeSection = document.querySelector('[data-section="mode-selector"]');
                    if (modeSection) {
                      const yOffset = -16; // отступ 16px сверху
                      const y = modeSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }, 100);
                }}
              />
              <span 
                className="font-gilroy-semibold text-white absolute"
                style={{
                  fontSize: '8px',
                  right: '42px', // 5px margin from logo + 32px logo width + 5px spacing
                  top: '6px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                Сумма выигрыша
              </span>
              <img 
                src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/toncoin_active.svg"
                alt="Toncoin"
                className="absolute"
                style={{ 
                  width: '12px', 
                  height: '12px',
                  right: '42px', // Align right edge with text right edge
                  top: '22px' // 6px (text top) + 8px spacing + 8px text height
                }}
              />
              <span 
                className="font-gilroy-bold text-white absolute"
                style={{
                  fontSize: '12px',
                  right: '57px', // 42px (logo right) + 12px (logo width) + 3px (spacing)
                  top: '20px', // Same as logo top
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                {totalWinAmount}
              </span>
            </div>
          </div>

          {/* New rectangle below with multiplier buttons */}
          <div 
            className="rounded-[20px] flex items-center relative"
            style={{
              width: '100%',
              height: '44px',
              backgroundColor: '#1D252C',
              marginTop: '16px',
              marginLeft: '3px',
              marginRight: '3px',
              paddingLeft: '4px',
              paddingRight: '4px',
              opacity: isAppLocked ? 0.5 : 1,
              pointerEvents: isAppLocked ? 'none' : 'auto',
              transition: 'opacity 0.3s ease'
            }}
          >
            {/* Animated slider background */}
            <div 
              className="absolute rounded-[20px] transition-all duration-300 ease-out"
              style={{
                backgroundColor: '#303E4A',
                height: '36px',
                top: '4px',
                left: `calc(4px + ${sliderStyle.left})`,
                width: sliderStyle.width,
                willChange: 'left'
              }}
            />

            {multipliers.map((multiplier, index) => (
              <div
                key={multiplier.id}
                className="flex items-center justify-center relative z-10 cursor-pointer"
                style={{
                  flex: 1,
                  height: '100%',
                  marginRight: index < 4 ? '4px' : '0px'
                }}
                onClick={() => {
                  setSelectedMultiplier(multiplier.id);
                  setSelectedUpgradeItem(null); // Сбрасываем выбранный подарок при изменении мультипликатора
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
                  {multiplier.label}
                </span>
              </div>
            ))}
          </div>

          {/* Button between multiplier and sections */}
          <div 
            className="rounded-[20px] flex items-center justify-center cursor-pointer"
            style={{
              width: '100%',
              height: '44px',
              background: (selectedGifts.length > 0 && selectedUpgradeItem !== null) 
                ? 'linear-gradient(to bottom, #1686FF 0%, #0072EE 100%)'
                : '#1D252C',
              marginTop: '16px',
              marginLeft: '3px',
              marginRight: '3px',
              opacity: isAppLocked ? 0.7 : 1,
              pointerEvents: isAppLocked ? 'none' : 'auto',
              transition: 'opacity 0.3s ease'
            }}
            onClick={handleUpgradeClick}
          >
            <span 
              className="font-gilroy-semibold text-white"
              style={{
                fontSize: '14px',
                color: '#FFFFFF',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            >
              {isSpinning ? 'Улучшаем...' : 'Улучшить!'}
            </span>
          </div>

          

          {/* Second rectangle below */}
          <div 
            className="rounded-[20px] flex items-center relative"
            data-section="mode-selector"
            style={{
              width: '100%',
              height: '44px',
              backgroundColor: '#1D252C',
              marginTop: '16px',
              marginLeft: '3px',
              marginRight: '3px',
              paddingLeft: '4px',
              paddingRight: '4px',
              opacity: isAppLocked ? 0.5 : 1,
              pointerEvents: isAppLocked ? 'none' : 'auto',
              transition: 'opacity 0.3s ease'
            }}
          >
            {/* Animated slider background */}
            <div 
              className="absolute rounded-[20px] transition-all duration-300 ease-out"
              style={{
                backgroundColor: '#303E4A',
                height: '36px',
                top: '4px',
                left: `calc(4px + ${modeSliderStyle.left})`,
                width: modeSliderStyle.width,
                willChange: 'left'
              }}
            />

            {modeOptions.map((mode, index) => (
              <div
                key={mode.id}
                className="flex items-center justify-center relative z-10 cursor-pointer"
                style={{
                  flex: 1,
                  height: '100%',
                  marginRight: index < 1 ? '4px' : '0px'
                }}
                onClick={() => {
                  setSelectedMode(mode.id);
                  setActiveInfoOverlay(null); // Закрываем открытые оверлеи
                }}
              >
                <span 
                  className="font-gilroy-semibold text-white"
                  style={{
                    fontSize: '14px',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                >
                  {mode.label}
                </span>
              </div>
            ))}
          </div>

          {/* Items display - inventory or all gifts based on mode */}
          <div 
            className="w-full"
            data-section="items-display"
            style={{
              marginTop: '16px',
              marginLeft: '3px',
              marginRight: '3px',
              paddingBottom: '120px',
              opacity: isAppLocked ? 0.5 : 1,
              pointerEvents: isAppLocked ? 'none' : 'auto',
              transition: 'opacity 0.3s ease'
            }}
          >
            {(() => {
              let itemsToShow;
              
              if (selectedMode === 'gifts') {
                itemsToShow = userInventory;
              } else {
                // В режиме апгрейда фильтруем подарки по цене
                const betAmount = parseFloat(totalBetAmount) || 0;
                const multiplierValue = parseFloat(selectedMultiplier.replace('x', ''));
                const minPrice = betAmount * multiplierValue;
                
                itemsToShow = allGifts.filter(gift => gift.price >= minPrice);
              }
              
              const hasItems = itemsToShow.length > 0;
              
              if (!hasItems) {
                return (
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
                      {selectedMode === 'gifts' ? 'Выигрывайте подарки в кейсах' : 'Выберите подарки для ставок'}
                    </div>
                  </div>
                );
              }

              return (
                <div>
                  {Array.from({ length: Math.ceil(itemsToShow.length / 3) }).map((_, rowIndex) => (
                    <div 
                      key={rowIndex} 
                      className="flex justify-between"
                      style={{ 
                        marginBottom: rowIndex < Math.ceil(itemsToShow.length / 3) - 1 ? '12px' : '0px'
                      }}
                    >
                      {itemsToShow.slice(rowIndex * 3, rowIndex * 3 + 3).map((item, itemIndex) => {
                        const actualIndex = rowIndex * 3 + itemIndex;
                        const itemId = selectedMode === 'gifts' ? (item as any).id : actualIndex;
                        const isInventoryItem = selectedMode === 'gifts';
                        const isSelected = selectedMode === 'gifts' 
                          ? selectedGifts.includes(itemId)
                          : selectedUpgradeItem === itemId;
                        const hasSelectedItems = selectedMode === 'gifts' 
                          ? selectedGifts.length > 0
                          : selectedUpgradeItem !== null;
                        const isSelectionLimitReached = selectedMode === 'gifts' && selectedGifts.length >= 6 && !isSelected;
                        
                        return (
                      <div
                          key={itemId}
                          className="relative flex items-center justify-center cursor-pointer"
                          style={{
                            width: 'calc((100% - 24px) / 3)', // Равномерное распределение с учетом отступов
                            height: '120px',
                            background: 'linear-gradient(45deg, #161D24 0%, #1B232B 100%)',
                            borderRadius: '20px',
                            border: isSelected ? '1px solid #007AFF' : '1px solid #303E4A',
                            backgroundImage: isInventoryItem 
                              ? ((item as any).gift_background ? `url(${(item as any).gift_background})` : 'none')
                              : `url(${(item as any).background})`,
                            backgroundSize: '120px 120px',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            opacity: (hasSelectedItems && !isSelected) || isSelectionLimitReached ? 0.2 : 1,
                            transition: 'all 0.2s ease',
                            cursor: isSelectionLimitReached ? 'not-allowed' : 'pointer'
                          }}
                          onClick={() => {
                            if (!isSelectionLimitReached) {
                              handleItemClick(itemId);
                            }
                          }}
                        >
                          {((isInventoryItem && (item as any).gift_icon) || (!isInventoryItem && (item as any).icon)) && (
                            <img 
                              src={isInventoryItem ? (item as any).gift_icon : (item as any).icon}
                              alt={isInventoryItem ? (item as any).gift_name : (item as any).name}
                              style={{
                                width: '82px',
                                height: '82px',
                                objectFit: 'contain',
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                MozUserSelect: 'none',
                                msUserSelect: 'none'
                              }}
                            />
                          )}
                          
                          {/* Info overlay */}
                          {activeInfoOverlay === itemId && (
                            <div
                              className="absolute inset-0 flex flex-col items-center justify-center"
                              style={{
                                backgroundColor: 'rgba(6, 14, 21, 0.85)',
                                borderRadius: '20px',
                                backdropFilter: 'blur(4px)',
                                zIndex: 40
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div
                                className="font-gilroy-semibold text-white"
                                style={{
                                  fontSize: '14px',
                                  textAlign: 'center',
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none',
                                  MozUserSelect: 'none',
                                  msUserSelect: 'none'
                                }}
                              >
                                {isInventoryItem ? (item as any).gift_name : (item as any).name}
                              </div>
                              <div
                                className="flex items-center justify-center"
                                style={{
                                  width: '66px',
                                  height: '25px',
                                  marginTop: '8px',
                                  background: 'linear-gradient(135deg, #0067D7 0%, #1686FF 100%)',
                                  cursor: 'pointer',
                                  borderRadius: '20px'
                                }}
                              >
                                <span 
                                  className="font-gilroy-bold text-white"
                                  style={{
                                    fontSize: '11px',
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    MozUserSelect: 'none',
                                    msUserSelect: 'none'
                                  }}
                                >
                                  {formatGiftPrice(isInventoryItem ? (item as any).gift_price : (item as any).price)} TON
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Info icon in top right corner */}
                          <div
                            className="absolute cursor-pointer"
                            style={{
                              top: '5px',
                              right: '5px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 50
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveInfoOverlay(activeInfoOverlay === itemId ? null : itemId);
                            }}
                          >
                            {activeInfoOverlay === itemId ? (
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
                                <path d="M8.5 1.5L1.5 8.5M1.5 1.5L8.5 8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                            ) : (
                              <svg 
                                width="16" 
                                height="16" 
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
                      {itemsToShow.slice(rowIndex * 3, rowIndex * 3 + 3).length < 3 && 
                        Array.from({ length: 3 - itemsToShow.slice(rowIndex * 3, rowIndex * 3 + 3).length }).map((_, emptyIndex) => (
                          <div
                            key={`empty-${emptyIndex}`}
                            style={{ width: 'calc((100% - 24px) / 3)' }}
                          />
                        ))
                      }
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      
      <Footer currentPage="upgrade" isLocked={isAppLocked} />
    </div>
  );
}
