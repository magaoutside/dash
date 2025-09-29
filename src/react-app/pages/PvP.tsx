import { useState, useEffect } from 'react';
import Footer from '@/react-app/components/Footer';
import UserHeader from '@/react-app/components/UserHeader';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { formatGiftPrice } from '@/react-app/utils/formatGiftPrice';
import { formatPvpBetAmount } from '@/react-app/utils/formatPvpBetAmount';
import { useNavigate } from 'react-router';

export default function PvP() {
  const { user: telegramUser } = useTelegramAuth();
  const navigate = useNavigate();
  const [isAddGiftsModalOpen, setIsAddGiftsModalOpen] = useState(false);
  const [activeInfoOverlay, setActiveInfoOverlay] = useState<number | null>(null);
  const [selectedGifts, setSelectedGifts] = useState<number[]>([]);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [gameParticipants, setGameParticipants] = useState<any[]>([]);
  const [userInventory, setUserInventory] = useState<Array<{
    id: number;
    gift_name: string;
    gift_icon: string;
    gift_background: string;
    gift_price: number;
    obtained_from: string;
    created_at: string;
  }>>([]);
  const [countdown, setCountdown] = useState<number>(0);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [arrowRotation, setArrowRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [gameWinner, setGameWinner] = useState<any>(null);
  const [latestGameResult, setLatestGameResult] = useState<any>(null);
  const [lastOptimisticUpdate, setLastOptimisticUpdate] = useState<number>(0);
  const [shouldStartAnimation, setShouldStartAnimation] = useState(false);
  const [processedGameId, setProcessedGameId] = useState<number | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Массив цветов для игроков
  const playerColors = [
    '#11FB72', '#8211FB', '#11C8FB', '#1181FB', '#11FBFB', '#FBD811', '#FB5711', '#FF2D2D', '#FF2DAB', '#59FFB7',
    '#F9FF59', '#FFC0CB', '#FFB6C1', '#FFE4E1', '#FFDAB9', '#F08080', '#FA8072', '#FFA07A', '#CD5C5C', '#DB4646',
    '#D8EDFF', '#FFA500', '#FFD700', '#FFFF00', '#FFFACD', '#FAFAD2', '#EEE8AA', '#F5DEB3', '#FFDEAD', '#FFB14D',
    '#DEB887', '#BC8F8F', '#98FB98', '#87CEEB', '#87CEFA', '#90EE90', '#00FF7F', '#3CB371', '#66CDAA', '#2E8B57',
    '#7FFFD4', '#AFEEEE', '#F0FFF0', '#00BFFF', '#B0E0E6', '#4682B4', '#778899', '#B0C4DE', '#E6E6FA', '#E0B0FF',
    '#D8BFD8', '#DDA0DD', '#EE82EE', '#DA70D6', '#DCDCDC', '#FAF0E6', '#FFFAFA', '#F5F5DC'
  ];

  // Функция для получения цвета игрока по индексу
  const getPlayerColor = (index: number) => {
    return playerColors[index % playerColors.length];
  };

  // Функция для обрезки имени пользователя
  const getTruncatedName = (name: string) => {
    if (!name) return 'Us...';
    return name.slice(0, 2) + '...';
  };

  

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

  // Загружаем текущую игру и участников
  const loadCurrentGame = async (skipOptimisticCheck = false) => {
    try {
      const response = await fetch('/api/pvp/current-game');
      
      if (response.ok) {
        const data = await response.json();
        
        // Проверяем, был ли недавний оптимистический апдейт (менее 1.5 секунд назад)
        const timeSinceLastUpdate = Date.now() - lastOptimisticUpdate;
        
        if (!skipOptimisticCheck && timeSinceLastUpdate < 1500) {
          // При недавнем оптимистическом апдейте обновляем только критически важные данные игры
          // (состояние таймера), но не список участников, чтобы избежать мерцания прогресс баров
          if (data.game) {
            setCurrentGame(prev => prev ? {
              ...prev,
              countdown_remaining: data.game.countdown_remaining,
              countdown_active: data.game.countdown_active,
              countdown_start_time: data.game.countdown_start_time,
              server_time: data.game.server_time,
              total_bet_amount: data.game.total_bet_amount,
              total_participants: data.game.total_participants,
              winner_id: data.game.winner_id,
              final_arrow_angle: data.game.final_arrow_angle
            } : data.game);
          }
        } else {
          // Полное обновление если оптимистический апдейт был давно или его не было
          setCurrentGame(data.game);
          setGameParticipants(data.participants || []);
          
          // Если данные игры кардинально изменились (новая игра), сбрасываем локальное состояние
          if (data.game && data.game.id !== currentGame?.id) {
            setIsSpinning(false);
            setShowResult(false);
            setGameWinner(null);
            setArrowRotation(0);
            setShouldStartAnimation(false);
            setIsCountdownActive(false);
            setCountdown(0);
            setLastOptimisticUpdate(0);
            setProcessedGameId(null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load current game:', error);
    }
  };

  // Загружаем последний результат игры
  const loadLatestGameResult = async () => {
    try {
      const response = await fetch('/api/pvp/latest-result');
      
      if (response.ok) {
        const data = await response.json();
        setLatestGameResult(data.result);
      }
    } catch (error) {
      console.error('Failed to load latest game result:', error);
    }
  };

  // Функция пересчета процентов для всех участников
  const recalculateWinPercentages = (participants: any[]) => {
    const totalBetAmount = participants.reduce((sum, p) => sum + (p.bet_amount || 0), 0);
    
    if (totalBetAmount === 0) {
      return participants.map(p => ({ ...p, win_percentage: 0 }));
    }
    
    return participants.map(p => ({
      ...p,
      win_percentage: totalBetAmount > 0 ? (p.bet_amount / totalBetAmount) * 100 : 0
    }));
  };

  // Присоединиться к игре
  const joinGame = async () => {
    if (!window.Telegram?.WebApp?.initData || selectedGifts.length === 0 || isJoining) return;
    
    setIsJoining(true);
    
    // Получаем выбранные предметы для мгновенного обновления UI
    const selectedItems = userInventory.filter(item => selectedGifts.includes(item.id));
    
    // Мгновенно обновляем инвентарь, удаляя выбранные предметы
    setUserInventory(prev => prev.filter(item => !selectedGifts.includes(item.id)));
    
    // Мгновенно обновляем участников игры (добавляем/обновляем текущего пользователя)
    const totalBetAmount = selectedItems.reduce((sum, item) => sum + item.gift_price, 0);
    const currentUserId = window.Telegram.WebApp.initDataUnsafe.user?.id?.toString() || '';
    
    // Проверяем, есть ли уже этот пользователь в игре
    const existingParticipantIndex = gameParticipants.findIndex(p => p.user_id === currentUserId);
    
    let updatedParticipants;
    
    if (existingParticipantIndex >= 0) {
      // Обновляем существующего участника
      updatedParticipants = [...gameParticipants];
      updatedParticipants[existingParticipantIndex] = {
        ...updatedParticipants[existingParticipantIndex],
        bet_amount: updatedParticipants[existingParticipantIndex].bet_amount + totalBetAmount,
        item_count: updatedParticipants[existingParticipantIndex].item_count + selectedItems.length,
        items: [...(updatedParticipants[existingParticipantIndex].items || []), ...selectedItems].slice(0, 5)
      };
    } else {
      // Добавляем нового участника
      const newParticipant = {
        id: Date.now(), // Временный ID
        user_id: currentUserId,
        user_data: JSON.stringify(window.Telegram.WebApp.initDataUnsafe.user),
        user: window.Telegram.WebApp.initDataUnsafe.user,
        bet_amount: totalBetAmount,
        item_count: selectedItems.length,
        items: selectedItems.slice(0, 5),
        win_percentage: 0
      };
      updatedParticipants = [...gameParticipants, newParticipant];
    }
    
    // Пересчитываем проценты для всех участников с новыми ставками
    const participantsWithCorrectPercentages = recalculateWinPercentages(updatedParticipants);
    setGameParticipants(participantsWithCorrectPercentages);

    // Обновляем данные игры
    if (currentGame) {
      const newTotalBetAmount = (currentGame.total_bet_amount || 0) + totalBetAmount;
      const newTotalParticipants = existingParticipantIndex >= 0 ? currentGame.total_participants : (currentGame.total_participants || 0) + 1;
      
      setCurrentGame((prev: any) => prev ? {
        ...prev,
        total_bet_amount: newTotalBetAmount,
        total_participants: newTotalParticipants
      } : null);
    }
    
    // Отмечаем время оптимистического обновления
    setLastOptimisticUpdate(Date.now());
    
    // Закрываем модальное окно моментально
    setIsAddGiftsModalOpen(false);
    setActiveInfoOverlay(null);
    setSelectedGifts([]);
    
    // Отправляем запрос на сервер в фоне
    try {
      const response = await fetch('/api/pvp/join-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          initData: window.Telegram.WebApp.initData,
          selectedGiftIds: selectedGifts
        }),
      });

      if (response.ok) {
        // Успешно добавлены на сервере - только обновляем инвентарь
        loadUserInventory();
        setIsJoining(false);
      } else {
        const errorData = await response.json();
        // В случае ошибки возвращаем предметы в инвентарь и откатываем изменения UI
        setUserInventory(prev => [...prev, ...selectedItems]);
        
        // Откатываем изменения участников
        if (existingParticipantIndex >= 0) {
          const restoredParticipants = [...gameParticipants];
          restoredParticipants[existingParticipantIndex] = {
            ...restoredParticipants[existingParticipantIndex],
            bet_amount: restoredParticipants[existingParticipantIndex].bet_amount - totalBetAmount,
            item_count: restoredParticipants[existingParticipantIndex].item_count - selectedItems.length,
            items: restoredParticipants[existingParticipantIndex].items?.slice(0, -selectedItems.length) || []
          };
          const participantsWithCorrectPercentages = recalculateWinPercentages(restoredParticipants);
          setGameParticipants(participantsWithCorrectPercentages);
        } else {
          const restoredParticipants = gameParticipants.slice(0, -1);
          const participantsWithCorrectPercentages = recalculateWinPercentages(restoredParticipants);
          setGameParticipants(participantsWithCorrectPercentages);
        }
        
        // Откатываем изменения игры
        if (currentGame) {
          const restoredTotalBetAmount = (currentGame.total_bet_amount || 0) - totalBetAmount;
          const restoredTotalParticipants = existingParticipantIndex >= 0 ? currentGame.total_participants : (currentGame.total_participants || 1) - 1;
          
          setCurrentGame((prev: any) => prev ? {
            ...prev,
            total_bet_amount: restoredTotalBetAmount,
            total_participants: restoredTotalParticipants
          } : null);
        }
        
        // Сбрасываем время оптимистического обновления в случае ошибки
        setLastOptimisticUpdate(0);
        setIsJoining(false);
        
        alert(errorData.error || 'Ошибка при присоединении к игре');
      }
    } catch (error) {
      console.error('Failed to join game:', error);
      // В случае ошибки возвращаем предметы в инвентарь и откатываем изменения UI
      setUserInventory(prev => [...prev, ...selectedItems]);
      
      // Откатываем изменения участников
      if (existingParticipantIndex >= 0) {
        const restoredParticipants = [...gameParticipants];
        restoredParticipants[existingParticipantIndex] = {
          ...restoredParticipants[existingParticipantIndex],
          bet_amount: restoredParticipants[existingParticipantIndex].bet_amount - totalBetAmount,
          item_count: restoredParticipants[existingParticipantIndex].item_count - selectedItems.length,
          items: restoredParticipants[existingParticipantIndex].items?.slice(0, -selectedItems.length) || []
        };
        const participantsWithCorrectPercentages = recalculateWinPercentages(restoredParticipants);
        setGameParticipants(participantsWithCorrectPercentages);
      } else {
        const restoredParticipants = gameParticipants.slice(0, -1);
        const participantsWithCorrectPercentages = recalculateWinPercentages(restoredParticipants);
        setGameParticipants(participantsWithCorrectPercentages);
      }
      
      // Откатываем изменения игры
      if (currentGame) {
        const restoredTotalBetAmount = (currentGame.total_bet_amount || 0) - totalBetAmount;
        const restoredTotalParticipants = existingParticipantIndex >= 0 ? currentGame.total_participants : (currentGame.total_participants || 1) - 1;
        
        setCurrentGame((prev: any) => prev ? {
          ...prev,
          total_bet_amount: restoredTotalBetAmount,
          total_participants: restoredTotalParticipants
        } : null);
      }
      
      // Сбрасываем время оптимистического обновления в случае ошибки
      setLastOptimisticUpdate(0);
      setIsJoining(false);
      
      alert('Ошибка при присоединении к игре');
    }
  };

  // Форматирование времени в MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Управление таймером на основе серверных данных (полная синхронизация с сервером)
  useEffect(() => {
    if (currentGame && !isSpinning && !showResult && !shouldStartAnimation) {
      // Синхронизируемся с серверным состоянием - используем только серверные данные
      const serverCountdown = currentGame.countdown_remaining || 0;
      const serverIsActive = currentGame.countdown_active || false;
      
      // Всегда устанавливаем время точно как на сервере
      setCountdown(serverCountdown);
      setIsCountdownActive(serverIsActive);
      
      // Проверяем завершение игры на сервере
      if (currentGame.final_arrow_angle && currentGame.winner_id && gameParticipants.length >= 2 && processedGameId !== currentGame.id) {
        // Игра завершена на сервере, но анимация еще не запущена для этой игры
        setShouldStartAnimation(true);
        setProcessedGameId(currentGame.id);
      }
    } else if (gameParticipants.length < 2) {
      // Участников меньше 2 - сбрасываем таймер и флаг анимации
      setIsCountdownActive(false);
      setCountdown(0);
      setShouldStartAnimation(false);
    }
  }, [currentGame?.countdown_remaining, currentGame?.countdown_active, currentGame?.final_arrow_angle, currentGame?.winner_id, gameParticipants.length, isSpinning, showResult, shouldStartAnimation, processedGameId]);

  // Отдельный эффект для запуска анимации без конфликтов с серверными обновлениями
  useEffect(() => {
    if (shouldStartAnimation && gameParticipants.length >= 2 && !isSpinning && !showResult) {
      setShouldStartAnimation(false);
      startSpinAnimation();
    }
  }, [shouldStartAnimation, gameParticipants.length, isSpinning, showResult]);

  // Функция запуска анимации стрелочки
  const startSpinAnimation = async () => {
    if (gameParticipants.length < 2 || !currentGame || !currentGame.final_arrow_angle) return;
    
    setIsSpinning(true);
    setShowResult(false);
    
    try {
      const finalAngle = currentGame.final_arrow_angle;
      
      // Calculate total rotation (multiple full rotations + server-determined final position)
      const fullRotations = 5; // Number of full spins
      const totalRotation = fullRotations * 360 + finalAngle;
      
      setArrowRotation(totalRotation);
      
      // Stop spinning after animation completes and show result
      setTimeout(async () => {
        setIsSpinning(false);
        
        // Получаем победителя с сервера (уже определен серверно)
        const winner = gameParticipants.find(p => p.user_id === currentGame?.winner_id) || null;
        setGameWinner(winner);
        setShowResult(true);
        
        console.log('PvP Game Result:', {
          finalAngle,
          winnerId: currentGame.winner_id,
          winnerFound: winner,
          participants: gameParticipants.map(p => ({ 
            user_id: p.user_id, 
            name: p.user?.first_name || p.user?.username,
            percentage: p.win_percentage 
          }))
        });
        
        // Завершаем игру на сервере (любой клиент может вызвать, но результат создается только один раз)
        if (winner && currentGame) {
          try {
            await fetch('/api/pvp/complete-game', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                gameId: currentGame.id,
                winnerId: winner.user_id
              }),
            });
            
            // Если это победитель - обновляем инвентарь
            if (winner.user_id === telegramUser?.id?.toString()) {
              loadUserInventory();
            }
            
            // Загружаем новый результат игры
            loadLatestGameResult();
          } catch (error) {
            console.error('Failed to complete game:', error);
          }
        }
        
        // Плавно доворачиваем стрелку до 0 градусов кратчайшим путем
        setTimeout(() => {
          const currentAngle = totalRotation % 360;
          let targetRotation = totalRotation;
          if (currentAngle > 180) {
            targetRotation = totalRotation + (360 - currentAngle);
          } else {
            targetRotation = totalRotation - currentAngle;
          }
          setArrowRotation(targetRotation);
        }, 100);
        
        // Hide result after 3 seconds and reset for next game
        setTimeout(() => {
          setShowResult(false);
          setGameWinner(null);
          setArrowRotation(0);
          setShouldStartAnimation(false);
          setIsCountdownActive(false);
          setCountdown(0);
          // Сбрасываем время оптимистического обновления и загружаем новую игру
          setLastOptimisticUpdate(0);
          // НЕ сбрасываем processedGameId здесь - он сбросится при загрузке новой игры
          loadCurrentGame(true);
        }, 3000);
      }, 6000);
      
    } catch (error) {
      console.error('Failed to start spin animation:', error);
      setIsSpinning(false);
    }
  };

  

  useEffect(() => {
    loadUserInventory();
    loadCurrentGame();
    loadLatestGameResult();
    
    // Обновляем данные игры каждую секунду для точной синхронизации таймера
    const interval = setInterval(() => {
      // Всегда загружаем игру для получения актуального состояния таймера
      // Логика блокировки обновлений встроена в loadCurrentGame
      loadCurrentGame(false);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [telegramUser, lastOptimisticUpdate]);

  // Calculate if app is in locked state
  const isAppLocked = isSpinning || showResult;

  return (
    <div className="min-h-screen text-white flex flex-col items-center" style={{ backgroundColor: '#060E15' }}>
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl flex flex-col">
        <div className="mb-0">
          <UserHeader onModalStateChange={() => {}} isLocked={isAppLocked} />
        </div>
        
        {/* Прямоугольники PvP */}
        <div className="flex justify-center space-x-4 px-4">
          <div 
            className="rounded-[20px] flex items-center justify-center cursor-pointer"
            style={{
              width: '94px',
              height: '44px',
              backgroundColor: '#1D252C'
            }}
            onClick={() => navigate('/pvp-history')}
          >
            <div className="flex items-center">
              <img 
                src="https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/history.svg"
                alt="История"
                style={{
                  width: '18px',
                  height: '18px'
                }}
              />
              <span 
                className="font-gilroy-bold text-white"
                style={{
                  fontSize: '10px',
                  marginLeft: '10px'
                }}
              >
                История
              </span>
            </div>
          </div>
          <div 
            className="rounded-[20px] relative"
            style={{
              width: '159px',
              height: '44px',
              backgroundColor: '#1D252C'
            }}
          >
            {/* Левая часть с текстом */}
            <div 
              className="absolute left-0 top-0 flex items-center justify-center"
              style={{
                width: '79.5px',
                height: '44px'
              }}
            >
              <span 
                className="font-gilroy-bold text-white"
                style={{
                  fontSize: '14px',
                  color: '#FFFFFF'
                }}
              >
                {currentGame?.total_participants || 0} Gifts
              </span>
            </div>
            
            {/* Разделительная линия */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                width: '0.5px',
                height: '22px',
                backgroundColor: '#303E4A'
              }}
            />
            
            {/* Правая часть с текстом */}
            <div 
              className="absolute right-0 top-0 flex items-center justify-center"
              style={{
                width: '79.5px',
                height: '44px'
              }}
            >
              <span 
                className="font-gilroy-bold text-white"
                style={{
                  fontSize: '14px',
                  color: '#FFFFFF'
                }}
              >
                {formatPvpBetAmount(currentGame?.total_bet_amount || 0)} TON
              </span>
            </div>
          </div>
          <div 
            className="rounded-[20px] relative"
            style={{
              width: '95px',
              height: '44px',
              backgroundColor: '#1D252C'
            }}
          >
            {/* Аватарка пользователя */}
            <div 
              className="absolute rounded-full overflow-hidden"
              style={{
                left: '10px',
                top: '10px',
                width: '10px',
                height: '10px'
              }}
            >
              {latestGameResult?.winner_data?.photo_url ? (
                <img 
                  src={latestGameResult.winner_data.photo_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  style={{ imageRendering: 'auto' }}
                />
              ) : (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                  <span className="text-gray-400 text-[4px]"></span>
                </div>
              )}
            </div>
            
            {/* Текст "Пред. игра" */}
            <span 
              className="absolute font-gilroy-bold"
              style={{
                left: '10px', // Совпадает с левым краем аватарки
                top: '24px', // 10px (top аватарки) + 10px (высота аватарки) + 4px (отступ)
                fontSize: '8px',
                color: '#445768'
              }}
            >
              Пред. игра
            </span>

            {/* Ник пользователя */}
            <span 
              className="absolute font-gilroy-bold text-white"
              style={{
                left: '22px', // 10px (отступ от края) + 10px (ширина аватарки) + 2px (отступ между аватаркой и ником)
                top: '9px',
                fontSize: '8px'
              }}
            >
              {latestGameResult?.winner_data ? getTruncatedName(latestGameResult.winner_data.first_name || latestGameResult.winner_data.username) : 'Us...'}
            </span>
            
            {/* Текст TON */}
            <span 
              className="absolute font-gilroy-bold"
              style={{
                right: '10px', // Выравниваем по правому краю
                top: '9px',
                fontSize: '8px',
                color: '#1686FF'
              }}
            >
              +{latestGameResult ? formatPvpBetAmount(latestGameResult.total_bet_amount) : '0'} TON
            </span>

            {/* Текст процента */}
            <span 
              className="absolute font-gilroy-bold"
              style={{
                right: '10px', // Выравниваем по правому краю так же, как "+TON"
                top: '24px', // Та же высота что и "Пред. игра"
                fontSize: '8px',
                color: '#445768'
              }}
            >
              {latestGameResult ? latestGameResult.winner_percentage.toFixed(0) : '0'}%
            </span>
          </div>
        </div>
        
        
        
        {/* Круг с градиентом */}
        <div className="flex justify-center px-4" style={{ marginTop: '26px' }}>
          <div 
            className="flex items-center justify-center relative"
            style={{
              width: '325px',
              height: '325px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(29, 37, 44, 1) 0%, rgba(24, 31, 37, 0.05) 100%)',
              border: '15px solid #1D252C'
            }}
          >
            {/* Вращающаяся стрелочка */}
            <img 
              src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arrow.svg"
              alt="Arrow"
              style={{ 
                width: '17px', 
                height: '10px',
                position: 'absolute',
                top: 'calc(50% - 178.5px)', // Position arrow 178.5px from center (radius + 16px offset)
                left: '50%',
                transform: `translate(-50%, 0) rotate(${arrowRotation}deg)`,
                transformOrigin: '50% 178.5px', // Distance from arrow to center of circle
                transition: isSpinning 
                  ? 'transform 6s cubic-bezier(0.23, 1, 0.32, 1)' 
                  : showResult 
                    ? 'transform 2s ease-out' 
                    : 'none',
                zIndex: 10
              }}
            />
            {/* SVG для прогресс-баров */}
            {gameParticipants.length > 0 && (
              <svg
                className="absolute"
                width="325"
                height="325"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-90deg)', // Центрируем и начинаем сверху
                  pointerEvents: 'none'
                }}
              >
                {(() => {
                  const radius = 325 / 2 - 15 / 2; // Центр границы
                  const totalPercentage = gameParticipants.reduce((sum, p) => sum + (p.win_percentage || 0), 0);
                  const gapAngle = 0; // Убираем зазоры между сегментами
                  
                  // Общее количество зазоров (между сегментами)
                  const totalGaps = 0; // Нет зазоров
                  const totalGapAngle = totalGaps * gapAngle;
                  
                  // Доступный угол для прогресс-баров (360 градусов минус зазоры)
                  const availableAngle = 360 - totalGapAngle;
                  
                  let currentAngle = 0;
                  
                  return gameParticipants.map((participant, index) => {
                    const percentage = participant.win_percentage || 0;
                    const normalizedPercentage = totalPercentage > 0 ? (percentage / totalPercentage) * 100 : 0;
                    
                    // Рассчитываем угол сегмента от доступного угла
                    const segmentAngle = (normalizedPercentage / 100) * availableAngle;
                    
                    const startAngle = currentAngle;
                    const endAngle = startAngle + segmentAngle;
                    
                    // Вычисляем координаты дуги
                    const startX = 325/2 + radius * Math.cos((startAngle * Math.PI) / 180);
                    const startY = 325/2 + radius * Math.sin((startAngle * Math.PI) / 180);
                    const endX = 325/2 + radius * Math.cos((endAngle * Math.PI) / 180);
                    const endY = 325/2 + radius * Math.sin((endAngle * Math.PI) / 180);
                    
                    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                    
                    const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
                    
                    // Переходим к следующему сегменту (угол сегмента + зазор)
                    currentAngle = endAngle + gapAngle;
                    
                    return (
                      <path
                        key={participant.id}
                        d={pathData}
                        stroke={getPlayerColor(index)}
                        strokeWidth="15"
                        fill="none"
                        strokeLinecap="butt"
                        opacity={normalizedPercentage > 0 ? 1 : 0}
                      />
                    );
                  });
                })()}
              </svg>
            )}
            
            {/* Внутренний круг */}
            <div 
              className="relative"
              style={{
                width: '176px',
                height: '176px',
                borderRadius: '50%',
                backgroundColor: '#1D252C',
                border: '22px solid #060E15'
              }}
            >
              {/* Текст Ожидание... / Старт через: / Результат */}
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 font-gilroy-semibold"
                style={{
                  top: '43px',
                  fontSize: '14px',
                  color: '#445768',
                  whiteSpace: 'nowrap'
                }}
              >
                {showResult 
                  ? 'Победитель:'
                  : isSpinning 
                    ? 'Кто же победит?'
                    : isCountdownActive 
                      ? 'Старт через:' 
                      : 'Ожидание...'
                }
              </div>
              
              {/* Текст таймера / результата */}
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 font-gilroy-bold"
                style={{
                  top: '57px',
                  fontSize: '30px',
                  color: isSpinning ? '#12FF6D' : '#1686FF',
                  textAlign: 'center'
                }}
              >
                {showResult
                  ? (gameWinner?.user?.first_name || gameWinner?.user?.username || 'User')
                  : isSpinning
                    ? 'Игра!'
                    : isCountdownActive 
                      ? formatTime(countdown) 
                      : '00:00'
                }
              </div>
            </div>
          </div>
        </div>
        
        {/* Прямоугольник с градиентом */}
        <div className="flex justify-center px-4" style={{ marginTop: '26px' }}>
          <button 
            onClick={() => !isAppLocked && !isJoining && setIsAddGiftsModalOpen(true)}
            className="relative flex items-center justify-center cursor-pointer"
            style={{
              width: '380px',
              height: '44px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0067D7 0%, #1686FF 100%)',
              border: 'none',
              opacity: (isAppLocked || isJoining) ? 0.5 : 1,
              pointerEvents: (isAppLocked || isJoining) ? 'none' : 'auto',
              transition: 'opacity 0.3s ease'
            }}
          >
            <img 
              src="https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/add_gifts.svg"
              alt="Add Gifts"
              className="absolute left-0"
              style={{
                width: '16px',
                height: '16px',
                marginLeft: '15px'
              }}
            />
            <span 
              className="font-gilroy-semibold text-white"
              style={{
                fontSize: '14px'
              }}
            >
              Добавить гифты
            </span>
          </button>
        </div>
        
        {/* Большой прямоугольник */}
        <div className="flex justify-center px-4" style={{ marginTop: '20px' }}>
          <div 
            className="relative"
            style={{
              width: '380px',
              height: '643px',
              borderRadius: '20px',
              backgroundColor: '#181F25',
              border: '1px solid #303E4A'
            }}
          >
            <span 
              className="absolute font-gilroy-bold text-white"
              style={{
                top: '26px',
                left: '26px',
                fontSize: '20px'
              }}
            >
              Игроков({gameParticipants.length})
            </span>
            <span 
              className="absolute font-gilroy-bold"
              style={{
                top: '30px',
                right: '26px',
                fontSize: '16px',
                color: '#445768'
              }}
            >
              Игра #{currentGame?.game_number || '10004'}
            </span>
            
            {/* Текст когда нет игроков */}
            {gameParticipants.length === 0 && (
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 text-center font-gilroy-semibold"
                style={{
                  top: '91px', // 26px (от верха до Игроков) + 65px отступ
                  fontSize: '14px',
                  width: '100%'
                }}
              >
                <div style={{ color: '#445768' }}>
                  Игроков пока что нет, но ты можешь
                </div>
                <div style={{ color: '#1686FF' }}>
                  стать первым!
                </div>
              </div>
            )}

            {/* Отображение участников игры */}
            {gameParticipants.length > 0 && (
              <div 
                style={{ 
                  position: 'absolute',
                  top: '91px',
                  left: '26px',
                  right: '26px',
                  maxHeight: '526px', // 643px - 91px - 26px
                  overflowY: 'auto'
                }}
              >
                {gameParticipants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="relative"
                    style={{
                      height: '126px',
                      borderRadius: '20px',
                      backgroundColor: '#1D252C',
                      border: '1px solid #303E4A',
                      marginBottom: index < gameParticipants.length - 1 ? '16px' : '0px'
                    }}
                  >
                    {/* Цветная линия игрока */}
                    <div
                      className="absolute"
                      style={{
                        left: '0px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '2px',
                        height: '87px',
                        backgroundColor: getPlayerColor(index),
                        borderRadius: '1px'
                      }}
                    />
                    {/* Аватарка пользователя */}
                    <div 
                      className="absolute rounded-full overflow-hidden"
                      style={{
                        left: '16px',
                        top: '16px',
                        width: '34px',
                        height: '34px'
                      }}
                    >
                      {participant.user?.photo_url ? (
                        <img 
                          src={participant.user.photo_url} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                          style={{ imageRendering: 'auto' }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">?</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Никнейм пользователя */}
                    <span 
                      className="absolute font-gilroy-bold text-white"
                      style={{
                        left: '58px', // 16px (отступ от края) + 34px (ширина аватарки) + 8px (отступ от аватарки)
                        top: '15px',
                        fontSize: '14px'
                      }}
                    >
                      {participant.user?.first_name || participant.user?.username || 'User'}
                    </span>
                    
                    {/* User ID */}
                    <span 
                      className="absolute font-gilroy-bold"
                      style={{
                        left: '58px', // 16px (отступ от края) + 34px (ширина аватарки) + 8px (отступ от аватарки)
                        top: '34px', // Опущен на 3 пикселя вниз с 31px
                        fontSize: '12px',
                        color: '#445768'
                      }}
                    >
                      #{participant.user?.id || '0000000000'}
                    </span>
                    
                    {/* Процент */}
                    <span 
                      className="absolute font-gilroy-bold text-white"
                      style={{
                        right: '16px', // Отступ от правого края
                        top: '19px', // Отступ сверху
                        fontSize: '14px'
                      }}
                    >
                      {participant.win_percentage ? participant.win_percentage.toFixed(2) : '0.00'}%
                    </span>
                    
                    {/* TON сумма */}
                    <span 
                      className="absolute font-gilroy-bold"
                      style={{
                        right: '16px', // Отступ от правого края
                        top: '35px', // 19px (top процента) + 8px (отступ вниз) + 8px (примерная высота текста)
                        fontSize: '12px',
                        color: '#445768'
                      }}
                    >
                      {formatPvpBetAmount(participant.bet_amount || 0)} TON
                    </span>
                    
                    {/* Выбранные подарки под аватаркой */}
                    <div 
                      className="absolute flex"
                      style={{
                        left: '16px',
                        top: '66px', // 16px (аватарка top) + 34px (высота аватарки) + 16px (отступ)
                        gap: '8px',
                        maxWidth: 'calc(100% - 32px)', // Оставляем отступы по краям
                        flexWrap: 'wrap'
                      }}
                    >
                      {participant.items?.slice(0, Math.min(5, participant.items.length)).map((item: any, itemIndex: number) => (
                        <div
                          key={item.id}
                          className="relative flex items-center justify-center"
                          style={{
                            width: '44px',
                            height: '44px',
                            background: 'linear-gradient(45deg, #161D24 0%, #1B232B 100%)',
                            borderRadius: '12px',
                            border: '1px solid #303E4A',
                            backgroundImage: item.gift_background ? `url(${item.gift_background})` : 'none',
                            backgroundSize: '44px 44px',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        >
                          {item.gift_icon && (
                            <img 
                              src={item.gift_icon}
                              alt={item.gift_name}
                              style={{
                                width: '30px',
                                height: '30px',
                                objectFit: 'contain',
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                MozUserSelect: 'none',
                                msUserSelect: 'none'
                              }}
                            />
                          )}
                          
                          {/* Оверлей для 5-го элемента при наличии дополнительных подарков */}
                          {participant.item_count > 5 && itemIndex === 4 && (
                            <div 
                              className="absolute inset-0 flex items-center justify-center"
                              style={{
                                backgroundColor: 'rgba(6, 14, 21, 0.8)',
                                borderRadius: '12px'
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
                                +{participant.item_count - 5}
                              </span>
                            </div>
                          )}
                          
                          {/* Стрелочка справа от последнего квадрата с оверлеем */}
                          {participant.item_count > 5 && itemIndex === 4 && (
                            <img 
                              src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arrow.svg"
                              alt="Arrow"
                              className="absolute"
                              style={{
                                width: '7px',
                                height: '12px',
                                left: '50px', // 44px (ширина квадрата) + 6px (отступ)
                                top: '50%',
                                transform: 'translateY(-50%) rotate(-90deg)',
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
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1"></div>
      </div>

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

      {/* Кнопка "Добавить" - показывается только когда есть выбранные подарки */}
      {isAddGiftsModalOpen && selectedGifts.length > 0 && (
        <div 
          className="fixed left-1/2 transform -translate-x-1/2 transition-all duration-150 ease-in-out"
          style={{
            bottom: '20px',
            zIndex: 80
          }}
        >
          <button 
            onClick={joinGame}
            disabled={isJoining}
            className="font-gilroy-semibold text-white"
            style={{
              width: '348px',
              height: '44px',
              borderRadius: '20px',
              background: isJoining 
                ? 'linear-gradient(135deg, #0067D7 0%, #1686FF 100%)' 
                : 'linear-gradient(135deg, #0067D7 0%, #1686FF 100%)',
              fontSize: '15px',
              border: 'none',
              cursor: isJoining ? 'not-allowed' : 'pointer',
              opacity: isJoining ? 0.8 : 1,
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              transition: 'opacity 0.2s ease'
            }}
          >
            {isJoining ? 'Добавляем...' : 'Добавить'}
          </button>
        </div>
      )}
      
      <Footer currentPage="pvp" isLocked={isAppLocked} />
    </div>
  );
}
