import { useState, useMemo, useEffect } from 'react';
import Footer from '@/react-app/components/Footer';
import UserHeader from '@/react-app/components/UserHeader';
import CaseModal from '@/react-app/components/CaseModal';

export default function Cases() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [selectedCaseType, setSelectedCaseType] = useState<'bordered' | 'borderless'>('bordered');
  const [selectedCaseName, setSelectedCaseName] = useState<string>('Love Party');
  const [selectedCasePrice, setSelectedCasePrice] = useState<number>(6);
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

  // Определяем все кейсы с их данными
  const allCases = [
    {
      id: 'tasty-bundle',
      name: 'Tasty Bundle',
      price: 0.9,
      image: 'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/tasty_bundle.jpg',
      isNew: false,
      isSoon: false
    },
    {
      id: 'love-party',
      name: 'Love Party',
      price: 6.00,
      image: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/love_party.jpg',
      gradient: 'linear-gradient(180deg, rgba(254, 162, 195, 0) 0%, rgba(254, 87, 145, 1) 100%)',
      isNew: true,
      isSoon: false
    },
    {
      id: 'gold-rush',
      name: 'Gold Rush',
      price: 11.00,
      image: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gold_rush.jpg',
      gradient: 'linear-gradient(180deg, rgba(255, 215, 0, 0) 0%, rgba(255, 165, 0, 1) 100%)',
      isNew: true,
      isSoon: false
    },
    {
      id: 'gangsta',
      name: 'Gangsta',
      price: 2.50,
      image: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gangsta.jpg',
      isNew: false,
      isSoon: false
    },
    {
      id: 'vip-box',
      name: 'VIP Box',
      price: 4.50,
      image: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/vip_box.jpg',
      isNew: true,
      isSoon: false
    },
    {
      id: 'lunch-box',
      name: 'Lunch Box',
      price: 2.00,
      image: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/lunch_box.jpg',
      isNew: true,
      isSoon: false
    },
    {
      id: 'rich-holder',
      name: 'Rich Holder',
      price: 120.00,
      image: 'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/rich_holder.jpg',
      isNew: true,
      isSoon: false
    },
    {
      id: 'rich-mood',
      name: 'Rich Mood',
      price: 550.00,
      image: 'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/rich_mood.jpg',
      isNew: true,
      isSoon: false
    },
    {
      id: 'soon-1',
      name: 'Sooon...',
      price: 0,
      image: 'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/Sooon.jpg',
      isNew: false,
      isSoon: true
    },
    {
      id: 'soon-2',
      name: 'Sooon...',
      price: 0,
      image: 'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/Sooon.jpg',
      isNew: false,
      isSoon: true
    },
    {
      id: 'soon-3',
      name: 'Sooon...',
      price: 0,
      image: 'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/Sooon.jpg',
      isNew: false,
      isSoon: true
    },
    {
      id: 'soon-4',
      name: 'Sooon...',
      price: 0,
      image: 'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/Sooon.jpg',
      isNew: false,
      isSoon: true
    }
  ];

  // Фильтрация и сортировка кейсов
  const filteredCases = useMemo(() => {
    let filtered = [...allCases];

    // Применяем фильтры
    switch (selectedFilter) {
      case 'free':
        filtered = filtered.filter(caseItem => caseItem.price === 0 && !caseItem.isSoon);
        break;
      case 'new':
        filtered = filtered.filter(caseItem => caseItem.isNew && !caseItem.isSoon);
        break;
      case 'cheap':
        filtered = filtered.filter(caseItem => !caseItem.isSoon);
        filtered.sort((a, b) => a.price - b.price); // По возрастанию цены
        break;
      case 'expensive':
        filtered = filtered.filter(caseItem => !caseItem.isSoon);
        filtered.sort((a, b) => b.price - a.price); // По убыванию цены
        break;
      default: // 'all'
        // Показываем все кейсы без фильтрации
        break;
    }

    return filtered;
  }, [selectedFilter, allCases]);

  // Проверка новых выигрышей из кейсов
  const checkForNewWins = async () => {
    try {
      const response = await fetch(`/api/sync/case-wins?since=${lastWinSyncTime}`);
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
      console.error('Error checking for new wins:', error);
    }
  };

  // Polling для синхронизации выигрышей
  useEffect(() => {
    const interval = setInterval(checkForNewWins, 1000); // Каждую секунду
    return () => clearInterval(interval);
  }, [lastWinSyncTime]);

  const filters = [
    { id: 'all', label: 'Все', width: 76, icon: null },
    { id: 'free', label: 'Бесплатные', width: 142, icon: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gift.svg', iconSize: { w: 13, h: 12 } },
    { id: 'new', label: 'Новые', width: 108, icon: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/star.svg', iconSize: { w: 13, h: 12 } },
    { id: 'cheap', label: 'Дешевые', width: 122, icon: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/cheap.svg', iconSize: { w: 10, h: 12 } },
    { id: 'expensive', label: 'Дорогие', width: 117, icon: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/expensive.svg', iconSize: { w: 10, h: 12 } }
  ];

  // Вычисляем позицию и ширину индикатора
  const indicatorStyle = useMemo(() => {
    const selectedIndex = filters.findIndex(f => f.id === selectedFilter);
    if (selectedIndex === -1) return { left: 0, width: 0 };

    let left = 0;
    for (let i = 0; i < selectedIndex; i++) {
      left += filters[i].width;
      if (i > 0) left += 0.5; // добавляем ширину вертикальной линии
    }

    return {
      left: `${left}px`,
      width: `${filters[selectedIndex].width}px`
    };
  }, [selectedFilter, filters]);

  return (
    <>
      <div className="min-h-screen text-white flex flex-col items-center" style={{ backgroundColor: '#060E15' }}>
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl flex flex-col">
          <UserHeader />
          
          <div className="px-3 sm:px-4 md:px-6 flex-1 flex flex-col">
            {/* Live кнопка и квадраты */}
            <div className="flex items-center mb-3 sm:mb-4 w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto">
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
                            backgroundSize: '63px 63px',
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

            {/* Case баннер */}
            <div className="mb-3 sm:mb-4 w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto" style={{ marginTop: '6px' }}>
              <div 
                className="relative overflow-hidden rounded-[20px]"
                style={{
                  width: '100%',
                  height: '120px'
                }}
              >
                <img 
                  src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/case_banner.jpg"
                  alt="Case Banner"
                  className="w-full h-full object-cover"
                  style={{
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    imageRendering: 'auto'
                  }}
                />
              </div>
            </div>

            {/* Прокручиваемый прямоугольник */}
            <div 
              className="overflow-x-auto overflow-y-hidden rounded-[20px] w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto"
              style={{
                marginTop: '6px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <div 
                className="rounded-[20px] flex items-center relative"
                style={{
                  width: '567px',
                  minWidth: '567px',
                  height: '40px',
                  backgroundColor: '#1D252C',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
                {/* Анимированный индикатор выделения */}
                <div 
                  className="absolute top-0 bottom-0 rounded-[20px] transition-all duration-300 ease-out"
                  style={{
                    backgroundColor: '#303E4A',
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                    height: '40px'
                  }}
                />

                {filters.map((filter, index) => (
                  <div key={filter.id} className="flex items-center">
                    {/* Вертикальная линия слева */}
                    {index > 0 && selectedFilter !== filter.id && selectedFilter !== filters[index - 1].id && (
                      <div 
                        style={{
                          width: '0.5px',
                          height: '20px',
                          backgroundColor: '#303E4A'
                        }}
                      />
                    )}
                    
                    {/* Блок фильтра */}
                    <div 
                      className="flex items-center justify-center cursor-pointer relative z-10"
                      style={{
                        width: `${filter.width}px`,
                        height: '40px',
                        marginLeft: '0px'
                      }}
                      onClick={() => setSelectedFilter(filter.id)}
                    >
                      {/* Содержимое блока */}
                      <div className="relative flex items-center">
                        {filter.icon && (
                          <img 
                            src={filter.icon}
                            alt={filter.label}
                            className="self-center"
                            style={{
                              width: `${filter.iconSize?.w}px`,
                              height: `${filter.iconSize?.h}px`,
                              marginRight: '5px',
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none',
                              msUserSelect: 'none'
                            }}
                          />
                        )}
                        <span 
                          className="font-gilroy-semibold text-white"
                          style={{
                            fontSize: '12px',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none'
                          }}
                        >
                          {filter.label}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <style>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
            </div>

            {/* Динамическое отображение кейсов */}
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto">
              {Array.from({ length: Math.ceil(filteredCases.length / 2) }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex w-full" style={{ marginTop: '16px', gap: '14px' }}>
                  {filteredCases.slice(rowIndex * 2, rowIndex * 2 + 2).map((caseItem) => (
                    <div 
                      key={caseItem.id}
                      className={`rounded-[20px] flex-1 relative ${!caseItem.isSoon ? 'cursor-pointer' : ''}`}
                      style={{
                        height: '214px',
                        background: 'linear-gradient(45deg, #1A2222 0%, #232E37 100%)',
                        backgroundImage: `url(${caseItem.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                      onClick={!caseItem.isSoon ? () => {
                        setSelectedCaseType('borderless');
                        setSelectedCaseName(caseItem.name);
                        setSelectedCasePrice(caseItem.price);
                        setIsCaseModalOpen(true);
                      } : undefined}
                    >
                      {/* Прямоугольник с ценой в правом верхнем углу (только для обычных кейсов) */}
                      {!caseItem.isSoon && (
                        <div 
                          className="absolute rounded-[20px]"
                          style={{
                            width: '65px',
                            height: '25px',
                            backgroundColor: 'rgba(11, 27, 39, 0.4)',
                            top: '7px',
                            right: '7px'
                          }}
                        >
                          {/* Логотип toncoin_active */}
                          <img 
                            src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/toncoin_active.svg"
                            alt="TON"
                            className="absolute"
                            style={{
                              width: '18px',
                              height: '18px',
                              left: '4px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none',
                              msUserSelect: 'none'
                            }}
                          />
                          
                          {/* Текст цены */}
                          <span 
                            className="absolute font-gilroy-bold"
                            style={{
                              fontSize: '10px',
                              color: '#FFFFFF',
                              left: '26px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none',
                              msUserSelect: 'none'
                            }}
                          >
                            {caseItem.price.toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      {/* Блок с названием кейса внизу */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 rounded-b-[20px] flex items-center justify-center"
                        style={{
                          height: '37px',
                          background: caseItem.gradient || 'transparent'
                        }}
                      >
                        <span 
                          className="font-gilroy-bold text-white"
                          style={{
                            fontSize: '10px',
                            color: '#FFFFFF',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none'
                          }}
                        >
                          {caseItem.name}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Заполнение пустого места, если в ряду только один кейс */}
                  {filteredCases.slice(rowIndex * 2, rowIndex * 2 + 2).length === 1 && (
                    <div className="flex-1"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Отступ снизу для футера */}
            <div style={{ height: '120px' }}></div>
          </div>
        </div>
      </div>
      
      <Footer currentPage="cases" isModalOpen={isCaseModalOpen} />

      {/* Case Modal */}
      <CaseModal 
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        caseType={selectedCaseType}
        caseName={selectedCaseName}
        casePrice={selectedCasePrice}
      />
    </>
  );
}
