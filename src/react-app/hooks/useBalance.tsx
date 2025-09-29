import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTelegramAuth } from './useTelegramAuth';

interface BalanceContextType {
  balance: string;
  starsBalance: string;
  isLoading: boolean;
  updateBalance: () => Promise<void>;
  updateStarsBalance: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshStarsBalance?: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

// Массив колбеков для уведомления компонентов об изменениях
const subscribers: Array<(balance: string, starsBalance: string, isLoading: boolean) => void> = [];

// Функция для уведомления всех подписчиков
const notifySubscribers = (balance: string, starsBalance: string, isLoading: boolean) => {
  subscribers.forEach(callback => {
    callback(balance, starsBalance, isLoading);
  });
};

// Основная функция загрузки баланса
const fetchBalanceFromServer = async (telegramUser: any): Promise<{balanceTon: string, balanceStars: string}> => {
  if (!telegramUser) {
    return {balanceTon: '0.00', balanceStars: '0'};
  }

  try {
    // Get Telegram WebApp initData
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) {
      console.warn('No Telegram WebApp data available');
      return {balanceTon: '0.00', balanceStars: '0'};
    }

    const response = await fetch('/api/user/balance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }),
    });

    if (response.ok) {
      const data = await response.json();
      return {balanceTon: data.balanceTon, balanceStars: data.balanceStars.toString()};
    } else {
      return {balanceTon: '0.00', balanceStars: '0'};
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
    return {balanceTon: '0.00', balanceStars: '0'};
  }
};

export function BalanceProvider({ children }: { children: ReactNode }) {
  const { user: telegramUser } = useTelegramAuth();
  const [balance, setBalance] = useState<string>('0.00');
  const [starsBalance, setStarsBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(true);

  // Функция для обновления баланса - теперь всегда загружает из БД
  const updateBalance = async () => {
    await refreshBalance();
  };

  // Функция для обновления баланса Stars - теперь всегда загружает из БД
  const updateStarsBalance = async () => {
    await refreshStarsBalance();
  };

  // Функция для принудительного обновления только Stars баланса
  const refreshStarsBalance = async () => {
    if (!telegramUser) return;
    
    try {
      const balances = await fetchBalanceFromServer(telegramUser);
      notifySubscribers(balance, balances.balanceStars, false);
    } catch (error) {
      console.error('Error refreshing Stars balance:', error);
    }
  };

  // Функция для принудительного обновления баланса
  const refreshBalance = async () => {
    if (!telegramUser) return;
    
    notifySubscribers(balance, starsBalance, true);
    
    try {
      const balances = await fetchBalanceFromServer(telegramUser);
      notifySubscribers(balances.balanceTon, balances.balanceStars, false);
    } catch (error) {
      console.error('Error refreshing balance:', error);
      notifySubscribers('0.00', '0', false);
    }
  };

  useEffect(() => {
    // Создаем колбек для этого компонента
    const updateState = (newBalance: string, newStarsBalance: string, newIsLoading: boolean) => {
      setBalance(newBalance);
      setStarsBalance(newStarsBalance);
      setIsLoading(newIsLoading);
    };

    // Добавляем колбек в список подписчиков
    subscribers.push(updateState);

    // Загружаем баланс при инициализации
    if (telegramUser) {
      refreshBalance();
    }

    // Cleanup: удаляем колбек при размонтировании
    return () => {
      const index = subscribers.indexOf(updateState);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    };
  }, [telegramUser]);

  // Удалено автоматическое обновление каждые 30 секунд
  // Баланс теперь обновляется только при операциях

  return (
    <BalanceContext.Provider value={{ balance, starsBalance, isLoading, updateBalance, updateStarsBalance, refreshBalance, refreshStarsBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
}
