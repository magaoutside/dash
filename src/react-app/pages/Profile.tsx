import Footer from '@/react-app/components/Footer';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { useBalance } from '../hooks/useBalance';
import { formatTonBalance } from '../utils/formatBalance';

import { useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import TopUpModal from '@/react-app/components/TopUpModal';

export default function Profile() {
  const { user: telegramUser } = useTelegramAuth();
  const { balance, updateBalance } = useBalance();
  const navigate = useNavigate();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const userFriendlyAddress = useTonAddress();
  const balanceTextRef = useRef<HTMLDivElement>(null);
  const [buttonPosition, setButtonPosition] = useState(78);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [activeInventoryInfoOverlay, setActiveInventoryInfoOverlay] = useState<number | null>(null);
  const [activeInventoryOverlay, setActiveInventoryOverlay] = useState<number | null>(null);
  const [sellingItems, setSellingItems] = useState<Set<number>>(new Set());
  const [showSellConfirmModal, setShowSellConfirmModal] = useState(false);
  const [itemToSell, setItemToSell] = useState<{id: number, name: string, price: number} | null>(null);
  const [showSellAllConfirmModal, setShowSellAllConfirmModal] = useState(false);
  const [sellAllStatus, setSellAllStatus] = useState<'confirming' | 'selling' | 'sold'>('confirming');
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  
  const [referralStats, setReferralStats] = useState({
    referralCode: null as string | null,
    invitedCount: 0,
    earnedAmount: '0.00'
  });
  
  const [userInventory, setUserInventory] = useState<Array<{
    id: number;
    gift_name: string;
    gift_icon: string;
    gift_background: string;
    gift_price: number;
    obtained_from: string;
    created_at: string;
  }>>([]);
  

  // Handle wallet connection
  const handleConnectWallet = () => {
    if (wallet) {
      tonConnectUI.disconnect();
    } else {
      tonConnectUI.openModal();
    }
  };

  // Сохраняем подключенный кошелек в базу данных
  useEffect(() => {
    const saveWalletToDatabase = async () => {
      if (wallet && userFriendlyAddress && telegramUser) {
        try {
          const initData = window.Telegram?.WebApp?.initData;
          if (!initData) return;

          await fetch('/api/user/save-wallet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              initData,
              walletAddress: userFriendlyAddress
            }),
          });
        } catch (error) {
          console.error('Failed to save wallet:', error);
        }
      }
    };

    saveWalletToDatabase();
  }, [wallet, userFriendlyAddress, telegramUser]);

  const handleTopUpClick = () => {
    if (wallet) {
      setIsTopUpModalOpen(true);
    } else {
      // If wallet is not connected, connect it first
      tonConnectUI.openModal();
    }
  };

  const handleBalanceUpdate = () => {
    updateBalance();
  };

  

  

  

  

  // Загружаем реферальную статистику
  const loadReferralStats = async () => {
    if (!window.Telegram?.WebApp?.initData) return;
    
    try {
      const response = await fetch('/api/user/referral-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData: window.Telegram.WebApp.initData }),
      });

      if (response.ok) {
        const data = await response.json();
        setReferralStats(data);
      }
    } catch (error) {
      console.error('Failed to load referral stats:', error);
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

  // Продать все предметы из инвентаря
  const sellAllInventoryItems = async () => {
    if (!window.Telegram?.WebApp?.initData || userInventory.length === 0) {
      return;
    }
    
    setSellAllStatus('selling');
    
    try {
      const response = await fetch('/api/user/inventory/sell-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          initData: window.Telegram.WebApp.initData
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Обновляем баланс
          updateBalance();
          
          // Очищаем локальный инвентарь
          setUserInventory([]);
          
          // Устанавливаем состояние "Продано!"
          setSellAllStatus('sold');
          
          // Закрываем модальное окно через 1.5 секунды
          setTimeout(() => {
            setShowSellAllConfirmModal(false);
            setSellAllStatus('confirming');
          }, 1500);
        } else {
          setSellAllStatus('confirming');
          alert('Не удалось продать предметы');
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to sell all items:', errorData.error);
        setSellAllStatus('confirming');
        
        if (response.status === 404) {
          alert('Нет предметов для продажи');
        } else {
          alert('Ошибка при продаже предметов');
        }
      }
    } catch (error) {
      console.error('Error selling all items:', error);
      setSellAllStatus('confirming');
      alert('Ошибка при продаже предметов');
    }
  };

  // Продать предмет из инвентаря
  const sellInventoryItem = async (itemId: number) => {
    if (!window.Telegram?.WebApp?.initData) return;
    
    // Проверяем, не продается ли уже этот предмет
    if (sellingItems.has(itemId)) {
      return; // Предмет уже в процессе продажи
    }
    
    // Проверяем, существует ли предмет в локальном инвентаре
    const itemExists = userInventory.find(item => item.id === itemId);
    if (!itemExists) {
      alert('Предмет уже был продан!');
      return;
    }
    
    // Добавляем предмет в список продающихся
    setSellingItems(prev => new Set(prev).add(itemId));
    
    try {
      const response = await fetch('/api/user/inventory/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          initData: window.Telegram.WebApp.initData,
          itemId: itemId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Обновляем баланс
          updateBalance();
          
          // Удаляем предмет из локального состояния инвентаря
          setUserInventory(prev => prev.filter(item => item.id !== itemId));
          
          // Закрываем оверлей
          setActiveInventoryOverlay(null);
          
          console.log(`Sold item for ${data.soldPrice} TON`);
        }
      } else {
        const errorData = await response.json();
        if (response.status === 404) {
          // Предмет уже продан - показываем ошибку и обновляем инвентарь
          alert('Этот предмет уже был продан!');
          
          // Удаляем предмет из локального состояния
          setUserInventory(prev => prev.filter(item => item.id !== itemId));
          
          // Закрываем оверлей
          setActiveInventoryOverlay(null);
        } else if (response.status === 409) {
          // Конфликт - предмет уже в процессе продажи
          alert('Предмет уже продается!');
        } else {
          console.error('Failed to sell item:', errorData.error);
          alert('Ошибка при продаже предмета');
        }
      }
    } catch (error) {
      console.error('Error selling item:', error);
      alert('Ошибка при продаже предмета');
    } finally {
      // Убираем предмет из списка продающихся
      setSellingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleReferralCopy = async () => {
    try {
      // Generate referral link with referral code for dashgamebot
      const referralLink = referralStats.referralCode 
        ? `https://t.me/dashgamebot?startapp=${referralStats.referralCode}`
        : `https://t.me/dashgamebot?startapp=ref_${telegramUser?.id || ''}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(referralLink);
      
      // Add haptic feedback for successful copy
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
      
      // Update state to show copied message
      setReferralCopied(true);
      
      // Text will stay until page reload/navigation
    } catch (error) {
      console.error('Failed to copy referral link:', error);
      
      // Add haptic feedback for error
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    }
  };

  const handleInviteFriend = () => {
    try {
      // Generate referral link with referral code for dashgamebot
      const referralLink = referralStats.referralCode 
        ? `https://t.me/dashgamebot?startapp=${referralStats.referralCode}`
        : `https://t.me/dashgamebot?startapp=ref_${telegramUser?.id || ''}`;
      
      // Check if Telegram WebApp is available
      if (window.Telegram?.WebApp) {
        // Use Telegram WebApp API to open share dialog
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('🎁 Привет! Нашел очень крутую аппку в которой можно выиграть подарки\n\nЗалетай по моей ссылке и лутай бонус 💰✨')}`;
        
        // Try to open the share URL using window.open
        try {
          window.open(shareUrl, '_blank');
        } catch (telegramError) {
          // Fallback: try to open with window.open
          window.open(shareUrl, '_blank');
        }
      } else {
        // Fallback for testing outside Telegram
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('🎁 Привет! Нашел очень крутую аппку в которой можно выиграть подарки\n\nЗалетай по моей ссылке и лутай бонус 💰✨')}`;
        window.open(shareUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to invite friend:', error);
    }
  };

  // Calculate button position based on balance text width
  useEffect(() => {
    if (balanceTextRef.current) {
      const textWidth = balanceTextRef.current.offsetWidth;
      // 20px (left margin) + text width + 6px (offset for proper spacing)
      setButtonPosition(20 + textWidth + 6);
    }
  }, [balance]);

  // Block page scroll when modal is open
  useEffect(() => {
    if (isTopUpModalOpen || isBannerModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isTopUpModalOpen, isBannerModalOpen]);

  // Функция для определения уровня партнерства и соответствующего изображения
  const getPartnershipLevel = () => {
    const referralCount = referralStats.invitedCount;
    const earnedAmount = Number(referralStats.earnedAmount);

    // Проверяем от высшего к низшему уровню
    if (referralCount >= 6000 || earnedAmount >= 6000) {
      return {
        image: 'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/exclusive_partner_progress.jpg',
        percentage: 50,
        level: 'Exclusive Partner'
      };
    } else if (referralCount >= 500 || earnedAmount >= 500) {
      return {
        image: 'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/diamond_partner_progress.jpg',
        percentage: 30,
        level: 'Diamond Partner'
      };
    } else if (referralCount >= 100 || earnedAmount >= 250) {
      return {
        image: 'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/premium_partner_progress.jpg',
        percentage: 18,
        level: 'Premium Partner'
      };
    } else if (referralCount >= 15 || earnedAmount >= 100) {
      return {
        image: 'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/base_partner_progress.jpg',
        percentage: 13,
        level: 'Base Partner'
      };
    } else if (referralCount >= 1 || earnedAmount >= 0) {
      return {
        image: 'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/new_partner_progress.jpg',
        percentage: 10,
        level: 'New Partner'
      };
    } else {
      return {
        image: 'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/new_partner_progress.jpg',
        percentage: 0,
        level: 'No Partner Status'
      };
    }
  };

  // Функция для расчета процента прогресса до следующего уровня
  const getProgressPercentage = () => {
    const referralCount = referralStats.invitedCount;
    const earnedAmount = Number(referralStats.earnedAmount);

    let nextReferralTarget = 0;
    let nextEarnedTarget = 0;

    // Определяем цели для следующего уровня
    if (referralCount >= 6000 || earnedAmount >= 6000) {
      // Уже максимальный уровень
      return 100;
    } else if (referralCount >= 500 || earnedAmount >= 500) {
      // Diamond Partner -> Exclusive Partner
      nextReferralTarget = 6000;
      nextEarnedTarget = 6000;
    } else if (referralCount >= 100 || earnedAmount >= 250) {
      // Premium Partner -> Diamond Partner
      nextReferralTarget = 500;
      nextEarnedTarget = 500;
    } else if (referralCount >= 15 || earnedAmount >= 100) {
      // Base Partner -> Premium Partner
      nextReferralTarget = 100;
      nextEarnedTarget = 250;
    } else {
      // New Partner -> Base Partner
      nextReferralTarget = 15;
      nextEarnedTarget = 100;
    }

    // Рассчитываем процент по рефералам и по заработку
    const referralProgress = Math.min(100, (referralCount / nextReferralTarget) * 100);
    const earnedProgress = Math.min(100, (earnedAmount / nextEarnedTarget) * 100);

    // Возвращаем больший процент
    return Math.max(referralProgress, earnedProgress);
  };

  // Load fonts and referral stats
  useEffect(() => {
    const fontFaceSemiBold = new FontFace(
      'Gilroy-SemiBold',
      'url(https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/Gilroy-SemiBold.ttf)'
    );
    
    const fontFaceBold = new FontFace(
      'Gilroy-Bold',
      'url(https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/Gilroy-Bold.ttf)'
    );
    
    fontFaceSemiBold.load().then((loadedFont) => {
      document.fonts.add(loadedFont);
    }).catch((error) => {
      console.error('Error loading Gilroy-SemiBold font:', error);
    });

    fontFaceBold.load().then((loadedFont) => {
      document.fonts.add(loadedFont);
    }).catch((error) => {
      console.error('Error loading Gilroy-Bold font:', error);
    });

    // Загружаем реферальную статистику
    loadReferralStats();
    
    // Загружаем инвентарь пользователя
    loadUserInventory();
  }, [telegramUser]);

  return (
    <div 
      className="min-h-screen text-white flex flex-col items-center" 
      style={{ 
        backgroundColor: '#060E15',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      onClick={() => {
        setActiveInventoryOverlay(null);
      }}
    >
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto flex flex-col flex-1 relative px-4">
        {/* User Avatar */}
        <div 
          className="absolute rounded-full overflow-hidden flex-shrink-0" 
          style={{ 
            width: '110px', 
            height: '110px', 
            left: '16px', 
            top: '30px' 
          }}
        >
          {telegramUser?.photo_url ? (
            <img 
              src={telegramUser.photo_url} 
              alt="Avatar" 
              className="w-full h-full object-cover flex-shrink-0"
              style={{ imageRendering: 'auto' }}
            />
          ) : (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center flex-shrink-0">
              <span className="text-gray-400 text-2xl"></span>
            </div>
          )}
        </div>
        
        {/* User Name */}
        <div 
          className="absolute text-white font-gilroy-bold whitespace-nowrap"
          style={{
            left: '141px', // 16px (avatar left) + 110px (avatar width) + 15px (offset)
            top: '66px',
            fontSize: '24px',
            maxWidth: '240px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {telegramUser?.first_name && telegramUser?.last_name 
            ? `${telegramUser.first_name} ${telegramUser.last_name}`
            : telegramUser?.first_name || telegramUser?.username || 'User'
          }
        </div>
        
        {/* User ID */}
        <div 
          className="absolute font-gilroy-semibold whitespace-nowrap"
          style={{
            left: '141px', // Same as name alignment
            top: '102px', // 66px (name top) + 24px (name font size) + 12px (offset)
            fontSize: '16px',
            color: '#445768'
          }}
        >
          #{telegramUser?.id || '0'}
        </div>

        {/* Rectangle with 20px offset from avatar */}
        <div 
          className="mx-auto relative w-full max-w-md"
          style={{
            marginTop: '160px', // 30px (avatar top) + 110px (avatar height) + 20px (offset)
            height: '90px',
            backgroundColor: '#181F25',
            borderRadius: '20px',
            border: '1px solid #303E4A'
          }}
        >
          {/* Balance text */}
          <div
            className="absolute font-gilroy-semibold"
            style={{
              left: '20px',
              top: '14px',
              fontSize: '16px',
              color: '#445768'
            }}
          >
            Баланс
          </div>
          {/* Balance amount */}
          <div
            ref={balanceTextRef}
            className="absolute font-gilroy-bold"
            style={{
              left: '20px',
              top: '38px',
              fontSize: '24px',
              color: '#FFFFFF'
            }}
          >
            {formatTonBalance(balance)}
          </div>
          {/* TON icon */}
          <img 
            src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/toncoin_active.svg"
            alt="TON" 
            className="absolute"
            style={{
              left: `${buttonPosition}px`,
              top: '42px',
              width: '23px',
              height: '23px'
            }}
          />
          {/* Button with gradient */}
          <button
            onClick={handleTopUpClick}
            className="absolute flex items-center justify-center"
            style={{
              right: '20px', // Адаптивный отступ
              top: '50%',
              transform: 'translateY(-50%)', // Center vertically
              width: '144px',
              height: '38px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #0072EE 0%, #1686FF 100%)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Gilroy-SemiBold, sans-serif',
              fontWeight: '600',
              fontSize: '14px',
              color: '#FFFFFF',
              boxShadow: '0 4px 15px rgba(0, 122, 255, 0.3)'
            }}
          >
            Пополнить
          </button>
        </div>

        {/* New button with 16px offset from rectangle */}
        <button 
          onClick={handleConnectWallet}
          className="mx-auto w-full max-w-md"
          style={{
            marginTop: '16px', // 16px offset from the rectangle above
            height: '44px',
            borderRadius: '20px',
            background: 'linear-gradient(45deg, #0067D7 0%, #1686FF 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Gilroy-Bold, sans-serif',
            fontWeight: '700',
            fontSize: '14px',
            color: '#FFFFFF'
          }}
        >
          {wallet && userFriendlyAddress
            ? `${userFriendlyAddress.slice(0, 4)}...${userFriendlyAddress.slice(-4)}`
            : 'Подключить кошелек'
          }
        </button>

        {/* New rectangle with 16px offset from wallet button */}
        <div 
          className="mx-auto relative w-full max-w-md"
          style={{
            marginTop: '16px', // 16px offset from the wallet button above
            height: '373px',
            borderRadius: '20px',
            border: '1px solid #303E4A',
            background: 'linear-gradient(225deg, #2A2A2A 0%, #181F25 84%)',
            overflow: 'hidden'
          }}
        >
          {/* Glow effect behind referrals image */}
          <div
            className="absolute"
            style={{
              right: '42px', // Positioned relative to right edge for better responsiveness
              top: '38px', // Position calculated with Y offset of 2px
              width: '182px',
              height: '182px',
              borderRadius: '50%',
              backgroundColor: '#0062EE',
              filter: 'blur(167.5px)',
              transform: 'translate(50%, -50%)',
              opacity: 1,
              zIndex: 1
            }}
          />
          {/* Text content */}
          <div
            className="absolute font-gilroy-bold text-white px-4 sm:px-6"
            style={{
              left: '0px',
              top: '20px',
              fontSize: '18px',
              color: '#FFFFFF',
              lineHeight: '26px',
              zIndex: 3,
              maxWidth: '70%'
            }}
          >
            Зарабатывай на<br />
            комиссиях и повышай<br />
            свой уровень!
          </div>
          
          {/* Two buttons with 20px offset from text */}
          <div
            className="absolute flex gap-3 sm:gap-4 px-4 sm:px-6"
            style={{
              left: '0px',
              top: '118px', // 20px (text top) + 78px (text height) + 20px (offset)
              zIndex: 3,
              width: '100%'
            }}
          >
            {/* First button */}
            <div
              className="flex-1"
              style={{
                height: '88px',
                borderRadius: '20px',
                background: 'linear-gradient(to bottom, #485C6E, #2B3842)',
                padding: '1px',
                position: 'relative',
                maxWidth: '48%'
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '19px',
                  backgroundColor: '#242E37'
                }}
              />
              <div
                className="absolute font-gilroy-semibold"
                style={{
                  left: '17px',
                  top: '17px',
                  fontSize: '13px',
                  color: '#485C6E'
                }}
              >
                Приглашено
              </div>
              <div
                className="absolute font-gilroy-bold"
                style={{
                  left: '17px',
                  top: '43px', // 17px (top) + 14px (font height) + 26px (offset) - 14px (adjustment)
                  fontSize: '22px',
                  color: '#FFFFFF'
                }}
              >
                {referralStats.invitedCount}
              </div>
            </div>
            
            {/* Second button */}
            <div
              className="flex-1"
              style={{
                height: '88px',
                borderRadius: '20px',
                background: 'linear-gradient(to bottom, #485C6E, #2B3842)',
                padding: '1px',
                position: 'relative',
                maxWidth: '48%'
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '19px',
                  backgroundColor: '#242E37'
                }}
              />
              <div
                className="absolute font-gilroy-semibold"
                style={{
                  left: '17px',
                  top: '17px',
                  fontSize: '12px',
                  color: '#485C6E'
                }}
              >
                Заработано
              </div>
              <div
                className="absolute font-gilroy-bold"
                style={{
                  left: '17px',
                  top: '43px', // 17px (top) + 14px (font height) + 26px (offset) - 14px (adjustment)
                  fontSize: '22px',
                  background: 'linear-gradient(135deg, #1686FF 0%, #169EFF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {referralStats.earnedAmount} TON
              </div>
            </div>
          </div>

          {/* Copy referral link button */}
          <button
            onClick={handleReferralCopy}
            className="absolute flex items-center justify-center cursor-pointer mx-4 sm:mx-6"
            style={{
              left: '0px',
              right: '0px',
              top: '222px', // 118px (buttons top) + 88px (button height) + 16px (offset)
              height: '44px',
              borderRadius: '20px',
              backgroundColor: '#242E37',
              border: '1px solid transparent',
              backgroundImage: 'linear-gradient(#242E37, #242E37), linear-gradient(to bottom, #485B6D, #2C3843)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              zIndex: 3
            }}
          >
            <div className="flex items-center">
              <span 
                className="font-gilroy-semibold"
                style={{
                  fontSize: '14px',
                  color: '#FFFFFF'
                }}
              >
                {referralCopied ? 'Реферальная ссылка скопирована' : 'Скопировать реф. ссылку'}
              </span>
              <div style={{ width: '6px' }} />
              {referralCopied ? (
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    fill="#4ADE80" 
                    stroke="none"
                  />
                  <path 
                    d="m8.5 12.5 2 2 5-5" 
                    stroke="#FFFFFF" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              ) : (
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" 
                    stroke="#FFFFFF" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="m14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" 
                    stroke="#FFFFFF" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </button>

          {/* Invite friend button with 16px offset from copy button */}
          <button
            onClick={handleInviteFriend}
            className="absolute flex items-center justify-center cursor-pointer mx-4 sm:mx-6"
            style={{
              left: '0px',
              right: '0px',
              top: '282px', // 222px (copy button top) + 44px (copy button height) + 16px (offset)
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(45deg, #0072EE 0%, #1686FF 100%)',
              border: 'none',
              zIndex: 3
            }}
          >
            <span 
              className="font-gilroy-bold"
              style={{
                fontSize: '16px',
                color: '#FFFFFF'
              }}
            >
              Пригласить друга
            </span>
          </button>

          {/* Referrals image in top right corner */}
          <img 
            src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/referrals.png"
            alt="Referrals"
            className="absolute top-0 right-0"
            style={{
              width: '133px',
              height: '127px',
              borderTopRightRadius: '20px',
              zIndex: 2
            }}
          />
        </div>

        {/* Banner section */}
        <div 
          className="mx-auto relative w-full max-w-md cursor-pointer"
          style={{
            marginTop: '16px',
            height: '156px',
            backgroundColor: '#181F25',
            borderRadius: '20px',
            border: '1px solid #303E4A',
            overflow: 'hidden'
          }}
          onClick={() => setIsBannerModalOpen(true)}
        >
          <img 
            src={getPartnershipLevel().image}
            alt={getPartnershipLevel().level}
            className="w-full h-full object-cover"
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          />
          {/* Progress text and progress bar - only show if not exclusive partner */}
          {getPartnershipLevel().level !== 'Exclusive Partner' && (
            <>
              <div
                className="absolute font-gilroy-semibold"
                style={{
                  bottom: '43px', // 24px (rectangle bottom) + 16px (rectangle height) + 3px (offset)
                  right: '50%',
                  transform: 'translateX(166px)', // Half of rectangle width (332px / 2)
                  fontSize: '16px',
                  color: '#FFFFFF'
                }}
              >
                {Math.round(getProgressPercentage())}%
              </div>
              
              {/* White overlay rectangle */}
              <div
                className="absolute"
                style={{
                  bottom: '24px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '332px',
                  height: '16px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  mixBlendMode: 'overlay'
                }}
              />
              
              {/* Progress bar */}
              <div
                className="absolute"
                style={{
                  bottom: '24px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: `${(getProgressPercentage() / 100) * 332}px`,
                  height: '16px',
                  borderRadius: '20px',
                  backgroundColor: (() => {
                    const level = getPartnershipLevel().level;
                    switch (level) {
                      case 'New Partner': return '#17A6FF';
                      case 'Base Partner': return '#FF11F9';
                      case 'Premium Partner': return '#BFC8E2';
                      case 'Diamond Partner': return '#62E1FF';
                      default: return '#17A6FF';
                    }
                  })(),
                  opacity: 0.8,
                  marginLeft: `${-166 + (getProgressPercentage() / 100) * 332 / 2}px`
                }}
              />
            </>
          )}
        </div>

        {/* Inventory display section */}
        <div 
          className="mx-auto relative w-full max-w-md"
          style={{
            marginTop: '16px',
            minHeight: '200px',
            backgroundColor: '#181F25',
            borderRadius: '20px',
            border: '1px solid #303E4A',
            padding: '16px'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div
              className="font-gilroy-bold text-white"
              style={{
                fontSize: '20px',
                color: '#FFFFFF'
              }}
            >
              Ваш инвентарь
            </div>
            {userInventory.length > 0 && (
              <button
                onClick={() => setShowSellAllConfirmModal(true)}
                className="font-gilroy-semibold flex items-center justify-center absolute"
                style={{
                  width: '153px', // Ширина как у квадратов инвентаря
                  height: '30px',
                  borderRadius: '15px',
                  background: 'linear-gradient(135deg, #0072EE 0%, #1686FF 100%)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#FFFFFF',
                  left: '181px', // Позиция как второй квадрат: 153px (ширина первого) + 12px (gap) + 16px (padding блока)
                  top: '16px' // Выравнивание по уровню заголовка
                }}
              >
                Продать все
              </button>
            )}
          </div>

          {/* Inventory items */}
          {userInventory.length > 0 ? (
            <div className="flex flex-wrap justify-center" style={{ gap: '12px' }}>
              {userInventory.map((item, index) => (
                <div
                  key={index}
                  className="relative flex items-center justify-center cursor-pointer"
                  style={{
                    width: '153px',
                    height: '153px',
                    background: 'linear-gradient(45deg, #161D24 0%, #1B232B 100%)',
                    borderRadius: '20px',
                    border: '1px solid #303E4A',
                    backgroundImage: item.gift_background ? `url(${item.gift_background})` : 'none',
                    backgroundSize: '153px 153px',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle overlay - close if already open, open if closed
                    if (activeInventoryOverlay === index) {
                      setActiveInventoryOverlay(null);
                    } else {
                      setActiveInventoryOverlay(index);
                      setActiveInventoryInfoOverlay(null); // Close info overlay if open
                    }
                  }}
                >
                  {item.gift_icon && (
                    <img 
                      src={item.gift_icon}
                      alt={item.gift_name}
                      style={{
                        width: '104.7px',
                        height: '104.7px',
                        objectFit: 'contain',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                      }}
                    />
                  )}
                  
                  {/* Main inventory overlay */}
                  {activeInventoryOverlay === index && (
                    <div
                      className="absolute"
                      style={{
                        bottom: '0px',
                        right: '0px',
                        left: '0px',
                        height: '85px',
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        backdropFilter: 'blur(3.5px)',
                        WebkitBackdropFilter: 'blur(3.5px)',
                        borderRadius: '20px',
                        zIndex: 30
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* First button */}
                      <div
                        className={`absolute flex items-center justify-center ${
                          sellingItems.has(item.id) ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        style={{
                          top: '9.1px',
                          left: '9.1px',
                          width: '134.9px',
                          height: '31.2px',
                          borderRadius: '20px',
                          background: sellingItems.has(item.id) 
                            ? 'linear-gradient(135deg, #666666 0%, #999999 100%)'
                            : 'linear-gradient(135deg, #0072EE 0%, #1686FF 100%)',
                          border: 'none',
                          opacity: sellingItems.has(item.id) ? 0.5 : 1
                        }}
                      >
                        <span 
                          className="font-gilroy-semibold"
                          style={{
                            fontSize: '13px',
                            color: '#FFFFFF',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none'
                          }}
                        >
                          Вывести
                        </span>
                      </div>
                      
                      {/* Second button */}
                      <div
                        className={`absolute flex items-center justify-center ${
                          sellingItems.has(item.id) ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        style={{
                          top: '44.3px',
                          left: '9.1px',
                          width: '132.9px',
                          height: '31.2px',
                          borderRadius: '20px',
                          background: sellingItems.has(item.id) 
                            ? 'linear-gradient(135deg, #666666 0%, #999999 100%)'
                            : 'linear-gradient(135deg, #0072EE 0%, #1686FF 100%)',
                          border: 'none',
                          opacity: sellingItems.has(item.id) ? 0.5 : 1
                        }}
                        onClick={sellingItems.has(item.id) ? undefined : () => {
                          setItemToSell({
                            id: item.id,
                            name: item.gift_name,
                            price: item.gift_price
                          });
                          setShowSellConfirmModal(true);
                        }}
                      >
                        <span 
                          className="font-gilroy-semibold"
                          style={{
                            fontSize: '12px',
                            color: '#FFFFFF',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none'
                          }}
                        >
                          {sellingItems.has(item.id) ? 'Продано!' : 'Продать'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Info overlay */}
                  {activeInventoryInfoOverlay === index && (
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
                          fontSize: '16px',
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
                          width: '74px',
                          height: '28px',
                          marginTop: '9px',
                          background: 'linear-gradient(135deg, #0067D7 0%, #1686FF 100%)',
                          cursor: 'pointer',
                          borderRadius: '20px'
                        }}
                      >
                        <span 
                          className="font-gilroy-bold text-white"
                          style={{
                            fontSize: '12px',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none'
                          }}
                        >
                          {item.gift_price.toFixed(2)} TON
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
                      width: '28.2px',
                      height: '28.2px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 50
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveInventoryInfoOverlay(activeInventoryInfoOverlay === index ? null : index);
                      setActiveInventoryOverlay(null); // Close main overlay if open
                    }}
                  >
                    {activeInventoryInfoOverlay === index ? (
                      <svg 
                        width="15" 
                        height="15" 
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
                        width="19" 
                        height="19" 
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
          ) : (
            <div 
              className="flex flex-col items-center justify-center"
              style={{ minHeight: '150px' }}
            >
              <div
                className="font-gilroy-semibold"
                style={{
                  fontSize: '14px',
                  textAlign: 'center'
                }}
              >
                <span style={{ color: '#445768' }}>Подарков нет, </span>
                <span style={{ color: '#1686FF' }}>но это исправимо</span>
              </div>
              
              {/* Кнопка открыть кейсы */}
              <button
                onClick={() => navigate('/cases')}
                className="font-gilroy-semibold flex items-center justify-center"
                style={{
                  marginTop: '16px',
                  width: '220px',
                  height: '44px',
                  borderRadius: '20px',
                  backgroundColor: '#1686FF',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#FFFFFF'
                }}
              >
                Открыть кейсы
              </button>
            </div>
          )}
        </div>

        {/* Rest of profile content can be added here */}
        <div className="flex-1"></div>
        
        {/* Bottom spacer to prevent footer from overlapping inventory items */}
        <div style={{ height: '120px' }}></div>

        {/* Top Up Modal */}
        <TopUpModal 
          isOpen={isTopUpModalOpen}
          onClose={() => setIsTopUpModalOpen(false)}
          onBalanceUpdate={handleBalanceUpdate}
          currentBalance={balance}
        />

        {/* Sell Confirmation Modal */}
        {showSellConfirmModal && itemToSell && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]" 
            onClick={() => setShowSellConfirmModal(false)}
          >
            <div 
              className="relative"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '306px',
                height: '122px',
                borderRadius: '20px',
                backgroundColor: '#111A21',
                border: '1px solid #303E4A'
              }}
            >
              {/* Текст подтверждения */}
              <div
                className="font-gilroy-semibold text-white"
                style={{
                  fontSize: '16px',
                  color: '#FFFFFF',
                  marginTop: '18px',
                  textAlign: 'center',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                Вы точно хотите продать подарок?
              </div>
              
              {/* Кнопки подтверждения */}
              <div
                className="flex justify-center"
                style={{
                  marginTop: '18px',
                  gap: '18px'
                }}
              >
                {/* Первая кнопка - Да */}
                <button
                  onClick={() => {
                    setShowSellConfirmModal(false);
                    if (itemToSell) {
                      sellInventoryItem(itemToSell.id);
                      setItemToSell(null);
                    }
                  }}
                  className="font-gilroy-semibold flex items-center justify-center"
                  style={{
                    width: '125px',
                    height: '44px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #0072EE 0%, #1686FF 100%)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#FFFFFF',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                >
                  Да
                </button>
                
                {/* Вторая кнопка - Отмена */}
                <button
                  onClick={() => {
                    setShowSellConfirmModal(false);
                    setItemToSell(null);
                  }}
                  className="font-gilroy-semibold flex items-center justify-center"
                  style={{
                    width: '125px',
                    height: '44px',
                    borderRadius: '20px',
                    backgroundColor: '#1D252C',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#FFFFFF',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sell All Confirmation Modal */}
        {showSellAllConfirmModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]" 
            onClick={() => {
              setShowSellAllConfirmModal(false);
              setSellAllStatus('confirming');
            }}
          >
            <div 
              className="relative flex flex-col"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '306px',
                minHeight: 'fit-content',
                borderRadius: '20px',
                backgroundColor: '#111A21',
                border: '1px solid #303E4A',
                padding: '20px'
              }}
            >
              {/* Текст подтверждения */}
              <div
                className="font-gilroy-semibold"
                style={{
                  fontSize: '16px',
                  textAlign: 'center',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  marginBottom: '20px'
                }}
              >
                <span style={{ color: '#FFFFFF' }}>
                  Вы уверены что хотите продать все свои подарки за{' '}
                </span>
                <span style={{ color: '#1686FF' }}>
                  {userInventory.reduce((total, item) => total + item.gift_price, 0).toFixed(2)} TON
                </span>
                <span style={{ color: '#FFFFFF' }}>?</span>
              </div>
              
              {/* Кнопки подтверждения */}
              <div
                className="flex justify-center"
                style={{
                  gap: '18px'
                }}
              >
                {/* Первая кнопка - Да */}
                <button
                  onClick={sellAllStatus === 'confirming' ? sellAllInventoryItems : undefined}
                  disabled={sellAllStatus !== 'confirming'}
                  className="font-gilroy-semibold flex items-center justify-center"
                  style={{
                    width: '125px',
                    height: '44px',
                    borderRadius: '20px',
                    background: sellAllStatus === 'confirming' 
                      ? 'linear-gradient(135deg, #0072EE 0%, #1686FF 100%)'
                      : '#303E4A',
                    border: 'none',
                    cursor: sellAllStatus === 'confirming' ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                    color: '#FFFFFF',
                    opacity: sellAllStatus === 'confirming' ? 1 : 0.5,
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                >
                  {sellAllStatus === 'selling' ? 'Продаем...' : sellAllStatus === 'sold' ? 'Продано!' : 'Да'}
                </button>
                
                {/* Вторая кнопка - Отмена */}
                <button
                  onClick={sellAllStatus === 'confirming' ? () => setShowSellAllConfirmModal(false) : undefined}
                  disabled={sellAllStatus !== 'confirming'}
                  className="font-gilroy-semibold flex items-center justify-center"
                  style={{
                    width: '125px',
                    height: '44px',
                    borderRadius: '20px',
                    backgroundColor: sellAllStatus === 'confirming' ? '#1D252C' : '#303E4A',
                    border: 'none',
                    cursor: sellAllStatus === 'confirming' ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                    color: '#FFFFFF',
                    opacity: sellAllStatus === 'confirming' ? 1 : 0.5,
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner Modal */}
        {isBannerModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[60] overflow-hidden" 
            onClick={() => setIsBannerModalOpen(false)}
          >
            <div 
              className="mx-4 relative overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '380px',
                maxHeight: '90vh',
                minHeight: '200px',
                backgroundColor: '#111A21',
                borderRadius: '20px'
              }}
            >
              {/* Кнопка закрытия */}
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="absolute cursor-pointer"
                style={{
                  top: '16px',
                  right: '16px',
                  width: '31px',
                  height: '31px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none'
                }}
              >
                <svg 
                  width="13" 
                  height="13" 
                  viewBox="0 0 10 10" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M8.5 1.5L1.5 8.5M1.5 1.5L8.5 8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              
              {/* Заголовок модального окна */}
              <div 
                className="flex justify-center"
                style={{
                  marginTop: '14px',
                  marginBottom: '22px'
                }}
              >
                <h2 
                  className="font-gilroy-semibold text-white"
                  style={{
                    fontSize: '20px'
                  }}
                >
                  Уровни реф. системы
                </h2>
              </div>

              {/* Баннеры партнерских уровней */}
              <div 
                style={{
                  padding: '0 16px',
                  paddingBottom: '20px'
                }}
              >
                {/* New Partner */}
                <img 
                  src="https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/new_partner.jpg"
                  alt="New Partner"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '20px',
                    marginBottom: '16px',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                />

                {/* Base Partner */}
                <img 
                  src="https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/base_partner.jpg"
                  alt="Base Partner"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '20px',
                    marginBottom: '16px',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                />

                {/* Premium Partner */}
                <img 
                  src="https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/premium_partner.jpg"
                  alt="Premium Partner"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '20px',
                    marginBottom: '16px',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                />

                {/* Diamond Partner */}
                <img 
                  src="https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/diamond_partner.jpg"
                  alt="Diamond Partner"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '20px',
                    marginBottom: '16px',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                />

                {/* Exclusive Partner */}
                <img 
                  src="https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/exclusive_partner.jpg"
                  alt="Exclusive Partner"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '20px',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Footer currentPage="profile" isModalOpen={isTopUpModalOpen} />
    </div>
  );
}
