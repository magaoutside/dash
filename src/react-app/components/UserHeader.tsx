import { useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react';
import { useState, useEffect, useRef } from 'react';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { useBalance } from '../hooks/useBalance';
import { formatTonBalance } from '../utils/formatBalance';
import TopUpModal from './TopUpModal';
const toncoinIcon = 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/toncoin_active.svg';

interface UserHeaderProps {
  onModalStateChange?: (isOpen: boolean) => void;
  isLocked?: boolean;
}

export default function UserHeader({ onModalStateChange, isLocked = false }: UserHeaderProps) {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const userFriendlyAddress = useTonAddress();
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const walletButtonRef = useRef<HTMLButtonElement>(null);
  const walletModalRef = useRef<HTMLDivElement>(null);
  const { user: telegramUser } = useTelegramAuth();
  const { balance, updateBalance } = useBalance();

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleConnectWallet = () => {
    tonConnectUI.openModal();
  };

  const handleDisconnectWallet = () => {
    tonConnectUI.disconnect();
    setIsWalletModalOpen(false);
  };

  const handleWalletButtonClick = () => {
    setIsWalletModalOpen(!isWalletModalOpen);
    setIsCopied(false);
  };

  const handleTopUpClick = () => {
    if (wallet) {
      setIsTopUpModalOpen(true);
      onModalStateChange?.(true);
    } else {
      tonConnectUI.openModal();
    }
  };

  const handleBalanceUpdate = () => {
    updateBalance();
  };

  const handleTopUpModalClose = () => {
    setIsTopUpModalOpen(false);
    onModalStateChange?.(false);
  };

  // Close wallet modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        walletButtonRef.current && !walletButtonRef.current.contains(event.target as Node) &&
        walletModalRef.current && !walletModalRef.current.contains(event.target as Node)
      ) {
        setIsWalletModalOpen(false);
      }
    };

    if (isWalletModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isWalletModalOpen]);

  // Сохраняем подключенный кошелек в базу данных
  useEffect(() => {
    const saveWalletToDatabase = async () => {
      if (wallet && userFriendlyAddress && telegramUser) {
        try {
          const initData = window.Telegram?.WebApp?.initData;
          if (!initData) return;

          await fetch('/api/user/save-wallet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              initData,
              walletAddress: userFriendlyAddress
            }),
          });
        } catch (error) {
          console.error('Failed to save wallet:', error);
        }
      }
    };

    saveWalletToDatabase();
  }, [wallet, userFriendlyAddress, telegramUser]);

  return (
    <div className="flex items-center justify-between p-4 mb-0 w-full max-w-[412px]" style={{
      backgroundColor: '#060E15',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      opacity: isLocked ? 0.5 : 1,
      pointerEvents: isLocked ? 'none' : 'auto',
      transition: 'opacity 0.3s ease'
    }}>
      <div className="flex items-center space-x-3">
        {/* User Avatar */}
        <div className="rounded-full flex items-center justify-center overflow-hidden" style={{ width: '40px', height: '40px' }}>
          {telegramUser?.photo_url && (
            <img 
              src={telegramUser.photo_url} 
              alt="Avatar" 
              className="w-full h-full object-cover rounded-full"
              style={{ imageRendering: 'auto' }}
            />
          )}
        </div>
        
        {/* Balance */}
        <div className="flex items-center" style={{ backgroundColor: '#10273A', borderRadius: '18px', height: '31px', paddingLeft: '6px', paddingRight: '6px' }}>
          <img 
            src={toncoinIcon} 
            alt="TON" 
            className="w-6 h-6 flex-shrink-0"
            style={{ marginRight: '5px' }}
          />
          <span className="text-white font-gilroy-bold whitespace-nowrap" style={{ fontSize: '13px', marginRight: '5px' }}>
            {formatTonBalance(balance)} TON
          </span>
          <button 
            onClick={handleTopUpClick}
            className="relative flex-shrink-0 hover:scale-110 transition-transform duration-200"
          >
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1V9M1 5H9" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </button>
        </div>
      </div>
      
      {/* Connect/Disconnect Wallet Button */}
      {wallet ? (
        <div className="relative">
          <button 
            ref={walletButtonRef}
            onClick={handleWalletButtonClick}
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors duration-200 font-gilroy-bold" 
            style={{borderRadius: '18px', fontSize: '13px', width: '120px', height: '31px'}}
          >
            <span>{formatAddress(userFriendlyAddress)}</span>
            <img 
              src="https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/wallet.svg" 
              alt="Wallet" 
              className="w-[10px] h-[6px]"
              style={{ marginLeft: '10px' }}
            />
          </button>
          
          {/* Wallet Modal */}
          {isWalletModalOpen && (
            <div 
              ref={walletModalRef}
              className="absolute bg-gray-800 text-white rounded-lg shadow-lg z-50"
              style={{
                top: '41px', // 31px height + 10px margin
                right: '0',
                width: '193px',
                height: '88px',
                backgroundColor: '#1D252C',
                border: '1px solid #303E4A',
                borderRadius: '20px',
                padding: '5px'
              }}
            >
              {/* Copy Address Block */}
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(userFriendlyAddress);
                    setIsCopied(true);
                    setTimeout(() => {
                      setIsCopied(false);
                    }, 1500);
                  } catch (error) {
                    console.error('Failed to copy address:', error);
                  }
                }}
                className="w-full flex items-center justify-between font-gilroy-semibold text-white transition-colors rounded-lg"
                style={{ 
                  width: '183px',
                  height: '35px',
                  fontSize: '14px',
                  padding: '0 12px',
                  marginBottom: '2.5px'
                }}
              >
                <span>{isCopied ? 'Скопировано!' : 'Скопировать адрес'}</span>
                <img 
                  src="https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/link.svg" 
                  alt="Copy" 
                  className="flex-shrink-0"
                  style={{ width: '12px', height: '12px' }}
                />
              </button>
              
              {/* Separator Line */}
              <div 
                style={{
                  width: '160px',
                  height: '0px',
                  border: '0.5px solid #303E4A',
                  borderRadius: '10px',
                  marginTop: '2.5px',
                  marginBottom: '2.5px',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}
              />
              
              {/* Disconnect Wallet Block */}
              <button
                onClick={handleDisconnectWallet}
                className="w-full flex items-center justify-between font-gilroy-semibold text-white transition-colors rounded-lg"
                style={{ 
                  width: '183px',
                  height: '35px',
                  fontSize: '14px',
                  padding: '0 12px',
                  marginTop: '2.5px'
                }}
              >
                <span>Отвязать кошелек</span>
                <img 
                  src="https://mocha-cdn.com/01990b73-5e28-7a72-9a6d-da1dca8210e1/disconnect.svg" 
                  alt="Disconnect" 
                  className="flex-shrink-0"
                  style={{ width: '11px', height: '12px' }}
                />
              </button>
            </div>
          )}
        </div>
      ) : (
        <button 
          onClick={handleConnectWallet}
          className="bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors duration-200 font-gilroy-bold" 
          style={{borderRadius: '18px', fontSize: '13px', width: '160px', height: '31px'}}
        >
          Подключить кошелёк
        </button>
      )}

      {/* Top Up Modal */}
      <TopUpModal 
        isOpen={isTopUpModalOpen}
        onClose={handleTopUpModalClose}
        onBalanceUpdate={handleBalanceUpdate}
        currentBalance={balance}
      />
    </div>
  );
}
