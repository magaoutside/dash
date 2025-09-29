import { useEffect, useState } from 'react';

// Список всех изображений баннеров, используемых в приложении
const BANNER_IMAGES = [
  // Основные баннеры промо
  'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/banner_1.jpg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/cases.jpg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/upgrade.jpg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/pvp.png',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/mines.jpg?v2',
  
  // Дополнительные баннеры
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/channel.jpg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/free_case.png',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/case_banner.jpg',
  
  // Иконки
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/toncoin_active.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/toncoin_inactive.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/stars_active.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/stars_inactive.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gifts_active.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gifts_inactive.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/down.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/up.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/expensive.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/cheap.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/star.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gift.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gem.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/bomb.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/case_banner.png',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/elemeta_blue.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/love_party.jpg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/immortal.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/arcane.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/common.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/legendary.svg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/rare.svg',
  
  // All gift icons from database mapping
  'https://cdn.changes.tg/gifts/models/Astral%20Shard/png/Original.png',
  'https://cdn.changes.tg/gifts/models/B-Day%20Candle/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Berry%20Box/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Big%20Year/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Bonded%20Ring/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Bow%20Tie/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Bunny%20Muffin/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Candy%20Cane/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Cookie%20Heart/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Crystal%20Ball/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Cupid%20Charm/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Desk%20Calendar/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Diamond%20Ring/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Durov\'s%20Cap/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Easter%20Egg/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Electric%20Skull/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Eternal%20Candle/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Eternal%20Rose/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Evil%20Eye/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Flying%20Broom/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Gem%20Signet/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Genie%20Lamp/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Ginger%20Cookie/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Hanging%20Star/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Heart%20Locket/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Heroic%20Helmet/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Hex%20Pot/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Holiday%20Drink/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Homemade%20Cake/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Hypno%20Lollipop/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Ion%20Gem/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Ionic%20Dryer/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Jack-in-the-Box/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Jelly%20Bunny/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Jester%20Hat/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Jingle%20Bells/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Jolly%20Chimp/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Joyful%20Bundle/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Kissed%20Frog/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Light%20Sword/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Lol%20Pop/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Loot%20Bag/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Love%20Candle/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Love%20Potion/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Low%20Rider/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Lunar%20Snake/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Lush%20Bouquet/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Mad%20Pumpkin/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Magic%20Potion/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Mini%20Oscar/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Moon%20Pendant/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Nail%20Bracelet/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Neko%20Helmet/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Party%20Sparkler/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Perfume%20Bottle/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Pet%20Snake/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Plush%20Pepe/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Precious%20Peach/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Record%20Player/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Restless%20Jar/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Sakura%20Flower/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Santa%20Hat/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Scared%20Cat/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Sharp%20Tongue/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Signet%20Ring/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Skull%20Flower/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Sleigh%20Bell/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Snake%20Box/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Snoop%20Cigar/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Snoop%20Dogg/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Snow%20Globe/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Snow%20Mittens/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Spiced%20Wine/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Spy%20Agaric/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Star%20Notepad/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Stellar%20Rocket/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Swag%20Bag/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Swiss%20Watch/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Tama%20Gadget/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Top%20Hat/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Toy%20Bear/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Trapped%20Heart/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Valentine%20Box/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Vintage%20Cigar/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Voodoo%20Doll/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Westside%20Sign/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Whip%20Cupcake/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Winter%20Wreath/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Witch%20Hat/png/Original.png',
  'https://cdn.changes.tg/gifts/models/Xmas%20Stocking/png/Original.png',
  
  // Case cover images
  'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/tasty_bundle.jpg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/love_party.jpg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gold_rush.jpg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gangsta.jpg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/vip_box.jpg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/lunch_box.jpg',
  
  // Main page banners
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/referrals_main.jpg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/upgrade_main.jpg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/mines_main.jpg',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/cases_main.jpg',
  
  // UI elements from GitHub
  'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/disconnect.svg',
  'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/exit.svg',
  'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/info.svg',
  'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/link.svg',
  'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/wallet.svg',
  'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/Sooon.jpg',
  
  // Partner level banners
  'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/new_partner.jpg',
  'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/base_partner.jpg',
  'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/premium_partner.jpg',
  'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/diamond_partner.jpg',
  'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/exclusive_partner.jpg',
  'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/new_partner_progress.jpg',
  
  // UI notifications
  'https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/not_enough.jpg?v2'
];

// Список всех JSON анимаций, используемых в приложении
const JSON_ANIMATIONS = [
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/404.json',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/market.json',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/secret.json',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/gem.json',
  'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/bomb.json'
];

// Глобальные кеши
const imageCache = new Map<string, HTMLImageElement>();
const jsonCache = new Map<string, any>();
const userAvatarCache = new Map<string, HTMLImageElement>();

// Функция для принудительной предзагрузки изображений
const forcePreloadImage = (src: string): Promise<HTMLImageElement> => {
  // Если изображение уже в кеше, возвращаем его
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Принудительно отключаем кеш браузера и загружаем заново
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Сохраняем в кеш
      imageCache.set(src, img);
      resolve(img);
    };
    
    img.onerror = () => {
      console.warn(`Failed to preload image: ${src}`);
      reject(new Error(`Failed to load ${src}`));
    };
    
    // Добавляем timestamp чтобы избежать кеширования браузера при первой загрузке
    img.src = src + (src.includes('?') ? '&' : '?') + '_preload=' + Date.now();
  });
};

// Функция для предзагрузки JSON анимаций
const preloadJsonAnimation = async (url: string): Promise<any> => {
  // Если JSON уже в кеше, возвращаем его
  if (jsonCache.has(url)) {
    return Promise.resolve(jsonCache.get(url));
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Сохраняем в кеш
    jsonCache.set(url, data);
    return data;
  } catch (error) {
    console.warn(`Failed to preload JSON animation: ${url}`, error);
    throw error;
  }
};

// Функция для предзагрузки аватарки пользователя
export const preloadUserAvatar = async (avatarUrl: string): Promise<HTMLImageElement | null> => {
  if (!avatarUrl) return null;
  
  // Если аватарка уже в кеше, возвращаем её
  if (userAvatarCache.has(avatarUrl)) {
    return Promise.resolve(userAvatarCache.get(avatarUrl)!);
  }

  return new Promise((resolve) => {
    const img = new Image();
    
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Сохраняем в кеш
      userAvatarCache.set(avatarUrl, img);
      resolve(img);
    };
    
    img.onerror = () => {
      console.warn(`Failed to preload user avatar: ${avatarUrl}`);
      resolve(null); // Не критичная ошибка
    };
    
    img.src = avatarUrl;
  });
};

// Экспортируем функцию для получения кешированного JSON
export const getCachedJsonAnimation = (url: string): any | null => {
  return jsonCache.get(url) || null;
};

export const useImagePreloader = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  
  const totalAssets = BANNER_IMAGES.length + JSON_ANIMATIONS.length;

  useEffect(() => {
    const preloadAllAssets = async () => {
      // Предзагружаем изображения
      const imagePromises = BANNER_IMAGES.map(async (src) => {
        try {
          await forcePreloadImage(src);
          setLoadedCount((prev) => prev + 1);
        } catch (error) {
          console.warn(`Failed to preload image: ${src}`, error);
          setLoadedCount((prev) => prev + 1);
        }
      });

      // Предзагружаем JSON анимации
      const jsonPromises = JSON_ANIMATIONS.map(async (url) => {
        try {
          await preloadJsonAnimation(url);
          setLoadedCount((prev) => prev + 1);
        } catch (error) {
          console.warn(`Failed to preload JSON: ${url}`, error);
          setLoadedCount((prev) => prev + 1);
        }
      });

      try {
        await Promise.all([...imagePromises, ...jsonPromises]);
        
        // Дополнительно форсируем создание link элементов для prefetch
        BANNER_IMAGES.forEach(src => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = src;
          document.head.appendChild(link);
        });

        JSON_ANIMATIONS.forEach(url => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = url;
          document.head.appendChild(link);
        });
        
      } catch (error) {
        console.error('Error preloading assets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    preloadAllAssets();
  }, []);

  return {
    isLoading,
    loadedCount,
    totalImages: BANNER_IMAGES.length,
    totalAnimations: JSON_ANIMATIONS.length,
    totalAssets,
    progress: Math.round((loadedCount / totalAssets) * 100)
  };
};
