import { useImagePreloader } from '@/react-app/hooks/useImagePreloader';
import { useEffect } from 'react';

interface LoadingScreenProps {
  children: React.ReactNode;
}

export default function LoadingScreen({ children }: LoadingScreenProps) {
  const { isLoading } = useImagePreloader();

  // Блокируем прокрутку во время загрузки
  useEffect(() => {
    if (isLoading) {
      // Блокируем прокрутку
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      // Восстанавливаем прокрутку
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    // Cleanup function для восстановления прокрутки при размонтировании
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isLoading]);

  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative fixed inset-0 z-50"
      style={{ 
        backgroundColor: '#060E15',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        touchAction: 'none'
      }}
    >
      {/* Центральный круг */}
      <div 
        className="absolute"
        style={{ 
          width: '82px', 
          height: '82px',
          border: '8px solid #4378FF',
          opacity: 0.1,
          borderRadius: '50%',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />
      
      {/* Внешний круг с пунктирной линией */}
      <svg 
        className="absolute"
        style={{
          width: '100px',
          height: '100px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'spin 3s linear infinite reverse'
        }}
      >
        <circle
          cx="50"
          cy="50"
          r="49.5"
          fill="transparent"
          stroke="#FFFFFF"
          strokeWidth="1"
          strokeDasharray="8"
          opacity="0.3"
        />
      </svg>

      {/* Верхний круг с sweep анимацией */}
      <svg 
        className="absolute"
        style={{
          width: '82px',
          height: '82px',
          left: '50%',
          top: '50%',
          animation: 'spin 2s linear infinite'
        }}
      >
        <circle
          cx="41"
          cy="41"
          r="37"
          fill="transparent"
          stroke="#007AFF"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="232"
          strokeDashoffset="79"
          style={{
            transition: 'stroke-dashoffset 0.3s ease'
          }}
        />
      </svg>
      
      <img 
        src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/Logo.svg" 
        alt="Logo" 
        style={{ width: '32px', height: '38px', marginLeft: '2px' }}
      />
      
      {/* Стрелочка сверху */}
      <img 
        src="https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arrow.svg" 
        alt="Arrow" 
        className="absolute"
        style={{
          width: '13px',
          height: '8px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          marginTop: '-62.5px'
        }}
      />
      
      {/* Текст "Загрузка..." */}
      <div 
        className="absolute font-gilroy-semibold text-white"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          marginTop: '73px',
          fontSize: '18px'
        }}
      >
        Загрузка...
      </div>
    </div>
  );
}
