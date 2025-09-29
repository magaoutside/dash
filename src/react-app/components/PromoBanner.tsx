import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';

interface BannerItem {
  url: string;
  link?: string;
}

interface PromoBannerProps {
  banners: (string | BannerItem)[];
}

export default function PromoBanner({ banners }: PromoBannerProps) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const handleBannerClick = () => {
    if (!isDragging.current) {
      const banner = banners[currentBanner];
      if (typeof banner === 'object' && banner.link) {
        navigate(banner.link);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    
    const currentX = e.touches[0].clientX;
    const diffX = Math.abs(currentX - touchStartX.current);
    
    // If user has moved more than 10px horizontally, consider it a drag
    if (diffX > 10) {
      isDragging.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !isDragging.current) return;
    
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeThreshold = 50; // Minimum distance for a swipe
    const swipeDistance = touchStartX.current - touchEndX.current;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        // Swipe left - next banner
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      } else {
        // Swipe right - previous banner
        setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
      }
    }

    // Reset values
    touchStartX.current = 0;
    touchEndX.current = 0;
    isDragging.current = false;
  };

  const currentBannerItem = banners[currentBanner];
  const isClickable = typeof currentBannerItem === 'object' && currentBannerItem.link;

  return (
    <div 
      ref={containerRef}
      className={`relative w-full max-w-sm sm:max-w-md md:max-w-lg h-44 sm:h-48 md:h-52 lg:h-56 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-700/50 mb-3 sm:mb-4 mx-auto ${isClickable ? 'cursor-pointer' : ''}`}
      onClick={isClickable ? handleBannerClick : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: 'pan-y pinch-zoom', // Allow vertical scroll and pinch zoom, but handle horizontal swipes
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {banners.length > 0 && (
        <div className="relative w-full h-full">
          {banners.map((banner, index) => {
            const bannerUrl = typeof banner === 'string' ? banner : banner.url;
            return (
              <img
                key={index}
                src={bannerUrl}
                alt={`Banner ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                  index === currentBanner ? 'opacity-100' : 'opacity-0'
                }`}
                loading="eager"
                style={{ pointerEvents: 'none' }}
              />
            );
          })}
        </div>
      )}
      
      {/* Dots indicator */}
      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 flex space-x-1.5 sm:space-x-2">
        {banners.map((_, index) => (
          <div
            key={index}
            className={`rounded-full transition-all duration-500 ease-in-out ${
              index === currentBanner 
                ? 'w-5 sm:w-6 h-1.5 sm:h-2 bg-white' 
                : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
