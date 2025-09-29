import { Hono } from "hono";
import { cors } from 'hono/cors';
import CryptoJS from 'crypto-js';
import { TelegramWebAppInitDataSchema, TelegramUser } from '../shared/types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// Telegram Bot Webhook
app.post('/api/telegram/webhook', async (c) => {
  try {
    const update = await c.req.json();
    
    // Handle pre-checkout query (payment confirmation)
    if (update.pre_checkout_query) {
      const query = update.pre_checkout_query;

      // Always approve the payment
      const approveResponse = await fetch(`https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pre_checkout_query_id: query.id,
          ok: true
        })
      });

      if (!approveResponse.ok) {
        console.error('Failed to approve pre-checkout query:', await approveResponse.text());
      }

      return c.json({ ok: true });
    }

    // Handle /start command
    if (update.message && update.message.text === '/start') {
      const chatId = update.message.chat.id;
      
      // Отправляем ответ на команду /start
      const botResponse = {
        method: 'sendMessage',
        chat_id: chatId,
        text: '🎁 Try your luck in daily gift raffles at @case 🎮\n✨ Open cases and win amazing prizes every day!',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Приложение',
                web_app: {
                  url: 'https://dashgames.mocha.app'
                }
              }
            ],
            [
              {
                text: 'Комьюнити',
                url: 'https://t.me/dash_community'
              }
            ]
          ]
        }
      };

      // Отправляем сообщение через Telegram Bot API
      const telegramResponse = await fetch(`https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(botResponse),
      });

      if (!telegramResponse.ok) {
        console.error('Failed to send Telegram message:', await telegramResponse.text());
        return c.json({ error: 'Failed to send message' }, 500);
      }
    }

    // Handle successful payment
    if (update.message && update.message.successful_payment) {
      const payment = update.message.successful_payment;
      const userId = update.message.from.id.toString();
      
      try {
        // Parse the JSON payload
        const payload = JSON.parse(payment.invoice_payload);
        const amount = payload.amount; // Amount in Stars
        const paymentType = payload.type || 'topup';
        
        if (paymentType === 'topup') {
          // Update user balance for topup
          await c.env.DB.prepare(`
            INSERT INTO user_balances (user_id, balance_ton, balance_stars) 
            VALUES (?, 0, ?)
            ON CONFLICT(user_id) DO UPDATE SET 
              balance_stars = balance_stars + ?,
              updated_at = CURRENT_TIMESTAMP
          `).bind(userId, amount, amount).run();

          console.log(`Successfully processed Stars topup: ${amount} Stars for user ${userId}`);
        } else if (paymentType === 'case_purchase') {
          // For case purchases, don't add to balance - it's a direct payment
          console.log(`Successfully processed Stars case purchase: ${amount} Stars for user ${userId}`);
          console.log(`Case details: ${payload.casePrice} TON x${payload.multiplier}`);
        }

        // Note: Referral rewards for Stars payments removed - now only based on game results

        // Record the transaction
        await c.env.DB.prepare(
          'INSERT INTO payment_transactions (user_id, amount, currency, transaction_hash, status) VALUES (?, ?, ?, ?, ?)'
        ).bind(userId, amount, 'stars', payment.telegram_payment_charge_id, 'completed').run();
        
      } catch (error) {
        console.error('Failed to process payment:', error);
      }
    }

    return c.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return c.json({ error: 'Webhook error' }, 500);
  }
});

// Верификация Telegram WebApp InitData
function verifyTelegramWebAppData(initData: string, botToken: string): { isValid: boolean; user?: TelegramUser } {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      return { isValid: false };
    }

    // Удаляем hash из параметров для проверки
    urlParams.delete('hash');
    
    // Сортируем параметры и создаем строку для проверки
    const params: [string, string][] = [];
    urlParams.forEach((value, key) => {
      params.push([key, value]);
    });
    
    const dataCheckString = params
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаем секретный ключ
    const secretKey = CryptoJS.HmacSHA256(botToken, 'WebAppData');
    
    // Вычисляем hash
    const calculatedHash = CryptoJS.HmacSHA256(dataCheckString, secretKey).toString();

    if (calculatedHash !== hash) {
      return { isValid: false };
    }

    // Проверяем время (данные должны быть не старше 24 часов)
    const authDate = parseInt(urlParams.get('auth_date') || '0');
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (currentTime - authDate > 86400) { // 24 часа
      return { isValid: false };
    }

    // Парсим данные пользователя
    const userDataString = urlParams.get('user');
    if (!userDataString) {
      return { isValid: false };
    }

    const userData = JSON.parse(decodeURIComponent(userDataString));
    const validatedUser = TelegramWebAppInitDataSchema.shape.user.parse(userData);

    return { isValid: true, user: validatedUser };
  } catch (error) {
    console.error('Verification error:', error);
    return { isValid: false };
  }
}

// Генерация реферального кода для пользователя
function generateReferralCode(userId: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 10;
  let result = '';
  
  // Используем userId как seed для генерации детерминированного кода
  const seed = parseInt(userId) || 12345;
  let random = seed;
  
  for (let i = 0; i < length; i++) {
    random = (random * 1103515245 + 12345) & 0x7fffffff;
    result += chars[random % chars.length];
  }
  
  return `ref_${result}`;
}

// Определение процента реферальной награды на основе статистики реферера
async function getReferralRewardPercentage(db: any, referrerId: string): Promise<number> {
  try {
    // Получаем количество рефералов
    const referralCount = await db.prepare(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?'
    ).bind(referrerId).first();

    // Получаем общую сумму заработанных средств от рефералов (только положительные)
    const earnedResult = await db.prepare(
      'SELECT SUM(amount) as total FROM referral_earnings WHERE referrer_id = ? AND currency = ? AND amount > 0'
    ).bind(referrerId, 'ton').first();

    const totalReferrals = referralCount?.count || 0;
    const totalEarned = Number(earnedResult?.total || 0);

    // Определяем процент на основе условий (проверяем от высшего к низшему)
    if (totalReferrals >= 6000 || totalEarned >= 6000) {
      return 0.50; // 50%
    } else if (totalReferrals >= 500 || totalEarned >= 500) {
      return 0.30; // 30%
    } else if (totalReferrals >= 100 || totalEarned >= 250) {
      return 0.18; // 18%
    } else if (totalReferrals >= 15 || totalEarned >= 100) {
      return 0.13; // 13%
    } else if (totalReferrals >= 1 || totalEarned >= 0) {
      return 0.10; // 10%
    } else {
      return 0; // Нет прав на реферальные награды
    }
  } catch (error) {
    console.error('Failed to get referral reward percentage:', error);
    return 0.10; // Базовый процент в случае ошибки
  }
}

// Обработка реферальных наград на основе игровых результатов
async function processGameReferralReward(db: any, refereeId: string, gameType: 'case' | 'axes', betAmount: number, winAmount: number): Promise<void> {
  try {
    // Ищем реферера для данного пользователя
    const referralInfo = await db.prepare(
      'SELECT referrer_id FROM referrals WHERE referee_id = ?'
    ).bind(refereeId).first();

    if (!referralInfo) {
      // Пользователь не является рефералом, награда не начисляется
      return;
    }

    const referrerId = referralInfo.referrer_id;
    const netResult = winAmount - betAmount; // Чистый результат игры
    
    // Получаем процент для данного реферера
    const rewardPercentage = await getReferralRewardPercentage(db, referrerId);
    
    if (rewardPercentage === 0) {
      // У реферера нет прав на награды
      return;
    }
    
    let rewardAmount = 0;
    let transactionType = '';

    if (netResult < 0) {
      // Проигрыш - начисляем процент от потери владельцу реф ссылки
      rewardAmount = Math.abs(netResult) * rewardPercentage;
      transactionType = `${gameType}_loss`;
      
      // Начисляем награду рефереру
      await db.prepare(`
        INSERT INTO user_balances (user_id, balance_ton, balance_stars) 
        VALUES (?, ?, 0)
        ON CONFLICT(user_id) DO UPDATE SET 
          balance_ton = balance_ton + ?,
          updated_at = CURRENT_TIMESTAMP
      `).bind(referrerId, rewardAmount, rewardAmount).run();

      console.log(`Referral reward for loss: +${rewardAmount} TON (${(rewardPercentage*100).toFixed(0)}%) for referrer ${referrerId} from referee ${refereeId} loss of ${Math.abs(netResult)} TON`);
    } else if (netResult > 0) {
      // Выигрыш - вычитаем процент от выигрыша у владельца реф ссылки
      rewardAmount = netResult * rewardPercentage;
      transactionType = `${gameType}_win`;
      
      // Получаем текущий баланс реферера
      const referrerBalance = await db.prepare(
        'SELECT balance_ton FROM user_balances WHERE user_id = ?'
      ).bind(referrerId).first();

      if (referrerBalance && Number(referrerBalance.balance_ton) >= rewardAmount) {
        // Вычитаем сумму с баланса реферера
        await db.prepare(`
          UPDATE user_balances 
          SET balance_ton = balance_ton - ?, updated_at = CURRENT_TIMESTAMP 
          WHERE user_id = ?
        `).bind(rewardAmount, referrerId).run();

        // Записываем как отрицательную награду
        rewardAmount = -rewardAmount;
        
        console.log(`Referral deduction for win: ${rewardAmount} TON (${(rewardPercentage*100).toFixed(0)}%) from referrer ${referrerId} due to referee ${refereeId} win of ${netResult} TON`);
      } else {
        // Недостаточно средств для вычитания - не вычитаем
        console.log(`Insufficient funds for referral deduction: referrer ${referrerId} has ${referrerBalance?.balance_ton || 0} TON, needed ${rewardAmount} TON`);
        return;
      }
    } else {
      // Нулевой результат - ничего не делаем
      return;
    }

    // Записываем информацию о реферальной награде/вычете
    await db.prepare(
      'INSERT INTO referral_earnings (referrer_id, referee_id, amount, currency, transaction_type) VALUES (?, ?, ?, ?, ?)'
    ).bind(referrerId, refereeId, rewardAmount, 'ton', transactionType).run();

  } catch (error) {
    console.error('Failed to process game referral reward:', error);
  }
}

// Авторизация пользователя через Telegram WebApp
app.post('/api/auth/telegram', async (c) => {
  try {
    const { initData, referralCode } = await c.req.json();
    
    if (!initData) {
      return c.json({ success: false, error: 'No init data provided' }, 400);
    }

    const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
    
    if (!verification.isValid || !verification.user) {
      return c.json({ success: false, error: 'Invalid init data' }, 401);
    }

    const userId = verification.user.id.toString();

    // Получаем IP адрес пользователя
    const userIp = c.req.header('CF-Connecting-IP') || 
                   c.req.header('X-Forwarded-For') || 
                   c.req.header('X-Real-IP') || 
                   'unknown';

    // Обрабатываем реферальный код, если он был передан (СНАЧАЛА проверяем реферал)
    if (referralCode && referralCode.startsWith('ref_')) {
      try {
        // Проверяем, что пользователь еще не использовал реферальную ссылку
        const existingReferral = await c.env.DB.prepare(
          'SELECT id FROM referrals WHERE referee_id = ?'
        ).bind(userId).first();

        // Проверяем, что пользователь не был ранее зарегистрирован в системе
        // (проверяем наличие баланса или реферального кода)
        const existingUser = await c.env.DB.prepare(
          'SELECT id FROM user_balances WHERE user_id = ? UNION SELECT id FROM referral_codes WHERE user_id = ?'
        ).bind(userId, userId).first();

        // Засчитываем реферал только если:
        // 1. Пользователь еще не был рефералом
        // 2. Пользователь впервые в системе (нет баланса и реферального кода)
        if (!existingReferral && !existingUser) {
          // Ищем владельца реферального кода
          const referrer = await c.env.DB.prepare(
            'SELECT user_id FROM referral_codes WHERE referral_code = ?'
          ).bind(referralCode).first();

          // Проверяем, что это не сам пользователь
          if (referrer && referrer.user_id !== userId) {
            // Создаем запись о реферале
            await c.env.DB.prepare(
              'INSERT INTO referrals (referrer_id, referee_id, referral_code) VALUES (?, ?, ?)'
            ).bind(referrer.user_id, userId, referralCode).run();
            
            console.log(`✅ New referral created: ${referrer.user_id} -> ${userId} via ${referralCode}`);
          }
        } else {
          console.log(`❌ Referral not created for ${userId}: existingReferral=${!!existingReferral}, existingUser=${!!existingUser}`);
        }
      } catch (error) {
        console.error('Failed to process referral:', error);
      }
    }

    // Генерируем и сохраняем реферальный код для пользователя (если еще нет) - ПОСЛЕ обработки реферала
    const userReferralCode = generateReferralCode(userId);
    
    try {
      await c.env.DB.prepare(
        'INSERT INTO referral_codes (user_id, referral_code) VALUES (?, ?) ON CONFLICT(user_id) DO NOTHING'
      ).bind(userId, userReferralCode).run();
    } catch (error) {
      console.error('Failed to create referral code:', error);
    }

    // Создаем или обновляем баланс пользователя с IP-адресом
    try {
      await c.env.DB.prepare(`
        INSERT INTO user_balances (user_id, balance_ton, balance_stars, user_ip) 
        VALUES (?, 0, 0, ?)
        ON CONFLICT(user_id) DO UPDATE SET 
          user_ip = ?,
          updated_at = CURRENT_TIMESTAMP
      `).bind(userId, userIp, userIp).run();
    } catch (error) {
      console.error('Failed to update user balance with IP:', error);
    }

    return c.json({ success: true, user: verification.user });
  } catch (error) {
    console.error('Auth error:', error);
    return c.json({ success: false, error: 'Authentication failed' }, 500);
  }
});

// Банк API удален - топоры больше не используются

// Спины API удален - топоры больше не используются

// Получить последние выигрыши из кейсов
app.get('/api/sync/case-wins', async (c) => {
  try {
    const since = c.req.query('since');
    const sinceTimestamp = since ? parseInt(since) : Date.now() - 60000; // По умолчанию последняя минута
    
    const wins = await c.env.DB.prepare(
      'SELECT timestamp, user_data, gift_name, gift_icon, gift_background FROM case_wins WHERE timestamp > ? ORDER BY timestamp DESC LIMIT 10'
    ).bind(sinceTimestamp).all();

    // Парсим данные пользователей
    const parsedWins = (wins.results || []).map((win: any) => ({
      timestamp: win.timestamp,
      user: win.user_data ? JSON.parse(win.user_data) : null,
      giftName: win.gift_name,
      giftIcon: win.gift_icon,
      giftBackground: win.gift_background
    }));

    return c.json({ wins: parsedWins });
  } catch (error) {
    console.error('Get case wins error:', error);
    return c.json({ error: 'Failed to get case wins' }, 500);
  }
});

// Уведомление о выигрыше в кейсе
app.post('/api/sync/notify-case-win', async (c) => {
  try {
    const { timestamp, initData, giftName, giftIcon, giftBackground } = await c.req.json();
    
    if (!timestamp || typeof timestamp !== 'number') {
      return c.json({ error: 'Invalid timestamp' }, 400);
    }
    
    // Верифицируем пользователя
    let userData = null;
    if (initData) {
      const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
      if (verification.isValid && verification.user) {
        userData = verification.user;
      }
    }
    
    // Записываем событие выигрыша в базу данных
    await c.env.DB.prepare(
      'INSERT INTO case_wins (timestamp, user_data, gift_name, gift_icon, gift_background) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      timestamp,
      userData ? JSON.stringify(userData) : null,
      giftName || null,
      giftIcon || null,
      giftBackground || null
    ).run();
    
    // Очищаем старые события (старше 5 минут)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    await c.env.DB.prepare(
      'DELETE FROM case_wins WHERE timestamp < ?'
    ).bind(fiveMinutesAgo).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Notify case win error:', error);
    return c.json({ error: 'Failed to notify case win' }, 500);
  }
});

// Уведомление о выигрыше в апгрейде
app.post('/api/sync/notify-upgrade-win', async (c) => {
  try {
    const { timestamp, initData, giftName, giftIcon, giftBackground } = await c.req.json();
    
    if (!timestamp || typeof timestamp !== 'number') {
      return c.json({ error: 'Invalid timestamp' }, 400);
    }
    
    // Верифицируем пользователя
    let userData = null;
    if (initData) {
      const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
      if (verification.isValid && verification.user) {
        userData = verification.user;
      }
    }
    
    // Записываем событие выигрыша в базу данных
    await c.env.DB.prepare(
      'INSERT INTO upgrade_wins (timestamp, user_data, gift_name, gift_icon, gift_background) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      timestamp,
      userData ? JSON.stringify(userData) : null,
      giftName || null,
      giftIcon || null,
      giftBackground || null
    ).run();
    
    // Очищаем старые события (старше 5 минут)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    await c.env.DB.prepare(
      'DELETE FROM upgrade_wins WHERE timestamp < ?'
    ).bind(fiveMinutesAgo).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Notify upgrade win error:', error);
    return c.json({ error: 'Failed to notify upgrade win' }, 500);
  }
});

// Уведомление о выигрыше в минах
app.post('/api/sync/notify-mines-win', async (c) => {
  try {
    const { timestamp, initData, betAmount, winAmount, gemsFound, minesCount, multiplier } = await c.req.json();
    
    if (!timestamp || typeof timestamp !== 'number') {
      return c.json({ error: 'Invalid timestamp' }, 400);
    }
    
    // Верифицируем пользователя
    let userData = null;
    if (initData) {
      const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
      if (verification.isValid && verification.user) {
        userData = verification.user;
      }
    }
    
    // Записываем событие выигрыша в базу данных
    await c.env.DB.prepare(
      'INSERT INTO mines_wins (timestamp, user_data, bet_amount, win_amount, gems_found, mines_count, multiplier) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      timestamp,
      userData ? JSON.stringify(userData) : null,
      betAmount || null,
      winAmount || null,
      gemsFound || 0,
      minesCount || 0,
      multiplier || null
    ).run();
    
    // Очищаем старые события (старше 5 минут)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    await c.env.DB.prepare(
      'DELETE FROM mines_wins WHERE timestamp < ?'
    ).bind(fiveMinutesAgo).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Notify mines win error:', error);
    return c.json({ error: 'Failed to notify mines win' }, 500);
  }
});

// Получить последние выигрыши из апгрейдов
app.get('/api/sync/upgrade-wins', async (c) => {
  try {
    const since = c.req.query('since');
    const sinceTimestamp = since ? parseInt(since) : Date.now() - 60000; // По умолчанию последняя минута
    
    const wins = await c.env.DB.prepare(
      'SELECT timestamp, user_data, gift_name, gift_icon, gift_background FROM upgrade_wins WHERE timestamp > ? ORDER BY timestamp DESC LIMIT 10'
    ).bind(sinceTimestamp).all();

    // Парсим данные пользователей
    const parsedWins = (wins.results || []).map((win: any) => ({
      timestamp: win.timestamp,
      user: win.user_data ? JSON.parse(win.user_data) : null,
      giftName: win.gift_name,
      giftIcon: win.gift_icon,
      giftBackground: win.gift_background
    }));

    return c.json({ wins: parsedWins });
  } catch (error) {
    console.error('Get upgrade wins error:', error);
    return c.json({ error: 'Failed to get upgrade wins' }, 500);
  }
});

// Получить последние выигрыши из мин
app.get('/api/sync/mines-wins', async (c) => {
  try {
    const since = c.req.query('since');
    const sinceTimestamp = since ? parseInt(since) : Date.now() - 60000; // По умолчанию последняя минута
    
    const wins = await c.env.DB.prepare(
      'SELECT timestamp, user_data, bet_amount, win_amount, gems_found, mines_count, multiplier FROM mines_wins WHERE timestamp > ? ORDER BY timestamp DESC LIMIT 10'
    ).bind(sinceTimestamp).all();

    // Парсим данные пользователей
    const parsedWins = (wins.results || []).map((win: any) => ({
      timestamp: win.timestamp,
      user: win.user_data ? JSON.parse(win.user_data) : null,
      betAmount: win.bet_amount,
      winAmount: win.win_amount,
      gemsFound: win.gems_found,
      minesCount: win.mines_count,
      multiplier: win.multiplier
    }));

    return c.json({ wins: parsedWins });
  } catch (error) {
    console.error('Get mines wins error:', error);
    return c.json({ error: 'Failed to get mines wins' }, 500);
  }
});

// Получить адрес кошелька для пополнений
app.get('/api/wallet/receiving-address', async (c) => {
  try {
    const receivingAddress = c.env.RECEIVING_WALLET_ADDRESS;
    
    if (!receivingAddress) {
      return c.json({ error: 'Receiving wallet address not configured' }, 500);
    }

    return c.json({ address: receivingAddress });
  } catch (error) {
    console.error('Error getting receiving address:', error);
    return c.json({ error: 'Failed to get receiving address' }, 500);
  }
});

// Получить баланс пользователя
app.post('/api/user/balance', async (c) => {
  try {
    const { initData } = await c.req.json();
    
    if (!initData) {
      return c.json({ error: 'No init data provided' }, 400);
    }

    const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
    
    if (!verification.isValid || !verification.user) {
      return c.json({ error: 'Invalid init data' }, 401);
    }

    const userId = verification.user.id.toString();

    // Получаем баланс пользователя
    const userBalance = await c.env.DB.prepare(
      'SELECT balance_ton, balance_stars FROM user_balances WHERE user_id = ?'
    ).bind(userId).first();

    if (!userBalance) {
      // Создаем баланс для нового пользователя
      await c.env.DB.prepare(
        'INSERT INTO user_balances (user_id, balance_ton, balance_stars) VALUES (?, 0, 0)'
      ).bind(userId).run();
      
      return c.json({ balanceTon: '0.00', balanceStars: 0 });
    }

    return c.json({ 
      balanceTon: Number(userBalance.balance_ton).toFixed(2),
      balanceStars: userBalance.balance_stars
    });
  } catch (error) {
    console.error('Get balance error:', error);
    return c.json({ error: 'Failed to get balance' }, 500);
  }
});

// Create Stars invoice
app.post('/api/buy-stars', async (c) => {
  try {
    const { initData, amount } = await c.req.json();
    
    if (!initData) {
      return c.json({ error: 'No init data provided' }, 400);
    }

    const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
    
    if (!verification.isValid || !verification.user) {
      return c.json({ error: 'Invalid init data' }, 401);
    }

    const userId = verification.user.id;
    const starsAmount = parseInt(amount);

    if (!starsAmount || starsAmount <= 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    // Create a unique payload for this payment as JSON
    const payload = JSON.stringify({
      userId,
      amount: starsAmount,
      timestamp: Date.now(),
      type: 'topup'
    });

    // Create invoice
    const invoiceData = {
      title: `${starsAmount} Stars`,
      description: `Пополнение баланса игры на ${starsAmount} Stars`,
      payload: payload,
      provider_token: '', // Empty for Telegram Stars
      currency: 'XTR',
      prices: [
        {
          label: 'Stars Package',
          amount: starsAmount
        }
      ]
    };

    const response = await fetch(`https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create invoice:', errorText);
      return c.json({ error: 'Failed to create invoice' }, 500);
    }

    const result = await response.json() as { ok: boolean; result?: string };
    
    if (!result.ok) {
      console.error('Telegram API error:', result);
      return c.json({ error: 'Failed to create invoice' }, 500);
    }

    console.log(`
💎 Payment Invoice Created
========================
User ID: ${userId}
Stars: ${starsAmount}
Invoice URL: ${result.result}
    `);

    return c.json({ 
      success: true, 
      invoiceLink: result.result
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    return c.json({ error: 'Failed to create invoice' }, 500);
  }
});

// Create Stars invoice for case purchase
app.post('/api/buy-case-stars', async (c) => {
  try {
    const { initData, amount, casePrice, multiplier } = await c.req.json();
    
    if (!initData) {
      return c.json({ error: 'No init data provided' }, 400);
    }

    const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
    
    if (!verification.isValid || !verification.user) {
      return c.json({ error: 'Invalid init data' }, 401);
    }

    const userId = verification.user.id;
    const starsAmount = parseInt(amount);

    if (!starsAmount || starsAmount <= 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    if (!casePrice || !multiplier) {
      return c.json({ error: 'Missing case data' }, 400);
    }

    // Create a unique payload for this payment as JSON
    const payload = JSON.stringify({
      userId,
      amount: starsAmount,
      timestamp: Date.now(),
      type: 'case_purchase',
      casePrice: casePrice,
      multiplier: multiplier
    });

    // Create invoice
    const invoiceData = {
      title: `Открытие кейса`,
      description: `Оплата открытия кейса за ${starsAmount} Stars (${casePrice} TON x${multiplier})`,
      payload: payload,
      provider_token: '', // Empty for Telegram Stars
      currency: 'XTR',
      prices: [
        {
          label: 'Case Opening',
          amount: starsAmount
        }
      ]
    };

    const response = await fetch(`https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create case invoice:', errorText);
      return c.json({ error: 'Failed to create invoice' }, 500);
    }

    const result = await response.json() as { ok: boolean; result?: string };
    
    if (!result.ok) {
      console.error('Telegram API error:', result);
      return c.json({ error: 'Failed to create invoice' }, 500);
    }

    console.log(`
🎁 Case Purchase Invoice Created
===============================
User ID: ${userId}
Stars: ${starsAmount}
Case Price: ${casePrice} TON x${multiplier}
Invoice URL: ${result.result}
    `);

    return c.json({ 
      success: true, 
      invoiceLink: result.result
    });
  } catch (error) {
    console.error('Create case invoice error:', error);
    return c.json({ error: 'Failed to create invoice' }, 500);
  }
});

// Списать средства за кейс
app.post('/api/user/spend-on-case', async (c) => {
  try {
    const { initData, amount } = await c.req.json();
    
    if (!initData) {
      return c.json({ error: 'No init data provided' }, 400);
    }

    const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
    
    if (!verification.isValid || !verification.user) {
      return c.json({ error: 'Invalid init data' }, 401);
    }

    const userId = verification.user.id.toString();
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    // Получаем текущий баланс
    const currentBalance = await c.env.DB.prepare(
      'SELECT balance_ton FROM user_balances WHERE user_id = ?'
    ).bind(userId).first();

    if (!currentBalance || Number(currentBalance.balance_ton) < numAmount) {
      return c.json({ error: 'Insufficient funds' }, 400);
    }

    // Списываем средства с баланса пользователя
    await c.env.DB.prepare(`
      UPDATE user_balances 
      SET balance_ton = balance_ton - ?, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `).bind(numAmount, userId).run();

    // Получаем новый баланс
    const newBalance = await c.env.DB.prepare(
      'SELECT balance_ton FROM user_balances WHERE user_id = ?'
    ).bind(userId).first();

    return c.json({ 
      success: true,
      newBalance: Number(newBalance?.balance_ton || 0).toFixed(2)
    });
  } catch (error) {
    console.error('Spend on case error:', error);
    return c.json({ error: 'Failed to process spending' }, 500);
  }
});

// Создать транзакцию пополнения
app.post('/api/user/topup', async (c) => {
  try {
    const { initData, amount, transactionHash } = await c.req.json();
    
    if (!initData) {
      return c.json({ error: 'No init data provided' }, 400);
    }

    const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
    
    if (!verification.isValid || !verification.user) {
      return c.json({ error: 'Invalid init data' }, 401);
    }

    const userId = verification.user.id.toString();
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    // Записываем транзакцию как успешную (в реальной системе здесь была бы проверка блокчейна)
    await c.env.DB.prepare(
      'INSERT INTO payment_transactions (user_id, amount, currency, transaction_hash, status) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, numAmount, 'ton', transactionHash || 'pending', 'completed').run();

    // Обновляем баланс пользователя
    await c.env.DB.prepare(`
      INSERT INTO user_balances (user_id, balance_ton, balance_stars) 
      VALUES (?, ?, 0)
      ON CONFLICT(user_id) DO UPDATE SET 
        balance_ton = balance_ton + ?,
        updated_at = CURRENT_TIMESTAMP
    `).bind(userId, numAmount, numAmount).run();

    // Note: Referral rewards for topups removed - now only based on game results

    // Получаем новый баланс
    const newBalance = await c.env.DB.prepare(
      'SELECT balance_ton FROM user_balances WHERE user_id = ?'
    ).bind(userId).first();

    return c.json({ 
      success: true,
      newBalance: Number(newBalance?.balance_ton || 0).toFixed(2)
    });
  } catch (error) {
    console.error('Topup error:', error);
    return c.json({ error: 'Failed to process topup' }, 500);
  }
});

// Сохранить подключенный кошелек пользователя
app.post('/api/user/save-wallet', async (c) => {
  try {
    const { initData, walletAddress } = await c.req.json();
    
    if (!initData) {
      return c.json({ error: 'No init data provided' }, 400);
    }

    if (!walletAddress) {
      return c.json({ error: 'No wallet address provided' }, 400);
    }

    const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
    
    if (!verification.isValid || !verification.user) {
      return c.json({ error: 'Invalid init data' }, 401);
    }

    const userId = verification.user.id.toString();
    
    // Получаем IP адрес пользователя
    const userIp = c.req.header('CF-Connecting-IP') || 
                   c.req.header('X-Forwarded-For') || 
                   c.req.header('X-Real-IP') || 
                   'unknown';

    // Сохраняем кошелек пользователя (или обновляем если уже существует)
    await c.env.DB.prepare(`
      INSERT INTO user_wallets (user_id, wallet_address) 
      VALUES (?, ?)
      ON CONFLICT(user_id, wallet_address) DO UPDATE SET 
        updated_at = CURRENT_TIMESTAMP
    `).bind(userId, walletAddress).run();

    // Сохраняем IP адрес в таблицу user_balances
    await c.env.DB.prepare(`
      INSERT INTO user_balances (user_id, balance_ton, balance_stars, user_ip) 
      VALUES (?, 0, 0, ?)
      ON CONFLICT(user_id) DO UPDATE SET 
        user_ip = ?,
        updated_at = CURRENT_TIMESTAMP
    `).bind(userId, userIp, userIp).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Save wallet error:', error);
    return c.json({ error: 'Failed to save wallet' }, 500);
  }
});

// Получить реферальную статистику пользователя
app.post('/api/user/referral-stats', async (c) => {
  try {
    const { initData } = await c.req.json();
    
    if (!initData) {
      return c.json({ error: 'No init data provided' }, 400);
    }

    const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
    
    if (!verification.isValid || !verification.user) {
      return c.json({ error: 'Invalid init data' }, 401);
    }

    const userId = verification.user.id.toString();

    // Получаем реферальный код пользователя
    const userCode = await c.env.DB.prepare(
      'SELECT referral_code FROM referral_codes WHERE user_id = ?'
    ).bind(userId).first();

    // Считаем количество приглашенных пользователей
    const referralCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?'
    ).bind(userId).first();

    // Подсчитываем общую сумму заработанных средств от рефералов (только TON)
    const earnedResult = await c.env.DB.prepare(
      'SELECT SUM(amount) as total FROM referral_earnings WHERE referrer_id = ? AND currency = ?'
    ).bind(userId, 'ton').first();

    const earnedAmount = Number(earnedResult?.total || 0).toFixed(2);

    return c.json({
      referralCode: userCode?.referral_code || null,
      invitedCount: referralCount?.count || 0,
      earnedAmount: earnedAmount
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    return c.json({ error: 'Failed to get referral stats' }, 500);
  }
});

// Получить цены подарков из базы данных
app.get('/api/gifts/prices', async (c) => {
  try {
    const gifts = await c.env.DB.prepare(
      'SELECT name, price FROM gifts_prices ORDER BY price DESC'
    ).all();

    const giftPrices: { [key: string]: number } = {};
    
    if (gifts.results) {
      for (const gift of gifts.results as any[]) {
        giftPrices[gift.name] = gift.price;
      }
    }

    return c.json({ gifts: giftPrices });
  } catch (error) {
    console.error('Get gift prices error:', error);
    return c.json({ error: 'Failed to get gift prices' }, 500);
  }
});

// Добавить предметы в инвентарь пользователя
app.post('/api/user/inventory/add', async (c) => {
  try {
    const { initData, items, casePrice } = await c.req.json();
    
    if (!initData) {
      return c.json({ error: 'No init data provided' }, 400);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'No items provided' }, 400);
    }

    const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
    
    if (!verification.isValid || !verification.user) {
      return c.json({ error: 'Invalid init data' }, 401);
    }

    const userId = verification.user.id.toString();
    let totalWinValue = 0;

    // Добавляем все предметы в инвентарь и считаем общую стоимость
    for (const item of items) {
      if (!item.giftName || !item.giftIcon || !item.giftBackground || typeof item.giftPrice !== 'number') {
        continue; // Пропускаем невалидные предметы
      }

      await c.env.DB.prepare(
        'INSERT INTO user_inventory (user_id, gift_name, gift_icon, gift_background, gift_price, obtained_from) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(userId, item.giftName, item.giftIcon, item.giftBackground, item.giftPrice, 'case').run();
      
      totalWinValue += item.giftPrice;
    }

    // Обрабатываем реферальные награды на основе результата открытия кейса
    if (casePrice && typeof casePrice === 'number') {
      await processGameReferralReward(c.env.DB, userId, 'case', casePrice, totalWinValue);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Add to inventory error:', error);
    return c.json({ error: 'Failed to add items to inventory' }, 500);
  }
});

// Получить инвентарь пользователя
app.post('/api/user/inventory', async (c) => {
  try {
    const { initData } = await c.req.json();
    
    if (!initData) {
      return c.json({ error: 'No init data provided' }, 400);
    }

    const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
    
    if (!verification.isValid || !verification.user) {
      return c.json({ error: 'Invalid init data' }, 401);
    }

    const userId = verification.user.id.toString();

    const items = await c.env.DB.prepare(
      'SELECT id, gift_name, gift_icon, gift_background, gift_price, obtained_from, created_at FROM user_inventory WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all();

    return c.json({ items: items.results || [] });
  } catch (error) {
    console.error('Get inventory error:', error);
    return c.json({ error: 'Failed to get inventory' }, 500);
  }
});

// Продать все предметы из инвентаря
app.post('/api/user/inventory/sell-all', async (c) => {
  try {
    const { initData } = await c.req.json();
    
    if (!initData) {
      return c.json({ error: 'No init data provided' }, 400);
    }

    const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
    
    if (!verification.isValid || !verification.user) {
      return c.json({ error: 'Invalid init data' }, 401);
    }

    const userId = verification.user.id.toString();

    // Получаем все предметы пользователя
    const userItems = await c.env.DB.prepare(
      'SELECT id, gift_price FROM user_inventory WHERE user_id = ?'
    ).bind(userId).all();

    if (!userItems.results || userItems.results.length === 0) {
      return c.json({ error: 'No items to sell' }, 404);
    }

    const items = userItems.results as any[];
    const totalPrice = items.reduce((sum, item) => sum + Number(item.gift_price), 0);

    // Атомарно удаляем все предметы пользователя
    const deleteResult = await c.env.DB.prepare(
      'DELETE FROM user_inventory WHERE user_id = ?'
    ).bind(userId).run();

    if (!deleteResult.success) {
      return c.json({ error: 'Failed to sell items' }, 500);
    }

    try {
      // Начисляем общую сумму на баланс пользователя
      await c.env.DB.prepare(`
        INSERT INTO user_balances (user_id, balance_ton, balance_stars) 
        VALUES (?, ?, 0)
        ON CONFLICT(user_id) DO UPDATE SET 
          balance_ton = balance_ton + ?,
          updated_at = CURRENT_TIMESTAMP
      `).bind(userId, totalPrice, totalPrice).run();

      // Получаем новый баланс
      const newBalance = await c.env.DB.prepare(
        'SELECT balance_ton FROM user_balances WHERE user_id = ?'
      ).bind(userId).first();

      return c.json({ 
        success: true,
        newBalance: Number(newBalance?.balance_ton || 0).toFixed(2),
        totalEarnings: totalPrice,
        itemsSold: items.length
      });
    } catch (balanceError) {
      console.error('Error updating balance after selling all items:', balanceError);
      return c.json({ error: 'Failed to update balance' }, 500);
    }
  } catch (error) {
    console.error('Sell all items error:', error);
    return c.json({ error: 'Failed to sell all items' }, 500);
  }
});

// Продать предмет из инвентаря
app.post('/api/user/inventory/sell', async (c) => {
  try {
    const { initData, itemId } = await c.req.json();
    
    if (!initData) {
      return c.json({ error: 'No init data provided' }, 400);
    }

    if (!itemId) {
      return c.json({ error: 'No item ID provided' }, 400);
    }

    const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
    
    if (!verification.isValid || !verification.user) {
      return c.json({ error: 'Invalid init data' }, 401);
    }

    const userId = verification.user.id.toString();

    // Проверяем, что предмет существует и принадлежит пользователю
    const item = await c.env.DB.prepare(
      'SELECT id, gift_price FROM user_inventory WHERE id = ? AND user_id = ?'
    ).bind(itemId, userId).first();

    if (!item) {
      return c.json({ error: 'Item not found or already sold' }, 404);
    }

    const itemPrice = Number(item.gift_price);

    // Атомарная операция: удаляем предмет и проверяем, что он был удален
    const deleteResult = await c.env.DB.prepare(
      'DELETE FROM user_inventory WHERE id = ? AND user_id = ? RETURNING id'
    ).bind(itemId, userId).first();

    if (!deleteResult) {
      // Предмет уже был удален другим запросом
      return c.json({ error: 'Item was already sold by another request' }, 409);
    }

    try {
      // Начисляем баланс пользователю
      await c.env.DB.prepare(`
        INSERT INTO user_balances (user_id, balance_ton, balance_stars) 
        VALUES (?, ?, 0)
        ON CONFLICT(user_id) DO UPDATE SET 
          balance_ton = balance_ton + ?,
          updated_at = CURRENT_TIMESTAMP
      `).bind(userId, itemPrice, itemPrice).run();

      // Получаем новый баланс
      const newBalance = await c.env.DB.prepare(
        'SELECT balance_ton FROM user_balances WHERE user_id = ?'
      ).bind(userId).first();

      return c.json({ 
        success: true,
        newBalance: Number(newBalance?.balance_ton || 0).toFixed(2),
        soldPrice: itemPrice
      });
    } catch (balanceError) {
      // Если произошла ошибка при начислении баланса, восстанавливаем предмет
      console.error('Error updating balance, restoring item:', balanceError);
      
      try {
        await c.env.DB.prepare(
          'INSERT INTO user_inventory (user_id, gift_name, gift_icon, gift_background, gift_price, obtained_from) SELECT ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM user_inventory WHERE id = ?)'
        ).bind(userId, 'Unknown', '', '', itemPrice, 'restore', itemId).run();
      } catch (restoreError) {
        console.error('Failed to restore item:', restoreError);
      }
      
      return c.json({ error: 'Failed to update balance' }, 500);
    }
  } catch (error) {
    console.error('Sell item error:', error);
    return c.json({ error: 'Failed to sell item' }, 500);
  }
});

// Обработка результатов апгрейда
app.post('/api/upgrade/process-result', async (c) => {
  try {
    const { initData, isWin, selectedGiftIds, selectedUpgradeGift } = await c.req.json();
    
    if (!initData) {
      return c.json({ error: 'No init data provided' }, 400);
    }

    if (typeof isWin !== 'boolean') {
      return c.json({ error: 'Invalid win status' }, 400);
    }

    if (!selectedGiftIds || !Array.isArray(selectedGiftIds) || selectedGiftIds.length === 0) {
      return c.json({ error: 'No selected gifts provided' }, 400);
    }

    const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
    
    if (!verification.isValid || !verification.user) {
      return c.json({ error: 'Invalid init data' }, 401);
    }

    const userId = verification.user.id.toString();

    // Атомарно удаляем все выбранные предметы и получаем информацию об удаленных
    
    // Для SQLite нужно удалять по одному предмету и собирать результаты
    const deletedItems: any[] = [];
    for (const itemId of selectedGiftIds) {
      const deleteResult = await c.env.DB.prepare(
        'DELETE FROM user_inventory WHERE id = ? AND user_id = ? RETURNING id, gift_name, gift_icon, gift_background, gift_price'
      ).bind(itemId, userId).first();

      if (!deleteResult) {
        // Предмет уже был удален другим запросом (апгрейд или продажа)
        // Восстанавливаем уже удаленные предметы
        for (const restoredItem of deletedItems) {
          try {
            await c.env.DB.prepare(
              'INSERT INTO user_inventory (user_id, gift_name, gift_icon, gift_background, gift_price, obtained_from) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(userId, restoredItem.gift_name, restoredItem.gift_icon, restoredItem.gift_background, restoredItem.gift_price, 'restored').run();
          } catch (restoreError) {
            console.error('Failed to restore item during upgrade conflict:', restoreError);
          }
        }
        
        return c.json({ error: 'Some items are already being used in another upgrade or have been sold' }, 409);
      }
      
      deletedItems.push(deleteResult);
    }

    // Если выигрыш - добавляем выигранный предмет в инвентарь
    if (isWin && selectedUpgradeGift) {
      const { name, icon, background, price } = selectedUpgradeGift;
      
      if (name && icon && background && typeof price === 'number') {
        await c.env.DB.prepare(
          'INSERT INTO user_inventory (user_id, gift_name, gift_icon, gift_background, gift_price, obtained_from) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(userId, name, icon, background, price, 'upgrade').run();
      }
    }

    // Получаем обновленный инвентарь
    const updatedItems = await c.env.DB.prepare(
      'SELECT id, gift_name, gift_icon, gift_background, gift_price, obtained_from, created_at FROM user_inventory WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all();

    return c.json({ 
      success: true,
      updatedInventory: updatedItems.results || []
    });
  } catch (error) {
    console.error('Process upgrade result error:', error);
    return c.json({ error: 'Failed to process upgrade result' }, 500);
  }
});

// Forfeit spin endpoint - remove selected gifts when user leaves during spin
app.post('/api/upgrade/forfeit-spin', async (c) => {
  try {
    const { initData, selectedGiftIds } = await c.req.json();
    
    if (!initData || !selectedGiftIds || !Array.isArray(selectedGiftIds)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid request data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify and get user from Telegram initData
    const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
    if (!verification.isValid || !verification.user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid user' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = verification.user.id.toString();

    // Remove selected gifts from inventory (forfeit)
    if (selectedGiftIds.length > 0) {
      const placeholders = selectedGiftIds.map(() => '?').join(',');
      await c.env.DB.prepare(`
        DELETE FROM user_inventory 
        WHERE user_id = ? AND id IN (${placeholders})
      `).bind(userId, ...selectedGiftIds).run();
    }

    return c.json({ 
      success: true,
      message: 'Gifts forfeited successfully'
    });

  } catch (error) {
    console.error('Forfeit spin error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

// Server-side function to determine PvP winner based on arrow angle
function determineWinnerServerSide(finalAngle: number, participants: any[]): string | null {
  if (participants.length === 0) return null;
  
  // Recalculate win percentages to ensure they're fresh
  const totalBetAmount = participants.reduce((sum: number, p: any) => sum + (p.bet_amount || 0), 0);
  
  if (totalBetAmount === 0) return participants[0]?.user_id || null;
  
  // Update percentages
  const participantsWithCorrectPercentages = participants.map(p => ({
    ...p,
    win_percentage: totalBetAmount > 0 ? (p.bet_amount / totalBetAmount) * 100 : 0
  }));
  
  const gapAngle = 0; // No gaps between segments
  const totalGaps = 0; 
  const totalGapAngle = totalGaps * gapAngle;
  const availableAngle = 360 - totalGapAngle;
  
  let currentAngle = 0;
  
  console.log(`PvP Winner Determination:
    Final angle: ${finalAngle}°
    Total participants: ${participants.length}
    Available angle: ${availableAngle}°`);
  
  for (let i = 0; i < participantsWithCorrectPercentages.length; i++) {
    const participant = participantsWithCorrectPercentages[i];
    const percentage = participant.win_percentage || 0;
    const segmentAngle = (percentage / 100) * availableAngle;
    
    const startAngle = currentAngle;
    const endAngle = startAngle + segmentAngle;
    
    console.log(`  Participant ${i}: ${participant.user?.first_name || participant.user?.username || 'User'} 
      User ID: ${participant.user_id}
      Percentage: ${percentage.toFixed(2)}%
      Segment: ${startAngle.toFixed(2)}° - ${endAngle.toFixed(2)}°`);
    
    // Check if the arrow angle falls within this segment
    if (finalAngle >= startAngle && finalAngle < endAngle) {
      console.log(`  ✓ Winner found: ${participant.user?.first_name || participant.user?.username || 'User'} (${participant.user_id})`);
      return participant.user_id;
    }
    
    currentAngle = endAngle + gapAngle;
  }
  
  // Handle edge case where angle is exactly 360 or very close - assign to last participant
  const lastParticipant = participantsWithCorrectPercentages[participantsWithCorrectPercentages.length - 1];
  console.log(`  Edge case: assigned to last participant ${lastParticipant?.user?.first_name || lastParticipant?.user?.username || 'User'} (${lastParticipant?.user_id})`);
  return lastParticipant?.user_id || null;
}

// Get current active PvP game
app.get('/api/pvp/current-game', async (c) => {
  try {
    // Get or create current active game
    let currentGame: any = await c.env.DB.prepare(
      'SELECT * FROM pvp_games WHERE status = ? ORDER BY created_at DESC LIMIT 1'
    ).bind('waiting').first();

    if (!currentGame) {
      // Atomic game creation with conflict handling
      let gameCreated = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!gameCreated && attempts < maxAttempts) {
        attempts++;
        
        try {
          // Get the next game number
          const lastGame = await c.env.DB.prepare(
            'SELECT MAX(game_number) as max_number FROM pvp_games'
          ).first() as { max_number: number } | null;
          
          const nextGameNumber = (Number(lastGame?.max_number) || 10003) + 1;

          // Try to create new game atomically
          const newGameResult = await c.env.DB.prepare(
            'INSERT INTO pvp_games (game_number, status, total_participants, total_bet_amount, countdown_start_time, countdown_active, final_arrow_angle) VALUES (?, ?, 0, 0, NULL, FALSE, NULL) RETURNING *'
          ).bind(nextGameNumber, 'waiting').first();

          currentGame = newGameResult;
          gameCreated = true;
        } catch (error: any) {
          // If unique constraint violation, another client created a game simultaneously
          if (error.message && error.message.includes('UNIQUE constraint failed')) {
            // Get the existing game that was just created
            const existingGame = await c.env.DB.prepare(
              'SELECT * FROM pvp_games WHERE status = ? ORDER BY created_at DESC LIMIT 1'
            ).bind('waiting').first();
            
            if (existingGame) {
              currentGame = existingGame;
              gameCreated = true;
            }
          } else {
            throw error; // Re-throw non-constraint errors
          }
        }
      }

      if (!currentGame) {
        throw new Error('Failed to create or retrieve game after multiple attempts');
      }
    }

    // Get all participants for this game
    const participants = await c.env.DB.prepare(
      'SELECT * FROM pvp_participants WHERE game_id = ? ORDER BY created_at ASC'
    ).bind(currentGame.id).all();

    const participantCount = (participants.results || []).length;
    const currentTime = Date.now();
    
    // Get items for each participant (first 5 items per participant)
    const participantsWithItems: any[] = [];
    for (const participant of (participants.results || [])) {
      const items = await c.env.DB.prepare(
        'SELECT * FROM pvp_game_items WHERE participant_id = ? ORDER BY created_at ASC LIMIT 5'
      ).bind((participant as any).id).all();

      participantsWithItems.push({
        ...participant,
        items: items.results || [],
        user: (participant as any).user_data ? JSON.parse((participant as any).user_data) : null
      });
    }

    // Calculate remaining countdown time
    let remainingTime = 0;
    let isCountdownActive = false;
    
    // Reset countdown and clear winner if less than 2 players
    if (participantCount < 2) {
      if (currentGame.countdown_start_time || currentGame.countdown_active || currentGame.final_arrow_angle || currentGame.winner_id) {
        await c.env.DB.prepare(
          'UPDATE pvp_games SET countdown_start_time = NULL, countdown_active = FALSE, final_arrow_angle = NULL, winner_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(currentGame.id).run();
        
        currentGame.countdown_start_time = null;
        currentGame.countdown_active = false;
        currentGame.final_arrow_angle = null;
        currentGame.winner_id = null;
      }
      remainingTime = 0;
      isCountdownActive = false;
    } else {
      // Check if we need to start countdown (2+ players and no countdown started yet)
      if (!currentGame.countdown_start_time && !currentGame.countdown_active && !currentGame.final_arrow_angle) {
        // Start countdown - set the start time and active status
        const startTime = currentTime;
        await c.env.DB.prepare(
          'UPDATE pvp_games SET countdown_start_time = ?, countdown_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(startTime, currentGame.id).run();
        
        // Update the current game object
        currentGame.countdown_start_time = startTime;
        currentGame.countdown_active = true;
      }
      
      // Calculate remaining time for 2+ players
      if (currentGame.countdown_start_time && currentGame.countdown_active && !currentGame.final_arrow_angle) {
        const elapsed = currentTime - Number(currentGame.countdown_start_time);
        remainingTime = Math.max(0, 30000 - elapsed); // 30 seconds countdown
        isCountdownActive = remainingTime > 0;
        
        // If countdown finished, generate final arrow angle, determine winner and mark as inactive
        if (remainingTime === 0 && !currentGame.final_arrow_angle) {
          // Generate random final angle (0-360 degrees) for consistent results across all clients
          // Only generate if not already generated to prevent race conditions
          const finalAngle = Math.random() * 360;
          
          // Determine winner server-side based on the angle with fresh participant data
          let winnerId = null;
          if (participantsWithItems.length > 0) {
            winnerId = determineWinnerServerSide(finalAngle, participantsWithItems);
          }
          
          // Use atomic update to prevent race conditions - only update if final_arrow_angle is still NULL
          const updateResult = await c.env.DB.prepare(
            'UPDATE pvp_games SET countdown_active = FALSE, final_arrow_angle = ?, winner_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND final_arrow_angle IS NULL'
          ).bind(finalAngle, winnerId, currentGame.id).run();
          
          // If update was successful (meaning we were the first to set the angle), update our local copy
          if (updateResult.changes && updateResult.changes > 0) {
            currentGame.countdown_active = false;
            currentGame.final_arrow_angle = finalAngle;
            currentGame.winner_id = winnerId;
          } else {
            // Another client already generated the angle, fetch the actual values
            const gameData = await c.env.DB.prepare(
              'SELECT countdown_active, final_arrow_angle, winner_id FROM pvp_games WHERE id = ?'
            ).bind(currentGame.id).first();
            
            if (gameData) {
              currentGame.countdown_active = (gameData as any).countdown_active;
              currentGame.final_arrow_angle = (gameData as any).final_arrow_angle;
              currentGame.winner_id = (gameData as any).winner_id;
            }
          }
          
          isCountdownActive = false;
        }
      } else if (currentGame.final_arrow_angle && currentGame.winner_id) {
        // Game already finished
        remainingTime = 0;
        isCountdownActive = false;
      }
    }

    return c.json({
      game: {
        ...currentGame,
        countdown_remaining: Math.max(0, Math.ceil(remainingTime / 1000)),
        countdown_active: isCountdownActive,
        server_time: currentTime
      },
      participants: participantsWithItems
    });
  } catch (error) {
    console.error('Get current game error:', error);
    return c.json({ error: 'Failed to get current game' }, 500);
  }
});

// Join PvP game by adding gifts
app.post('/api/pvp/join-game', async (c) => {
  try {
    const { initData, selectedGiftIds } = await c.req.json();
    
    if (!initData || !selectedGiftIds || !Array.isArray(selectedGiftIds) || selectedGiftIds.length === 0) {
      return c.json({ error: 'Invalid request data' }, 400);
    }

    const verification = verifyTelegramWebAppData(initData, c.env.TELEGRAM_BOT_TOKEN || '');
    if (!verification.isValid || !verification.user) {
      return c.json({ error: 'Invalid init data' }, 401);
    }

    const userId = verification.user.id.toString();

    // Get or create current active game
    let currentGame = await c.env.DB.prepare(
      'SELECT * FROM pvp_games WHERE status = ? ORDER BY created_at DESC LIMIT 1'
    ).bind('waiting').first();

    if (!currentGame) {
      // Atomic game creation with conflict handling
      let gameCreated = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!gameCreated && attempts < maxAttempts) {
        attempts++;
        
        try {
          // Get the next game number
          const lastGame = await c.env.DB.prepare(
            'SELECT MAX(game_number) as max_number FROM pvp_games'
          ).first();
          
          const nextGameNumber = (Number((lastGame as any)?.max_number) || 10003) + 1;

          // Try to create new game atomically
          const newGameResult = await c.env.DB.prepare(
            'INSERT INTO pvp_games (game_number, status, total_participants, total_bet_amount, countdown_start_time, countdown_active) VALUES (?, ?, 0, 0, NULL, FALSE) RETURNING *'
          ).bind(nextGameNumber, 'waiting').first();

          currentGame = newGameResult;
          gameCreated = true;
        } catch (error: any) {
          // If unique constraint violation, another client created a game simultaneously
          if (error.message && error.message.includes('UNIQUE constraint failed')) {
            // Get the existing game that was just created
            const existingGame = await c.env.DB.prepare(
              'SELECT * FROM pvp_games WHERE status = ? ORDER BY created_at DESC LIMIT 1'
            ).bind('waiting').first();
            
            if (existingGame) {
              currentGame = existingGame;
              gameCreated = true;
            }
          } else {
            throw error; // Re-throw non-constraint errors
          }
        }
      }

      if (!currentGame) {
        throw new Error('Failed to create or retrieve game after multiple attempts');
      }
    }

    // Check if user is already in this game
    const existingParticipant = await c.env.DB.prepare(
      'SELECT id, bet_amount, item_count FROM pvp_participants WHERE game_id = ? AND user_id = ?'
    ).bind(currentGame!.id, userId).first() as { id: number; bet_amount: number; item_count: number } | null;

    // Get selected items from user inventory and calculate total bet
    const itemsData = [];
    let totalBetAmount = 0;

    for (const itemId of selectedGiftIds) {
      const item = await c.env.DB.prepare(
        'SELECT * FROM user_inventory WHERE id = ? AND user_id = ?'
      ).bind(itemId, userId).first();

      if (!item) {
        return c.json({ error: 'Some items not found or already used' }, 404);
      }

      itemsData.push(item);
      totalBetAmount += Number((item as any).gift_price);
    }

    // Remove items from user inventory atomically
    for (const itemId of selectedGiftIds) {
      const deleteResult = await c.env.DB.prepare(
        'DELETE FROM user_inventory WHERE id = ? AND user_id = ? RETURNING id'
      ).bind(itemId, userId).first();

      if (!deleteResult) {
        // Item was already deleted by another request
        return c.json({ error: 'Some items are already being used' }, 409);
      }
    }

    try {
      let participantResult;
      
      if (existingParticipant) {
        // Update existing participant
        participantResult = await c.env.DB.prepare(
          'UPDATE pvp_participants SET bet_amount = bet_amount + ?, item_count = item_count + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *'
        ).bind(totalBetAmount, selectedGiftIds.length, existingParticipant.id).first();
        
        // Update game totals (only bet amount, not participant count)
        await c.env.DB.prepare(
          'UPDATE pvp_games SET total_bet_amount = total_bet_amount + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(totalBetAmount, (currentGame as any).id).run();
      } else {
        // Create new participant
        participantResult = await c.env.DB.prepare(
          'INSERT INTO pvp_participants (game_id, user_id, user_data, bet_amount, item_count, win_percentage) VALUES (?, ?, ?, ?, ?, 0) RETURNING *'
        ).bind((currentGame as any).id, userId, JSON.stringify(verification.user), totalBetAmount, selectedGiftIds.length).first();

        // Update game totals (both participant count and bet amount)
        await c.env.DB.prepare(
          'UPDATE pvp_games SET total_participants = total_participants + 1, total_bet_amount = total_bet_amount + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(totalBetAmount, (currentGame as any).id).run();
      }

      // Add items to game
      for (const item of itemsData) {
        await c.env.DB.prepare(
          'INSERT INTO pvp_game_items (game_id, participant_id, user_id, inventory_item_id, gift_name, gift_icon, gift_background, gift_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind((currentGame as any).id, (participantResult as any).id, userId, (item as any).id, (item as any).gift_name, (item as any).gift_icon, (item as any).gift_background, (item as any).gift_price).run();
      }

      // Recalculate win percentages for all participants
      await recalculatePvpWinPercentages(c.env.DB, (currentGame as any).id);

      return c.json({ 
        success: true,
        message: 'Successfully joined the game'
      });

    } catch (error) {
      // Restore items to inventory if something went wrong
      for (const item of itemsData) {
        try {
          await c.env.DB.prepare(
            'INSERT INTO user_inventory (user_id, gift_name, gift_icon, gift_background, gift_price, obtained_from) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(userId, (item as any).gift_name, (item as any).gift_icon, (item as any).gift_background, (item as any).gift_price, 'restored').run();
        } catch (restoreError) {
          console.error('Failed to restore item:', restoreError);
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Join game error:', error);
    return c.json({ error: 'Failed to join game' }, 500);
  }
});

// Calculate win percentages for all participants in a game
async function recalculatePvpWinPercentages(db: any, gameId: number): Promise<void> {
  try {
    // Get all participants with their bet amounts
    const participants = await db.prepare(
      'SELECT id, bet_amount FROM pvp_participants WHERE game_id = ?'
    ).bind(gameId).all();

    if (!participants.results || participants.results.length === 0) {
      return;
    }

    // Calculate total bet amount
    const totalBetAmount = (participants.results as any[]).reduce((sum: number, p: any) => sum + Number(p.bet_amount), 0);

    if (totalBetAmount === 0) {
      return;
    }

    // Update each participant's win percentage
    for (const participant of (participants.results as any[])) {
      const winPercentage = (Number(participant.bet_amount) / totalBetAmount) * 100;
      
      await db.prepare(
        'UPDATE pvp_participants SET win_percentage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(winPercentage, participant.id).run();
    }
  } catch (error) {
    console.error('Failed to recalculate win percentages:', error);
  }
}

// Complete PvP game with winner
app.post('/api/pvp/complete-game', async (c) => {
  try {
    const { gameId, winnerId } = await c.req.json();
    
    if (!gameId || !winnerId) {
      return c.json({ error: 'Invalid request data' }, 400);
    }

    // СТРОГАЯ защита от дублирования - атомарно отмечаем игру как завершенную
    // Это должно предотвратить любые race conditions
    const gameUpdateResult = await c.env.DB.prepare(
      'UPDATE pvp_games SET status = ?, winner_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ? RETURNING *'
    ).bind('completed', winnerId, gameId, 'waiting').first();

    if (!gameUpdateResult) {
      // Игра уже была завершена другим запросом или не найдена
      return c.json({ 
        success: true,
        message: 'Game already completed or not found'
      });
    }

    // Проверяем, есть ли уже результат для этой игры (дополнительная защита)
    const existingResult = await c.env.DB.prepare(
      'SELECT id FROM pvp_game_results WHERE game_id = ?'
    ).bind(gameId).first();

    if (existingResult) {
      // Результат уже существует - просто возвращаем успех
      return c.json({ 
        success: true,
        message: 'Game result already exists'
      });
    }

    const currentGame = gameUpdateResult;

    // Get winner participant data
    const winner = await c.env.DB.prepare(
      'SELECT * FROM pvp_participants WHERE game_id = ? AND user_id = ?'
    ).bind(gameId, winnerId).first();

    if (!winner) {
      return c.json({ error: 'Winner not found in game' }, 404);
    }

    // Get all items from the game sorted by price (ascending for commission selection)
    const allGameItems = await c.env.DB.prepare(
      'SELECT * FROM pvp_game_items WHERE game_id = ? ORDER BY gift_price ASC'
    ).bind(gameId).all();

    const gameItems = (allGameItems.results || []) as any[];
    
    // Calculate net profit and commission
    const totalBetAmount = Number((currentGame as any).total_bet_amount);
    const winnerBetAmount = Number((winner as any).bet_amount);
    const netProfit = totalBetAmount - winnerBetAmount; // Чистая прибыль победителя
    const targetCommission = netProfit * 0.1; // 10% от чистой прибыли
    const maxCommission = netProfit * 0.15; // 15% максимум

    console.log(`PvP Commission Calculation:
      Total bet: ${totalBetAmount} TON
      Winner bet: ${winnerBetAmount} TON  
      Net profit: ${netProfit} TON
      Target commission (10%): ${targetCommission} TON
      Max commission (15%): ${maxCommission} TON`);

    // Select items for commission (10-15% of net profit)
    const commissionItems: any[] = [];
    const winnerItems: any[] = [];
    let currentCommissionValue = 0;

    for (const item of gameItems) {
      const itemPrice = Number(item.gift_price);
      
      // If adding this item would exceed max commission (15%), don't add it to commission
      if (currentCommissionValue + itemPrice > maxCommission) {
        winnerItems.push(item);
        continue;
      }
      
      // If we haven't reached target commission (10%) yet, add to commission
      if (currentCommissionValue < targetCommission) {
        commissionItems.push(item);
        currentCommissionValue += itemPrice;
      } else {
        // We've reached target, add remaining items to winner
        winnerItems.push(item);
      }
    }

    const commissionAccountId = '1174100352';

    // Transfer commission items to commission account
    for (const item of commissionItems) {
      await c.env.DB.prepare(
        'INSERT INTO user_inventory (user_id, gift_name, gift_icon, gift_background, gift_price, obtained_from) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(commissionAccountId, item.gift_name, item.gift_icon, item.gift_background, item.gift_price, 'pvp_commission').run();
    }

    // Transfer remaining items to winner
    for (const item of winnerItems) {
      await c.env.DB.prepare(
        'INSERT INTO user_inventory (user_id, gift_name, gift_icon, gift_background, gift_price, obtained_from) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(winnerId, item.gift_name, item.gift_icon, item.gift_background, item.gift_price, 'pvp_win').run();
    }

    console.log(`PvP Commission Result:
      Commission items: ${commissionItems.length} (${currentCommissionValue.toFixed(2)} TON, ${((currentCommissionValue / netProfit) * 100).toFixed(1)}%)
      Winner items: ${winnerItems.length} (${(totalBetAmount - currentCommissionValue).toFixed(2)} TON)`);

    // Prepare winner items data for storage
    const winnerItemsData = JSON.stringify(winnerItems.map(item => ({
      gift_name: item.gift_name,
      gift_icon: item.gift_icon,
      gift_background: item.gift_background,
      gift_price: item.gift_price
    })));

    // Создаем результат игры (игра уже атомарно отмечена как завершенная выше)
    try {
      await c.env.DB.prepare(
        'INSERT INTO pvp_game_results (game_id, game_number, winner_id, winner_data, winner_percentage, total_bet_amount, winner_items) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind((currentGame as any).id, (currentGame as any).game_number, winnerId, (winner as any).user_data, (winner as any).win_percentage, (currentGame as any).total_bet_amount, winnerItemsData).run();

      // Обновляем дополнительные поля игры
      await c.env.DB.prepare(
        'UPDATE pvp_games SET countdown_start_time = NULL, countdown_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(gameId).run();
      
    } catch (dbError: any) {
      // Если ошибка связана с дубликатом (уникальное ограничение на game_id)
      if (dbError.message && (dbError.message.includes('UNIQUE constraint failed') || dbError.message.includes('constraint failed'))) {
        // Результат уже создан другим запросом - это нормально
        return c.json({ 
          success: true,
          message: 'Game result was already created by another request'
        });
      }
      
      // Для других ошибок - логируем и возвращаем ошибку
      console.error('Error creating game result:', dbError);
      throw dbError;
    }

    // Clean up game data
    await c.env.DB.prepare('DELETE FROM pvp_game_items WHERE game_id = ?').bind(gameId).run();
    await c.env.DB.prepare('DELETE FROM pvp_participants WHERE game_id = ?').bind(gameId).run();

    return c.json({ 
      success: true,
      message: 'Game completed successfully'
    });
  } catch (error) {
    console.error('Complete game error:', error);
    return c.json({ error: 'Failed to complete game' }, 500);
  }
});

// Get final arrow angle for game spin
app.get('/api/pvp/final-angle/:gameId', async (c) => {
  try {
    const gameId = c.req.param('gameId');
    
    if (!gameId) {
      return c.json({ error: 'Game ID required' }, 400);
    }

    const game = await c.env.DB.prepare(
      'SELECT final_arrow_angle FROM pvp_games WHERE id = ?'
    ).bind(gameId).first();

    if (!game) {
      return c.json({ error: 'Game not found' }, 404);
    }

    return c.json({ 
      finalAngle: (game as any).final_arrow_angle 
    });
  } catch (error) {
    console.error('Get final angle error:', error);
    return c.json({ error: 'Failed to get final angle' }, 500);
  }
});

// Get latest completed PvP game result
app.get('/api/pvp/latest-result', async (c) => {
  try {
    const latestResult = await c.env.DB.prepare(
      'SELECT * FROM pvp_game_results ORDER BY created_at DESC LIMIT 1'
    ).first();

    if (!latestResult) {
      return c.json({ result: null });
    }

    return c.json({ 
      result: {
        ...latestResult,
        winner_data: (latestResult as any).winner_data ? JSON.parse((latestResult as any).winner_data) : null
      }
    });
  } catch (error) {
    console.error('Get latest result error:', error);
    return c.json({ error: 'Failed to get latest result' }, 500);
  }
});

// Get PvP game history (last 10 completed games)
app.get('/api/pvp/history', async (c) => {
  try {
    const history = await c.env.DB.prepare(
      'SELECT * FROM pvp_game_results ORDER BY created_at DESC LIMIT 10'
    ).all();

    const results = (history.results || []).map((game: any) => ({
      ...game,
      winner_data: game.winner_data ? JSON.parse(game.winner_data) : null,
      winner_items: game.winner_items ? JSON.parse(game.winner_items) : null
    }));

    return c.json({ history: results });
  } catch (error) {
    console.error('Get PvP history error:', error);
    return c.json({ error: 'Failed to get PvP history' }, 500);
  }
});

// Notify spin API удален - топоры больше не используются

export default app;
