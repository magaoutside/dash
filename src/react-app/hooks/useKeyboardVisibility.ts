import { useEffect, useState } from 'react';

export const useKeyboardVisibility = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Проверяем, что мы на мобильном устройстве
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
      return;
    }

    let isInputFocused = false;
    const initialViewportHeight = window.visualViewport?.height || window.innerHeight;

    const checkKeyboardVisibility = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDiff = initialViewportHeight - currentHeight;
      return heightDiff > 100; // Снижаем порог для более точной детекции
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        isInputFocused = true;
        // Немедленно скрываем футер при фокусе на поле ввода
        setIsKeyboardVisible(true);
        
        // Дополнительная проверка через небольшую задержку
        setTimeout(() => {
          if (isInputFocused && checkKeyboardVisibility()) {
            setIsKeyboardVisible(true);
          }
        }, 100);
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        isInputFocused = false;
        
        // Показываем футер обратно после выхода из поля ввода
        // Используем небольшую задержку чтобы избежать мерцания при переключении между полями
        setTimeout(() => {
          if (!isInputFocused) {
            setIsKeyboardVisible(false);
          }
        }, 100);
      }
    };

    const handleVisualViewportChange = () => {
      if (isInputFocused) {
        const isKeyboardOpen = checkKeyboardVisibility();
        setIsKeyboardVisible(isKeyboardOpen);
      }
    };

    // Слушаем события фокуса
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);

    // Слушаем изменения viewport
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    } else {
      window.addEventListener('resize', handleVisualViewportChange);
    }

    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      } else {
        window.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []);

  return isKeyboardVisible;
};
