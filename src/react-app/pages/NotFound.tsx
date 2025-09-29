import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Lottie from 'lottie-react';

export default function NotFound() {
  const navigate = useNavigate();
  const [animationKey, setAnimationKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [notFoundAnimation, setNotFoundAnimation] = useState(null);

  useEffect(() => {
    // Загружаем шрифты Gilroy
    const loadFonts = async () => {
      const fontFaces = [
        new FontFace('Gilroy-Bold', `url(https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/Gilroy-Bold.ttf)`),
        new FontFace('Gilroy-SemiBold', `url(https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/Gilroy-SemiBold.ttf)`)
      ];

      try {
        const loadedFonts = await Promise.all(fontFaces.map(font => font.load()));
        loadedFonts.forEach(font => document.fonts.add(font));
      } catch (error) {
        console.error('Error loading fonts:', error);
      }
    };

    loadFonts();

    // Загружаем анимацию с CDN
    fetch('https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/404.json')
      .then(response => response.json())
      .then(data => {
        setNotFoundAnimation(data);
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
      <div className="flex flex-col items-center">
        {/* 404 Text with Gradient */}
        <h1 
          className="font-bold text-center leading-none mb-4"
          style={{
            fontSize: '48px',
            fontFamily: 'Gilroy-Bold, Gilroy, sans-serif',
            fontWeight: 'bold',
            background: 'linear-gradient(to bottom, #FF4242 0%, #DD1919 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          404
        </h1>

        {/* 404 Lottie Animation */}
        <div className="mb-4" style={{ width: '203px', height: '203px' }}>
          {notFoundAnimation && (
            <Lottie
              key={animationKey}
              animationData={notFoundAnimation}
              loop={true}
              autoplay={isPlaying}
              renderer="svg"
              rendererSettings={{
                preserveAspectRatio: 'xMidYMid meet',
                progressiveLoad: true,
                hideOnTransparent: true
              }}
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>

        {/* Error Message */}
        <p 
          className="text-center text-white mb-5"
          style={{
            fontSize: '16px',
            fontFamily: 'Gilroy-SemiBold, Gilroy, sans-serif',
            fontWeight: '600',
            color: '#FFFFFF'
          }}
        >
          Упс! Страница не найдена…
        </p>

        {/* Home Button */}
        <button
          onClick={handleGoHome}
          className="text-white transition-all duration-200 hover:opacity-90"
          style={{
            width: '217px',
            height: '43.4px',
            borderRadius: '20.15px',
            backgroundColor: '#007AFF',
            fontFamily: 'Gilroy-SemiBold, Gilroy, sans-serif',
            fontWeight: '600',
            fontSize: '13.8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          На главную
        </button>
      </div>
    </div>
  );
}
