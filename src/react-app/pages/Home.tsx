import { Package, Rocket, Swords } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import UserHeader from '@/react-app/components/UserHeader';
import PromoBanner from '@/react-app/components/PromoBanner';
import GameModeCard from '@/react-app/components/GameModeCard';
import Footer from '@/react-app/components/Footer';

export default function Home() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const promoBanners = [
    'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/banner_1.jpg',
    { url: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/referrals_main.jpg', link: '/profile' },
    { url: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/upgrade_main.jpg', link: '/upgrade' },
    { url: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/mines_main.jpg', link: '/mines' },
    { url: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/cases_main.jpg', link: '/cases' }
  ];

  const gameModes = [
    {
      id: 'cases',
      title: 'Открой',
      subtitle: 'Свой счастливый кейс!',
      backgroundImage: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/cases.jpg',
      icon: '📦'
    },
    {
      id: 'upgrade',
      title: 'Увеличь',
      subtitle: 'Ценность своих подарков!',
      backgroundImage: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/upgrade.jpg',
      icon: '⭐'
    },
    {
      id: 'pvp',
      title: 'Докажи',
      subtitle: 'Кто здесь Лучший!',
      backgroundImage: 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/pvp.png',
      icon: '⚔️'
    }
  ];

  return (
    <div className="min-h-screen text-white flex flex-col items-center" style={{ 
      backgroundColor: '#060E15',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none'
    }}>
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl flex flex-col">
        <UserHeader onModalStateChange={setIsModalOpen} />
        
        <div className="px-3 sm:px-4 md:px-6 flex flex-col items-center">
          <PromoBanner banners={promoBanners} />
          
          {/* Small Banners */}
          <div className="flex justify-between space-x-2 sm:space-x-3 md:space-x-4 mb-4 sm:mb-6 w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto">
            <a 
              href="https://t.me/dash_games"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 aspect-[16/9] rounded-xl sm:rounded-2xl overflow-hidden bg-cover bg-center cursor-pointer transform transition-all duration-200 hover:scale-105"
              style={{ backgroundImage: `url('https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/channel.jpg')` }}
            >
            </a>
            <div 
              onClick={() => navigate('/cases')}
              className="flex-1 aspect-[16/9] rounded-xl sm:rounded-2xl overflow-hidden bg-cover bg-center cursor-pointer transform transition-all duration-200 hover:scale-105"
              style={{ backgroundImage: `url('https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/free_case.png')` }}
            />
          </div>
          
          {/* Game Modes */}
          <div className="space-y-4 sm:space-y-6 w-full max-w-sm sm:max-w-md md:max-w-lg flex flex-col">
            {/* Mines Section */}
            <div className="w-full">
              <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                <img 
                  src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/mines.svg"
                  alt="Mines"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  style={{ filter: 'brightness(0) saturate(100%) invert(51%) sepia(100%) saturate(3000%) hue-rotate(203deg) brightness(102%) contrast(101%)' }}
                />
                <h2 className="text-white text-lg sm:text-xl" style={{ fontFamily: 'Gilroy-SemiBold, sans-serif' }}>Мины</h2>
              </div>
              <GameModeCard
                backgroundImage="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/mines.jpg?v2"
                onClick={() => navigate('/mines')}
              />
            </div>

            {/* Cases Section */}
            <div className="w-full">
              <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                <Package className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#007AFF' }} />
                <h2 className="text-white text-lg sm:text-xl" style={{ fontFamily: 'Gilroy-SemiBold, sans-serif' }}>Кейсы</h2>
              </div>
              <GameModeCard
                backgroundImage={gameModes[0].backgroundImage}
                onClick={() => navigate('/cases')}
              />
            </div>

            {/* Upgrade Section */}
            <div className="w-full">
              <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                <Rocket className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#007AFF' }} />
                <h2 className="text-white text-lg sm:text-xl" style={{ fontFamily: 'Gilroy-SemiBold, sans-serif' }}>Апгрейд</h2>
              </div>
              <GameModeCard
                backgroundImage={gameModes[1].backgroundImage}
                onClick={() => navigate('/upgrade')}
              />
            </div>

            {/* PvP Section */}
            <div className="pb-6 sm:pb-8 w-full">
              <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                <Swords className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#007AFF' }} />
                <h2 className="text-white text-lg sm:text-xl" style={{ fontFamily: 'Gilroy-SemiBold, sans-serif' }}>ПвП</h2>
              </div>
              <GameModeCard
                backgroundImage={gameModes[2].backgroundImage}
                onClick={() => navigate('/pvp')}
              />
            </div>

            {/* Links Section */}
            <div className="pb-24 sm:pb-32 w-full">
              <div className="flex flex-col items-center space-y-3 sm:space-y-4 px-2 sm:px-4">
                

                {/* Disclaimer */}
                <div className="text-center text-xs text-gray-500 max-w-xs sm:max-w-sm md:max-w-md leading-relaxed px-2">
                  <p>
                    Помните: азартные игры не являются способом заработка и могут привести к финансовым потерям.
                  </p>
                </div>

                {/* Powered by with logo */}
                <a 
                  href="https://t.me/elemeta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center mt-2 space-x-[5px] cursor-pointer hover:opacity-80 transition-opacity duration-200"
                >
                  <span className="text-gray-400 text-xs sm:text-sm">
                    powered by
                  </span>
                  <img 
                    src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/elemeta_blue.svg"
                    alt="Elemeta"
                    style={{ width: '68px', height: '9px' }}
                  />
                </a>
                
                {/* Additional spacing at bottom */}
                <div className="mt-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer currentPage="home" isModalOpen={isModalOpen} />
    </div>
  );
}
