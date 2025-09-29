import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Lottie from 'lottie-react';

export default function Secret() {
  const navigate = useNavigate();
  const [animationKey, setAnimationKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [secretAnimation, setSecretAnimation] = useState(null);

  useEffect(() => {
    // Загружаем шрифты через CDN
    const fontBold = new FontFace('Gilroy-Bold', 'url(https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/Gilroy-Bold.ttf)');
    const fontSemiBold = new FontFace('Gilroy-SemiBold', 'url(https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/Gilroy-SemiBold.ttf)');
    
    Promise.all([fontBold.load(), fontSemiBold.load()])
      .then(([boldFont, semiBoldFont]) => {
        document.fonts.add(boldFont);
        document.fonts.add(semiBoldFont);
      })
      .catch(error => console.error('Error loading fonts:', error));

    // Загружаем анимацию с CDN
    fetch('https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/secret.json')
      .then(response => response.json())
      .then(data => {
        setSecretAnimation(data);
        setIsPlaying(true);
        setAnimationKey(Date.now());
      })
      .catch(error => console.error('Error loading animation:', error));
    
    // Останавливаем анимацию при размонтировании
    return () => {
      setIsPlaying(false);
    };
  }, []);

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center text-white px-4"
      style={{ 
        backgroundColor: '#060E15',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <div className="flex flex-col items-center justify-center w-full">
        {/* Пасхалко Text with Gradient */}
        <div className="w-full flex justify-center">
          <h1 
            className="font-bold text-center leading-none select-none"
            style={{
              fontSize: '48px',
              fontFamily: 'Gilroy-Bold, Arial, sans-serif',
              fontWeight: 'bold',
              background: 'linear-gradient(to bottom, #4B8AFF 0%, #4077DC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '20px'
            }}
          >
            Пасхалко
          </h1>
        </div>

        {/* Secret Lottie Animation */}
        <div className="w-full flex justify-center">
          <div className="select-none" style={{ width: '203px', height: '203px', marginBottom: '20px' }}>
            {secretAnimation && (
              <Lottie
                key={animationKey}
                animationData={secretAnimation}
                loop={true}
                autoplay={isPlaying}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </div>
        </div>

        {/* Home Button */}
        <div className="w-full flex justify-center">
          <button
            onClick={handleGoHome}
            className="text-white transition-all duration-200 hover:opacity-90"
            style={{
              width: '217px',
              height: '43.4px',
              borderRadius: '20.15px',
              backgroundColor: '#007AFF',
              fontFamily: 'Gilroy-SemiBold, Arial, sans-serif',
              fontWeight: '600',
              fontSize: '13.8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Главное меню
          </button>
        </div>
      </div>
    </div>
  );
}
