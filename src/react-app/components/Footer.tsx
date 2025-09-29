import { Package, ShoppingCart, User, Rocket } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useKeyboardVisibility } from '@/react-app/hooks/useKeyboardVisibility';

interface FooterProps {
  currentPage?: string;
  isModalOpen?: boolean;
  isLocked?: boolean;
}

export default function Footer({ currentPage, isModalOpen, isLocked = false }: FooterProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isKeyboardVisible = useKeyboardVisibility();
  
  const getCurrentPage = () => {
    if (currentPage) return currentPage;
    
    const path = location.pathname;
    if (path === '/cases') return 'cases';
    
    if (path === '/upgrade') return 'upgrade';
    if (path === '/pvp') return 'pvp';
    if (path === '/market') return 'market';
    if (path === '/profile') return 'profile';
    return 'home';
  };
  
  const current = getCurrentPage();
  return (
    <div 
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 transition-all duration-150 ease-in-out ${
        isKeyboardVisible ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'
      } ${isModalOpen ? 'z-40 pointer-events-none' : 'z-50 pointer-events-auto'}`}
    >
      
      
      <div 
        className="flex items-center justify-around relative"
        style={{
          width: '357px',
          height: '78px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.05) 0%, rgba(119, 119, 119, 0.05) 100%)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          opacity: isLocked ? 0.5 : 1,
          pointerEvents: isLocked ? 'none' : 'auto',
          transition: 'opacity 0.3s ease'
        }}
      >
        {/* Градиентная обводка */}
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
        {/* Кейсы */}
        <div 
          className="flex flex-col items-center justify-center cursor-pointer"
          onClick={() => navigate('/cases')}
        >
          <Package 
            className="w-6 h-6 mb-1 text-white"
            style={current === 'cases' ? { 
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))',
              opacity: 1
            } : {
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.2)) drop-shadow(0 0 6px rgba(255, 255, 255, 0.2))',
              opacity: 0.2
            }}
          />
          <span 
            className="text-white"
            style={{
              fontFamily: 'Gilroy-Bold',
              fontWeight: '700',
              fontSize: '11px',
              ...(current === 'cases' ? {
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))',
                opacity: 1
              } : {
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.2)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))',
                opacity: 0.2
              })
            }}
          >
            Кейсы
          </span>
        </div>

        {/* Апгрейды */}
        <div 
          className="flex flex-col items-center justify-center cursor-pointer"
          onClick={() => navigate('/upgrade')}
        >
          <Rocket 
            className="w-6 h-6 mb-1 text-white"
            style={current === 'upgrade' ? { 
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))',
              opacity: 1
            } : {
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.2)) drop-shadow(0 0 6px rgba(255, 255, 255, 0.2))',
              opacity: 0.2
            }}
          />
          <span 
            className="text-white"
            style={{
              fontFamily: 'Gilroy-Bold',
              fontWeight: '700',
              fontSize: '11px',
              ...(current === 'upgrade' ? {
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))',
                opacity: 1
              } : {
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.2)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))',
                opacity: 0.2
              })
            }}
          >
            Апгрейды
          </span>
        </div>

        {/* Меню */}
        <div 
          className="flex flex-col items-center justify-center cursor-pointer"
          onClick={() => navigate('/')}
        >
          <img 
            src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/меню.svg"
            alt="Menu"
            className="w-6 h-6 mb-1"
            style={current === 'home' ? { 
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 6px rgba(255, 255, 255, 0.6)) brightness(0) invert(1)',
              opacity: 1
            } : {
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.2)) drop-shadow(0 0 6px rgba(255, 255, 255, 0.2)) brightness(0) invert(1)',
              opacity: 0.2
            }}
          />
          <span 
            className="text-white"
            style={{
              fontFamily: 'Gilroy-Bold',
              fontWeight: '700',
              fontSize: '11px',
              ...(current === 'home' ? {
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))',
                opacity: 1
              } : {
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.2)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))',
                opacity: 0.2
              })
            }}
          >
            Меню
          </span>
        </div>

        {/* Маркет */}
        <div 
          className="flex flex-col items-center justify-center cursor-pointer"
          onClick={() => navigate('/market')}
        >
          <ShoppingCart 
            className="w-6 h-6 mb-1 text-white"
            style={current === 'market' ? { 
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))',
              opacity: 1
            } : {
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.2)) drop-shadow(0 0 6px rgba(255, 255, 255, 0.2))',
              opacity: 0.2
            }}
          />
          <span 
            className="text-white"
            style={{
              fontFamily: 'Gilroy-Bold',
              fontWeight: '700',
              fontSize: '11px',
              ...(current === 'market' ? {
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))',
                opacity: 1
              } : {
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.2)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))',
                opacity: 0.2
              })
            }}
          >
            Маркет
          </span>
        </div>

        {/* Профиль */}
        <div 
          className="flex flex-col items-center justify-center cursor-pointer"
          onClick={() => navigate('/profile')}
        >
          <User 
            className="w-6 h-6 mb-1 text-white"
            style={current === 'profile' ? { 
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))',
              opacity: 1
            } : {
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.2)) drop-shadow(0 0 6px rgba(255, 255, 255, 0.2))',
              opacity: 0.2
            }}
          />
          <span 
            className="text-white"
            style={{
              fontFamily: 'Gilroy-Bold',
              fontWeight: '700',
              fontSize: '11px',
              ...(current === 'profile' ? {
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))',
                opacity: 1
              } : {
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.2)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))',
                opacity: 0.2
              })
            }}
          >
            Профиль
          </span>
        </div>
      </div>
    </div>
  );
}
