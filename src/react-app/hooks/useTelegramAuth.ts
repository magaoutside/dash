import { useState, useEffect } from 'react';
import { TelegramUser } from '../../shared/types';
import { preloadUserAvatar } from './useImagePreloader';

// Telegram types are now defined in vite-env.d.ts

// Глобальный кеш для данных пользователя
let globalUserCache: TelegramUser | null = null;
let globalIsLoading = true;
let globalError: string | null = null;

// Массив колбеков для уведомления компонентов об изменениях
const subscribers: Array<(user: TelegramUser | null, isLoading: boolean, error: string | null) => void> = [];

// Функция для уведомления всех подписчиков
const notifySubscribers = () => {
  subscribers.forEach(callback => {
    callback(globalUserCache, globalIsLoading, globalError);
  });
};

// Флаг для отслеживания, была ли уже выполнена аутентификация
let authenticationAttempted = false;

// Получение реферального кода из URL
const getReferralCodeFromUrl = (): string | null => {
  try {
    // Проверяем URL параметры
    const urlParams = new URLSearchParams(window.location.search);
    const startApp = urlParams.get('startapp');
    
    if (startApp && startApp.startsWith('ref_')) {
      return startApp;
    }

    // Также проверяем Telegram WebApp start_param
    const initDataUnsafe = window.Telegram?.WebApp?.initDataUnsafe as any;
    if (initDataUnsafe?.start_param) {
      const startParam = initDataUnsafe.start_param;
      if (startParam.startsWith('ref_')) {
        return startParam;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting referral code from URL:', error);
    return null;
  }
};

// Основная функция аутентификации
const authenticateUser = async () => {
  if (authenticationAttempted) {
    return;
  }
  
  authenticationAttempted = true;
  globalIsLoading = true;
  globalError = null;
  notifySubscribers();

  try {
    // Проверяем, запущено ли приложение в Telegram WebApp
    if (!window.Telegram?.WebApp) {
      globalIsLoading = false;
      notifySubscribers();
      return;
    }

    const webApp = window.Telegram.WebApp;
    webApp.ready();

    // Получаем initData
    const initData = webApp.initData;
    
    if (!initData) {
      globalIsLoading = false;
      notifySubscribers();
      return;
    }

    // Получаем реферальный код из URL если есть
    const referralCode = getReferralCodeFromUrl();

    // Отправляем данные на сервер для верификации
    const response = await fetch('/api/auth/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData, referralCode }),
    });

    const result = await response.json();
    
    if (result.success && result.user) {
      globalUserCache = result.user;
      
      // Предзагружаем аватарку пользователя, если она есть
      if (result.user.photo_url) {
        try {
          await preloadUserAvatar(result.user.photo_url);
        } catch (error) {
          console.warn('Failed to preload user avatar:', error);
        }
      }
    } else {
      globalError = result.error || 'Authentication failed';
    }
  } catch (err) {
    globalError = 'Authentication error';
    console.error('Auth error:', err);
  } finally {
    globalIsLoading = false;
    notifySubscribers();
  }
};

export function useTelegramAuth() {
  const [user, setUser] = useState<TelegramUser | null>(globalUserCache);
  const [isLoading, setIsLoading] = useState(globalIsLoading);
  const [error, setError] = useState<string | null>(globalError);

  useEffect(() => {
    // Создаем колбек для этого компонента
    const updateState = (newUser: TelegramUser | null, newIsLoading: boolean, newError: string | null) => {
      setUser(newUser);
      setIsLoading(newIsLoading);
      setError(newError);
    };

    // Добавляем колбек в список подписчиков
    subscribers.push(updateState);

    // Инициируем аутентификацию, если она еще не была выполнена
    if (!authenticationAttempted) {
      authenticateUser();
    } else {
      // Если аутентификация уже была выполнена, просто обновляем состояние
      updateState(globalUserCache, globalIsLoading, globalError);
    }

    // Cleanup: удаляем колбек при размонтировании
    return () => {
      const index = subscribers.indexOf(updateState);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    };
  }, []);

  return { user, isLoading, error };
}

// Функция для получения кешированных данных пользователя (может быть полезна для других компонентов)
export const getCachedUser = (): TelegramUser | null => {
  return globalUserCache;
};
