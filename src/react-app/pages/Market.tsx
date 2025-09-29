import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Lottie from 'lottie-react';
import Footer from '../components/Footer';

export default function Market() {
  const navigate = useNavigate();
  const [animationKey, setAnimationKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [marketAnimation, setMarketAnimation] = useState(null);

  useEffect(() => {
    // Загружаем анимацию с CDN
    fetch('https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/market.json')
      .then(response => response.json())
      .then(data => {
        setMarketAnimation(data);
        setIsPlaying(true);
        setAnimationKey(Date.now());
      })
      .catch(error => console.error('Error loading animation:', error));

    // Загружаем шрифты с CDN
    const loadFont = (fontUrl: string, fontFamily: string) => {
      const font = new FontFace(fontFamily, `url(${fontUrl})`);
      font.load().then(() => {
        document.fonts.add(font);
      }).catch(error => console.error(`Error loading font ${fontFamily}:`, error));
    };

    loadFont('https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/Gilroy-Bold.ttf', 'Gilroy-Bold');
    loadFont('https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/Gilroy-SemiBold.ttf', 'Gilroy-SemiBold');
    
    // Останавливаем анимацию при размонтировании
    return () => {
      setIsPlaying(false);
    };
  }, []);

  const handleAnimationClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 10) {
      navigate('/secret');
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col text-white select-none"
      style={{ backgroundColor: '#060E15' }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center">
        {/* Sooon Text with Gradient */}
        <h1 
          className="font-bold text-center leading-none mb-4"
          style={{
            fontSize: '48px',
            fontFamily: 'Gilroy-Bold, Gilroy, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold',
            background: 'linear-gradient(to bottom, #4B8AFF 0%, #4077DC 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Sooon...
        </h1>

        {/* Market Lottie Animation */}
        <div 
          className="mb-4 cursor-pointer" 
          style={{ width: '203px', height: '203px' }}
          onClick={handleAnimationClick}
        >
          {marketAnimation && (
            <Lottie
              key={animationKey}
              animationData={marketAnimation}
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

        {/* Development Message */}
        <p 
          className="text-center text-white mb-5"
          style={{
            fontSize: '16px',
            fontFamily: 'Gilroy-SemiBold, Gilroy, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: '600',
            color: '#FFFFFF'
          }}
        >
          Маркет находится в разработке...
        </p>
      </div>
      </div>
      <Footer />
    </div>
  );
}
