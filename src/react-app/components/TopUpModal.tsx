import { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { formatTonBalance } from '../utils/formatBalance';

const toncoinActiveIcon = 'https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/toncoin_active.svg';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBalanceUpdate: () => void;
  currentBalance: string;
}

export default function TopUpModal({ isOpen, onClose, onBalanceUpdate, currentBalance }: TopUpModalProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState('');
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  // Load fonts
  useEffect(() => {
    const fontFaceSemiBold = new FontFace(
      'Gilroy-SemiBold',
      'url(https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/Gilroy-SemiBold.ttf)'
    );
    
    const fontFaceBold = new FontFace(
      'Gilroy-Bold',
      'url(https://mocha-cdn.com/0198a776-c098-782e-aca7-9f91e506f953/Gilroy-Bold.ttf)'
    );
    
    fontFaceSemiBold.load().then((loadedFont) => {
      document.fonts.add(loadedFont);
    }).catch((error) => {
      console.error('Error loading Gilroy-SemiBold font:', error);
    });

    fontFaceBold.load().then((loadedFont) => {
      document.fonts.add(loadedFont);
    }).catch((error) => {
      console.error('Error loading Gilroy-Bold font:', error);
    });
  }, []);

  const handleClose = () => {
    setAmount('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      // Если сумма не введена, ничего не делаем
      return;
    }

    if (!wallet) {
      setError('Кошелек не подключен');
      return;
    }

    if (numAmount < 0.01) {
      setError('Минимальная сумма: 0.01 TON');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const addressResponse = await fetch('/api/wallet/receiving-address');
      if (!addressResponse.ok) {
        throw new Error('Failed to get receiving address');
      }
      
      const { address: destinationAddress } = await addressResponse.json();
      
      if (!destinationAddress) {
        throw new Error('Receiving address not configured');
      }

      const nanoAmount = Math.floor(numAmount * 1000000000);

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: destinationAddress,
            amount: nanoAmount.toString(),
          }
        ]
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      
      if (result) {
        try {
          const initData = window.Telegram?.WebApp?.initData;
          if (!initData) {
            throw new Error('No Telegram WebApp data available');
          }

          const topupResponse = await fetch('/api/user/topup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              initData, 
              amount: numAmount,
              transactionHash: result.boc
            }),
          });

          if (topupResponse.ok) {
            onBalanceUpdate();
            
            handleClose();
          } else {
            throw new Error('Failed to update balance');
          }
        } catch (error) {
          console.error('Error updating balance:', error);
          setError('Ошибка при обновлении баланса');
        }
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      if (error.message?.includes('user declined')) {
        setError('Транзакция отклонена пользователем');
      } else {
        setError('Ошибка при отправке транзакции');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = ['1', '5', '10', '100'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={handleClose}>
      <div 
        className="bg-white mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '358px',
          height: '508px',
          borderRadius: '20px',
          backgroundColor: '#111A21',
          border: '1px solid transparent',
          backgroundImage: 'linear-gradient(#111A21, #111A21), linear-gradient(to bottom, #223442, #141F28)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          paddingTop: '21px',
          paddingBottom: '10px'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '20px', marginLeft: '22px', marginRight: '22px' }}>
          <h2 className="text-xl font-gilroy-bold text-white">
            Пополнение баланса
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg width="31" height="31" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Current Balance */}
        <div className="rounded-lg" style={{ 
          backgroundColor: '#1D252C', 
          width: '314px', 
          height: '90px', 
          borderRadius: '20px',
          marginBottom: '20px',
          padding: '19px 18px',
          marginLeft: '22px'
        }}>
          <div className="font-gilroy-semibold" style={{ 
            color: '#445768',
            fontSize: '14px',
            marginBottom: '3px'
          }}>
            Текущий баланс
          </div>
          <div className="font-gilroy-bold text-white" style={{
            fontSize: '22px'
          }}>
            {formatTonBalance(currentBalance)} TON
          </div>
        </div>

        

        {/* Amount Input */}
        <div style={{ marginTop: '20px', marginLeft: '22px', marginRight: '22px' }}>
          <label className="block font-gilroy-semibold" style={{ color: '#445768', fontSize: '14px', marginBottom: '10px' }}>
            Сумма пополнения
          </label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="font-gilroy-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                width: '314px',
                height: '64px',
                fontSize: '20px',
                backgroundColor: '#1D252C',
                border: '1px solid #303E4A',
                borderRadius: '20px',
                paddingLeft: '20px',
                paddingRight: '60px',
                paddingTop: '3px',
                color: amount ? '#FFFFFF' : '#445768'
              }}
            />
            <style>{`
              input::placeholder {
                color: #445768 !important;
                font-family: 'Gilroy-Bold', sans-serif;
                font-size: 20px;
              }
            `}</style>
            <img 
              src={toncoinActiveIcon} 
              alt="TON" 
              className="absolute right-5 top-1/2 transform -translate-y-1/2"
              style={{ width: '29px', height: '29px' }}
            />
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div style={{ marginTop: '20px', marginBottom: '20px', marginLeft: '22px', marginRight: '22px' }}>
          <div className="font-gilroy-semibold" style={{ color: '#445768', fontSize: '14px', marginBottom: '10px' }}>
            Быстрый выбор
          </div>
          <div className="flex gap-[10px]">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount)}
                className="font-gilroy-semibold text-white hover:bg-blue-600 transition-colors"
                style={{
                  width: '71px',
                  height: '44px',
                  backgroundColor: '#1D252C',
                  border: '1px solid #303E4A',
                  borderRadius: '20px'
                }}
              >
                {quickAmount}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginLeft: '22px', marginRight: '22px' }}>
          <button
            onClick={handleTopUp}
            disabled={isLoading || !wallet}
            className="font-gilroy-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              width: '314px',
              height: '44px',
              borderRadius: '20px',
              fontSize: '14px',
              background: amount && !isLoading 
                ? 'linear-gradient(135deg, #0072EE 0%, #1686FF 100%)'
                : '#303E4A',
              border: 'none'
            }}
          >
            {isLoading ? 'Отправка...' : amount ? `Оплатить ${amount} TON` : 'Оплатить'}
          </button>
        </div>

        {/* Info */}
        <div className="font-gilroy-semibold text-center" style={{ marginTop: '16px', fontSize: '12px', color: '#445768', marginLeft: '22px', marginRight: '22px' }}>
          Транзакция будет отправлена через ваш TON кошелек
        </div>

        
      </div>
    </div>
  );
}
