import Footer from '@/react-app/components/Footer';
import UserHeader from '@/react-app/components/UserHeader';
import { useNavigate } from 'react-router';
import { useState, useMemo, useEffect } from 'react';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { formatGiftPrice } from '../utils/formatGiftPrice';

interface PvPGameResult {
  id: number;
  game_id: number;
  game_number: number;
  winner_id: string;
  winner_data: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  } | null;
  winner_percentage: number;
  total_bet_amount: number;
  created_at: string;
  winner_items?: Array<{
    gift_name: string;
    gift_icon: string;
    gift_background: string;
    gift_price: number;
  }>;
}

export default function PvPHistory() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pvpHistory, setPvpHistory] = useState<PvPGameResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [glowKey, setGlowKey] = useState(0); // Key for forcing re-render
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<PvPGameResult | null>(null);
  const [activeInfoOverlay, setActiveInfoOverlay] = useState<number | null>(null);
  const { user: telegramUser } = useTelegramAuth();

  // Categories with their percentage widths
  const categories = [
    { id: 'all', label: 'Все', width: '25.8%' },
    { id: 'lucky', label: 'Везучие', width: '35.8%' },
    { id: 'bigwin', label: 'Большой куш', width: '38.4%' }
  ];

  // Load PvP history on component mount
  useEffect(() => {
    const loadPvpHistory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/pvp/history');
        const data = await response.json();
        
        if (data.history) {
          setPvpHistory(data.history);
        }
      } catch (error) {
        console.error('Failed to load PvP history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPvpHistory();
  }, []);

  // Calculate slider position
  const sliderStyle = useMemo(() => {
    const selectedIndex = categories.findIndex(c => c.id === selectedCategory);
    if (selectedIndex === -1) return { left: '0px', width: categories[0].width };

    // Calculate left position based on accumulated widths of previous blocks
    let leftPosition = '0px';
    if (selectedIndex > 0) {
      const widthsToSum = categories.slice(0, selectedIndex).map(c => c.width);
      leftPosition = `calc(${widthsToSum.join(' + ')})`;
    }

    return {
      left: leftPosition,
      width: categories[selectedIndex].width
    };
  }, [selectedCategory, categories]);

  // Handle category change with forced re-render for mobile browsers
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Force re-render of glow element to fix mobile rendering issues
    setGlowKey(prev => prev + 1);
  };

  // Handle game click to open modal
  const handleGameClick = (game: PvPGameResult) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  // Block page scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Filter history based on selected category
  const filteredHistory = useMemo(() => {
    if (selectedCategory === 'all') {
      return pvpHistory;
    } else if (selectedCategory === 'lucky') {
      // Show games where winner had lower percentage (lucky wins)
      return pvpHistory.filter(game => game.winner_percentage < 10);
    } else if (selectedCategory === 'bigwin') {
      // Show games with high bet amounts (big wins)
      return pvpHistory.filter(game => game.total_bet_amount >= 100);
    }
    return pvpHistory;
  }, [pvpHistory, selectedCategory]);
  
  return (
    <div className="min-h-screen text-white flex flex-col items-center relative" style={{ backgroundColor: '#060E15' }}>
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl flex flex-col relative">
        <div className="mb-0" style={{ zIndex: 1, position: 'relative' }}>
          <UserHeader onModalStateChange={() => {}} />
        </div>
        
        {/* Полукруг под хедером */}
        <div 
          key={`glow-${selectedCategory}-${glowKey}`}
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{
            top: '6px',
            width: '207px',
            height: '104px',
            backgroundColor: selectedCategory === 'lucky' ? '#26FF80' : selectedCategory === 'bigwin' ? '#FFC300' : '#007AFF',
            borderRadius: '0 0 103.5px 103.5px',
            filter: 'blur(50px)',
            WebkitFilter: 'blur(50px)',
            opacity: 0.4,
            zIndex: 0,
            WebkitTransform: 'translate(-50%, 0)',
            transform: 'translate(-50%, 0)',
            // Force GPU acceleration and prevent rendering issues
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            WebkitPerspective: '1000px',
            perspective: '1000px',
            // Ensure proper isolation
            isolation: 'isolate',
            // Force layer creation
            willChange: 'transform, background-color',
            // Additional mobile-specific fixes
            WebkitTransformStyle: 'preserve-3d',
            transformStyle: 'preserve-3d'
          }}
        />
        
        {/* Заголовок PvP История */}
        <div className="flex justify-center px-4 relative" style={{ marginTop: '16px', zIndex: 10 }}>
          {/* Кнопка возврата */}
          <button 
            onClick={() => navigate('/pvp')}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
            style={{
              width: '31px',
              height: '31px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              zIndex: 10
            }}
          >
            <img 
              src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arrow.svg"
              alt="Назад"
              style={{
                width: '14px',
                height: '14px',
                transform: 'rotate(90deg)' // Поворачиваем стрелку влево
              }}
            />
          </button>
          
          <h1 
            className="font-gilroy-bold text-white"
            style={{
              fontSize: '28px',
              textAlign: 'center',
              zIndex: 10,
              position: 'relative'
            }}
          >
            PvP История
          </h1>
        </div>
        
        {/* Блоки */}
        <div className="px-4" style={{ marginTop: '16px' }}>
          <div className="flex w-full relative" style={{ height: '40px', backgroundColor: '#1D252C', borderRadius: '20px' }}>
            {/* Animated slider background */}
            <div 
              className="absolute rounded-[20px] transition-all duration-300 ease-out"
              style={{
                backgroundColor: '#303E4A',
                height: '40px',
                top: '0px',
                left: sliderStyle.left,
                width: sliderStyle.width,
                willChange: 'left'
              }}
            />

            {categories.map((category, index) => (
              <div
                key={category.id}
                className="flex items-center justify-center font-gilroy-semibold text-white flex-shrink-0 relative z-10 cursor-pointer"
                style={{
                  width: category.width,
                  height: '40px',
                  fontSize: '12px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
                onClick={() => handleCategoryChange(category.id)}
              >
                {category.label}
              </div>
            ))}
          </div>
        </div>
        
        {/* История PvP игр */}
        <div className="px-4" style={{ marginTop: '16px' }}>
          {isLoading ? (
            <div className="flex justify-center items-center" style={{ height: '151px' }}>
              <div className="text-white/50 font-gilroy-semibold">Загрузка...</div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div 
              style={{
                width: '100%',
                height: '151px',
                backgroundColor: '#1D252C',
                borderRadius: '20px',
                border: '1px solid #445768',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div className="text-white/50 font-gilroy-semibold">
                {selectedCategory === 'all' ? 'История игр пуста' : 'Нет игр в этой категории'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((game, index) => (
                <div 
                  key={game.id}
                  onClick={() => handleGameClick(game)}
                  style={{
                    width: '100%',
                    height: '151px',
                    backgroundColor: '#1D252C',
                    borderRadius: '20px',
                    border: '1px solid #445768',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  {/* Аватар победителя */}
                  <div 
                    className="absolute rounded-full flex items-center justify-center overflow-hidden"
                    style={{ 
                      width: '34px', 
                      height: '34px',
                      top: '16px',
                      left: '16px',
                      backgroundColor: '#303E4A'
                    }}
                  >
                    {game.winner_data?.photo_url ? (
                      <img 
                        src={game.winner_data.photo_url} 
                        alt="Winner Avatar" 
                        className="w-full h-full object-cover rounded-full"
                        style={{ imageRendering: 'auto' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-gilroy-bold">
                          {game.winner_data?.first_name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Имя победителя */}
                  <div 
                    className="absolute font-gilroy-bold"
                    style={{
                      top: '15px',
                      left: '57px', // 16px + 34px + 7px
                      fontSize: '14px',
                      color: '#FFFFFF'
                    }}
                  >
                    {game.winner_data?.first_name || 'Неизвестный'}
                  </div>
                  
                  {/* ID победителя */}
                  <div 
                    className="absolute font-gilroy-bold"
                    style={{
                      top: '34px', // 15px + 14px + 5px
                      left: '57px', // 16px + 34px + 7px
                      fontSize: '12px',
                      color: '#445768'
                    }}
                  >
                    #{game.winner_data?.id || 'Неизвестный'}
                  </div>
                  
                  {/* Выигранные предметы под аватаркой */}
                  {game.winner_items && game.winner_items.length > 0 && (
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
                      {game.winner_items.slice(0, Math.min(6, game.winner_items.length)).map((item, itemIndex) => (
                        <div
                          key={itemIndex}
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
                          
                          {/* Оверлей для 6-го элемента при наличии дополнительных подарков */}
                          {game.winner_items && game.winner_items.length > 6 && itemIndex === 5 && (
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
                                +{game.winner_items.length - 6}
                              </span>
                            </div>
                          )}
                          
                          {/* Стрелочка справа от последнего квадрата с оверлеем */}
                          {game.winner_items && game.winner_items.length > 6 && itemIndex === 5 && (
                            <img 
                              src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arrow.svg"
                              alt="Arrow"
                              className="absolute"
                              style={{
                                width: '7px',
                                height: '12px',
                                left: '52px', // 44px (ширина квадрата) + 8px (отступ)
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
                  )}
                  
                  {/* Информация об игре */}
                  <div 
                    className="absolute font-gilroy-bold"
                    style={{
                      left: '16px',
                      top: game.winner_items && game.winner_items.length > 0 
                        ? '123px' // 66px (позиция квадратов) + 44px (высота квадратов) + 13px (отступ)
                        : '82px', // 66px (позиция где были бы квадраты) + 16px (отступ)
                      right: '15px',
                      fontSize: '10px',
                      color: '#445768'
                    }}
                  >
                    Игра #{game.game_number} · {new Date(game.created_at).toLocaleDateString('ru-RU', { 
                      day: '2-digit', 
                      month: '2-digit' 
                    })} · {new Date(game.created_at).toLocaleTimeString('ru-RU', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  
                  {/* Выигрыш */}
                  <div 
                    className="absolute font-gilroy-bold"
                    style={{
                      top: '15px',
                      right: '15px',
                      fontSize: '14px',
                      color: '#1686FF'
                    }}
                  >
                    Выиграл {game.total_bet_amount.toFixed(2)} TON
                  </div>
                  
                  {/* Процент выигрыша */}
                  <div 
                    className="absolute font-gilroy-bold"
                    style={{
                      top: '34px', // 15px + 14px + 5px
                      right: '15px',
                      fontSize: '12px',
                      color: '#445768'
                    }}
                  >
                    {game.winner_percentage.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-1"></div>
      </div>
      
      <Footer currentPage="pvp" />

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[60] overflow-hidden" 
          onClick={handleModalClose}
        >
          <div 
            className="mx-4 relative overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '380px',
              maxHeight: '90vh',
              minHeight: '634px',
              backgroundColor: '#111A21',
              borderRadius: '20px'
            }}
          >
            {/* Кнопка закрытия */}
            <button
              onClick={handleModalClose}
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
                marginTop: '17px'
              }}
            >
              <h2 
                className="font-gilroy-semibold text-white"
                style={{
                  fontSize: '20px'
                }}
              >
                Игра #{selectedGame?.game_number || '10004'}
              </h2>
            </div>

            {/* Аватарка победителя */}
            <div 
              className="absolute rounded-full flex items-center justify-center overflow-hidden"
              style={{ 
                width: '34px', 
                height: '34px',
                top: '75px', // 26px (заголовок top) + 26px (примерная высота заголовка с отступами) + 23px
                left: '16px',
                backgroundColor: '#303E4A'
              }}
            >
              {selectedGame?.winner_data?.photo_url ? (
                <img 
                  src={selectedGame.winner_data.photo_url} 
                  alt="Winner Avatar" 
                  className="w-full h-full object-cover rounded-full"
                  style={{ imageRendering: 'auto' }}
                />
              ) : (
                <div className="w-full h-full bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-gilroy-bold">
                    {selectedGame?.winner_data?.first_name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
            </div>

            {/* Имя пользователя-победителя */}
            <div 
              className="absolute font-gilroy-bold"
              style={{
                top: '73px', // 26px (заголовок top) + 20px (отступ) + 16px (дополнительный отступ) + 8px (еще увеличение) + 3px
                left: '57px', // 16px + 34px + 7px (справа от аватарки с отступом 7px)
                fontSize: '14px',
                color: '#FFFFFF'
              }}
            >
              {selectedGame?.winner_data?.first_name || 'Неизвестный'}
            </div>

            {/* ID пользователя-победителя */}
            <div 
              className="absolute font-gilroy-bold"
              style={{
                top: '92px', // 73px (позиция имени) + 14px (размер шрифта имени) + 5px (отступ)
                left: '57px', // 16px + 34px + 7px (справа от аватарки с отступом 7px)
                fontSize: '12px',
                color: '#445768'
              }}
            >
              #{selectedGame?.winner_data?.id || 'Неизвестный'}
            </div>

            {/* Выигрыш */}
            <div 
              className="absolute font-gilroy-bold"
              style={{
                top: '75px', // Такой же отступ сверху как у аватарки
                right: '16px', // Отступ 16 пикселей от правого края
                fontSize: '14px',
                color: '#1686FF'
              }}
            >
              Выиграл {selectedGame?.total_bet_amount?.toFixed(2) || '0.00'} TON
            </div>

            {/* Процент выигрыша */}
            <div 
              className="absolute font-gilroy-bold"
              style={{
                top: '94px', // 75px (позиция выигрыша) + 14px (размер шрифта выигрыша) + 5px (отступ)
                right: '16px', // Отступ 16 пикселей от правого края
                fontSize: '12px',
                color: '#445768'
              }}
            >
              {selectedGame?.winner_percentage?.toFixed(2) || '0.00'}%
            </div>

            {/* Выигранные подарки */}
            {selectedGame?.winner_items && selectedGame.winner_items.length > 0 && (
              <div 
                style={{
                  position: 'absolute',
                  top: '125px', // 75px (позиция аватарки) + 34px (высота аватарки) + 16px (отступ)
                  left: '16px',
                  right: '16px'
                }}
              >
                <div style={{ paddingBottom: '16px' }}>
                  {Array.from({ length: Math.ceil(selectedGame.winner_items.length / 3) }).map((_, rowIndex) => (
                    <div 
                      key={rowIndex} 
                      className="flex justify-between"
                      style={{ 
                        marginBottom: rowIndex < Math.ceil(selectedGame.winner_items.length / 3) - 1 ? '16px' : '0px'
                      }}
                    >
                      {selectedGame.winner_items!.slice(rowIndex * 3, rowIndex * 3 + 3).map((item, itemIndex) => {
                        const actualIndex = rowIndex * 3 + itemIndex;
                        
                        return (
                          <div
                            key={actualIndex}
                            className="relative flex items-center justify-center cursor-pointer"
                            style={{
                              width: 'calc((100% - 32px) / 3)', // (348px - 32px gaps) / 3
                              height: '105px',
                              background: 'linear-gradient(45deg, #161D24 0%, #1B232B 100%)',
                              borderRadius: '20px',
                              border: '1px solid #303E4A',
                              backgroundImage: item.gift_background ? `url(${item.gift_background})` : 'none',
                              backgroundSize: '105px 105px',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat'
                            }}
                          >
                            {item.gift_icon && (
                              <img 
                                src={item.gift_icon}
                                alt={item.gift_name}
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
                            
                            {/* Info overlay */}
                            {activeInfoOverlay === actualIndex && (
                              <div
                                className="absolute inset-0 flex flex-col items-center justify-center"
                                style={{
                                  backgroundColor: 'rgba(6, 14, 21, 0.85)',
                                  borderRadius: '20px',
                                  backdropFilter: 'blur(4px)',
                                  zIndex: 40,
                                  paddingTop: '8px'
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
                                setActiveInfoOverlay(activeInfoOverlay === actualIndex ? null : actualIndex);
                              }}
                            >
                              {activeInfoOverlay === actualIndex ? (
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
                      {selectedGame.winner_items!.slice(rowIndex * 3, rowIndex * 3 + 3).length < 3 && 
                        Array.from({ length: 3 - selectedGame.winner_items!.slice(rowIndex * 3, rowIndex * 3 + 3).length }).map((_, emptyIndex) => (
                          <div
                            key={`empty-${emptyIndex}`}
                            style={{ width: 'calc((100% - 32px) / 3)' }}
                          />
                        ))
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
