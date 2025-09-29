# Dash Games

Dash Games - это игровая платформа с множественными режимами, построенная на React, Hono и Cloudflare Workers с интеграцией TON Connect.

## 🚀 Быстрый старт

### Локальная разработка

1. **Клонируйте репозиторий**
   ```bash
   git clone <repository-url>
   cd dash-games
   ```

2. **Установите зависимости**
   ```bash
   npm install
   ```

3. **Запустите проект локально**
   ```bash
   npm run dev
   ```

   Приложение будет доступно по адресу `http://localhost:5173`

## 🔧 Технологический стек

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Hono, Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Blockchain**: TON Connect для интеграции с TON кошельками
- **Deployment**: Cloudflare Workers
- **Icons**: Lucide React
- **Routing**: React Router v7
- **Validation**: Zod

## 📁 Структура компонентов

### Рекомендации по добавлению новых компонентов

При добавлении новых компонентов или библиотек следуйте этим правилам:

1. **Документируйте в README.md**:
   - Добавьте новую библиотеку в раздел "Технологический стек"
   - Опишите назначение нового компонента в разделе "Структура проекта"
   - Укажите особенности использования, если они есть

2. **Организация компонентов**:
   - `src/react-app/components/` - переиспользуемые UI компоненты
   - `src/react-app/pages/` - страницы приложения (контроллеры)
   - `src/react-app/hooks/` - пользовательские React хуки
   - `src/shared/` - общие типы и утилиты

3. **Именование файлов**:
   - Используйте PascalCase для компонентов: `MyComponent.tsx`
   - Используйте camelCase для хуков: `useMyHook.ts`
   - Используйте kebab-case для страниц: `my-page.tsx` или PascalCase: `MyPage.tsx`

4. **Обновите dependencies**:
   - Используйте `npm install package-name` для production зависимостей
   - Используйте `npm install -D package-name` для dev зависимостей
   - Обновите `requirements.txt` после установки новых пакетов

## 📦 Команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск в режиме разработки |
| `npm run build` | Сборка проекта для продакшена |
| `npm run check` | Проверка TypeScript и тестовая сборка |
| `npm run lint` | Проверка кода с помощью ESLint |
| `npm run cf-typegen` | Генерация типов для Cloudflare Workers |

## 🌐 Развертывание на продакшене

### Требования

1. **Собственный домен** (например, yourdomain.com)
2. **Аккаунт на платформе хостинга** (Cloudflare, Vercel, Netlify и др.)
3. **Доступ к DNS настройкам домена**

## 🚀 Способы развертывания

### Метод 1: Cloudflare Workers (Рекомендуется)

**Преимущества**: Высокая производительность, глобальная CDN, интеграция с D1 базой данных

#### Шаг 1: Подготовка аккаунта

1. **Зарегистрируйтесь на [Cloudflare](https://cloudflare.com)**
2. **Добавьте ваш домен в Cloudflare**:
   - Зайдите в панель управления Cloudflare
   - Нажмите "Add a Site"
   - Введите ваш домен (например, yourdomain.com)
   - Выберите бесплатный план
   - Обновите DNS серверы у вашего регистратора на серверы Cloudflare

#### Шаг 2: Настройка проекта

1. **Авторизуйтесь в Cloudflare**
   ```bash
   npx wrangler login
   ```

2. **Создайте D1 базу данных**
   ```bash
   npx wrangler d1 create dash-games-db
   ```
   
   Скопируйте ID базы данных из вывода команды и обновите `wrangler.jsonc`

3. **Обновите домен в манифесте**
   
   Отредактируйте `public/tonconnect-manifest.json`:
   ```json
   {
     "url": "https://yourdomain.com",
     "name": "Dash Games",
     "iconUrl": "https://yourdomain.com/favicon.ico",
     "termsOfUseUrl": "https://yourdomain.com/terms",
     "privacyPolicyUrl": "https://yourdomain.com/privacy"
   }
   ```

4. **Запустите миграции базы данных** (если есть)
   ```bash
   npx wrangler d1 migrations apply dash-games-db
   ```

#### Шаг 3: Развертывание

1. **Соберите проект**
   ```bash
   npm run build
   ```

2. **Разверните Worker**
   ```bash
   npx wrangler deploy
   ```

3. **Настройте Custom Domain**:
   - Зайдите в [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Перейдите в Workers & Pages
   - Выберите ваш проект
   - Перейдите на вкладку "Custom Domains"
   - Нажмите "Add Custom Domain"
   - Введите ваш домен (например, yourdomain.com или www.yourdomain.com)
   - Cloudflare автоматически настроит DNS и SSL

**Результат**: Ваш сайт будет доступен по адресу `https://yourdomain.com`

---

### Метод 2: Vercel

**Преимущества**: Простота развертывания, автоматические деплои из Git, бесплатный SSL

#### Шаг 1: Подготовка

1. **Зарегистрируйтесь на [Vercel](https://vercel.com)**
2. **Установите Vercel CLI**
   ```bash
   npm i -g vercel
   ```

#### Шаг 2: Развертывание

1. **Обновите домен в манифесте** (`public/tonconnect-manifest.json`):
   ```json
   {
     "url": "https://yourdomain.com",
     "name": "Dash Games"
   }
   ```

2. **Разверните проект**
   ```bash
   vercel --prod
   ```

3. **Настройте домен**:
   - Зайдите в [Vercel Dashboard](https://vercel.com/dashboard)
   - Выберите ваш проект
   - Перейдите в Settings → Domains
   - Добавьте ваш домен
   - Обновите DNS записи у регистратора согласно инструкциям Vercel

**Результат**: Ваш сайт будет доступен по адресу `https://yourdomain.com`

---

### Метод 3: Netlify

**Преимущества**: Хорошая интеграция с Git, простые формы, бесплатный план

#### Шаг 1: Подготовка

1. **Зарегистрируйтесь на [Netlify](https://netlify.com)**
2. **Установите Netlify CLI**
   ```bash
   npm i -g netlify-cli
   ```

#### Шаг 2: Развертывание

1. **Обновите домен в манифесте** (`public/tonconnect-manifest.json`):
   ```json
   {
     "url": "https://yourdomain.com",
     "name": "Dash Games"
   }
   ```

2. **Соберите проект**
   ```bash
   npm run build
   ```

3. **Разверните**
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. **Настройте домен**:
   - Зайдите в [Netlify Dashboard](https://app.netlify.com)
   - Выберите ваш сайт
   - Перейдите в Site settings → Domain management
   - Добавьте custom domain
   - Обновите DNS записи согласно инструкциям

**Результат**: Ваш сайт будет доступен по адресу `https://yourdomain.com`

---

### Метод 4: VPS/Dedicated Server

**Преимущества**: Полный контроль, возможность кастомизации

#### Требования
- Ubuntu/Debian сервер
- Node.js 18+
- Nginx
- SSL сертификат (Let's Encrypt)

#### Шаг 1: Подготовка сервера

1. **Установите Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Установите Nginx**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

3. **Установите Certbot для SSL**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

#### Шаг 2: Настройка проекта

1. **Клонируйте проект на сервер**
   ```bash
   git clone <your-repo-url>
   cd dash-games
   npm install
   ```

2. **Обновите домен в манифесте**
   ```json
   {
     "url": "https://yourdomain.com",
     "name": "Dash Games"
   }
   ```

3. **Соберите проект**
   ```bash
   npm run build
   ```

#### Шаг 3: Настройка Nginx

1. **Создайте конфигурацию сайта**
   ```bash
   sudo nano /etc/nginx/sites-available/yourdomain.com
   ```

2. **Добавьте конфигурацию**:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       root /path/to/your/project/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           # Если у вас есть backend API
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **Активируйте сайт**
   ```bash
   sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

#### Шаг 4: Настройка SSL

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Результат**: Ваш сайт будет доступен по адресу `https://yourdomain.com`

---

## 🔧 Важные настройки после развертывания

### 1. Обновление DNS записей

Убедитесь, что ваши DNS записи правильно настроены:

```
A record: yourdomain.com → IP адрес вашего сервера/CDN
CNAME record: www.yourdomain.com → yourdomain.com
```

### 2. Проверка HTTPS

После развертывания проверьте:
- ✅ Сайт открывается по HTTPS
- ✅ Редирект с HTTP на HTTPS работает
- ✅ TON Connect манифест доступен по `https://yourdomain.com/tonconnect-manifest.json`

### 3. Тестирование TON Connect

1. Откройте ваш сайт в браузере
2. Нажмите "Подключить кошелёк"
3. Убедитесь, что кошелёк успешно подключается

### 4. Настройка мониторинга (опционально)

Рекомендуется настроить мониторинг доступности сайта через:
- [UptimeRobot](https://uptimerobot.com) (бесплатно)
- [Pingdom](https://pingdom.com)
- Cloudflare Analytics (если используете Cloudflare)

---

## 🐛 Решение проблем

### Проблема: "TON Connect манифест недоступен"

**Решение**: Убедитесь, что файл `public/tonconnect-manifest.json` содержит правильный URL вашего домена.

### Проблема: "Сайт не открывается по HTTPS"

**Решение**: 
- Проверьте DNS записи
- Убедитесь, что SSL сертификат установлен
- Проверьте настройки файрвола

### Проблема: "Ошибки CORS"

**Решение**: Если используете отдельный backend, настройте CORS правильно для вашего домена.

---

## 📱 Финальная проверка

После развертывания убедитесь, что:

1. ✅ Сайт открывается по `https://yourdomain.com`
2. ✅ Все страницы загружаются корректно
3. ✅ TON Connect работает
4. ✅ Мобильная версия отображается правильно
5. ✅ Все изображения и ресурсы загружаются

**Поздравляем! Ваш Dash Games запущен на собственном домене! 🎉**

### Переменные окружения (опционально)

Dash Games может работать без дополнительных переменных окружения. Секреты `MOCHA_USERS_SERVICE_API_KEY` и `MOCHA_USERS_SERVICE_API_URL` нужны только если вы планируете добавить аутентификацию пользователей через Google OAuth.

**Для базового функционала игры эти переменные не требуются.**

Если вы хотите добавить аутентификацию в будущем:

1. **Локальная разработка**: создайте файл `.dev.vars` в корне проекта:
   ```
   MOCHA_USERS_SERVICE_API_KEY=your_api_key_here
   MOCHA_USERS_SERVICE_API_URL=your_api_url_here
   ```

2. **Продакшн**: настройте секреты в Cloudflare:
   ```bash
   npx wrangler secret put MOCHA_USERS_SERVICE_API_KEY
   npx wrangler secret put MOCHA_USERS_SERVICE_API_URL
   ```

## 🎨 Работа с ресурсами и анимациями

### Папка src/assets/

Папка `src/assets/` зарезервирована для статических ресурсов проекта.

Анимации для страниц 404 и маркета загружаются как GIF файлы из CDN.

### Добавление новых анимаций

Для локальных Lottie анимаций:
1. **Поместите JSON файл анимации в папку `src/assets/`**
2. **Импортируйте анимацию в ваш компонент**:
   ```typescript
   import myAnimation from '@/assets/my-animation.json';
   ```
3. **Используйте с Lottie компонентом**:
   ```jsx
   <Lottie
     animationData={myAnimation}
     loop={true}
     autoplay={true}
     style={{ width: '200px', height: '200px' }}
   />
   ```

Для GIF анимаций используйте CDN ссылки:
```jsx
<img
  src="https://your-cdn.com/animation.gif"
  alt="Animation"
  style={{ width: '200px', height: '200px', objectFit: 'contain' }}
/>
```

### Особенности страницы 404

Страница 404 (`src/react-app/pages/NotFound.tsx`) использует GIF анимацию 404.gif из CDN. Эта анимация включает:

- Анимированного желтого персонажа
- Размер анимации: 203x203px
- Автозапуск и циклическое воспроизведение

### Особенности страницы маркета

Страница маркета (`src/react-app/pages/Market.tsx`) использует GIF анимацию market.gif из CDN. Эта анимация включает:

- Анимированную монету с вращением
- Анимированный экран с кодом
- Размер анимации: 203x203px
- Автозапуск и циклическое воспроизведение
- Градиентный текст "Sooon..." с переходом от #4B8AFF к #4077DC

## ⚙️ Конфигурация

### Структура проекта

```
dash-games/
├── src/
│   ├── assets/             # Статические ресурсы и анимации
│   │   └── 404.json              # Lottie анимация для страницы 404
│   ├── react-app/          # React фронтенд
│   │   ├── components/     # Переиспользуемые компоненты
│   │   │   ├── Footer.tsx              # Навигационная панель
│   │   │   ├── GameModeCard.tsx        # Карточка игрового режима
│   │   │   ├── PromoBanner.tsx         # Промо-баннер с каруселью
│   │   │   ├── TonConnectProvider.tsx  # Провайдер TON Connect
│   │   │   └── UserHeader.tsx          # Хедер с балансом и кошельком
│   │   ├── pages/          # Страницы приложения
│   │   │   ├── Home.tsx         # Главная страница
│   │   │   ├── Cases.tsx        # Страница кейсов
│   │   │   ├── Axes.tsx         # Страница топоров
│   │   │   ├── Upgrade.tsx      # Страница апгрейда
│   │   │   ├── PvP.tsx          # Страница PvP
│   │   │   ├── Market.tsx       # Страница маркета
│   │   │   ├── Profile.tsx      # Страница профиля
│   │   │   └── NotFound.tsx     # Страница 404 с Lottie анимацией
│   │   ├── hooks/          # React хуки (пока не используются)
│   │   ├── App.tsx         # Главный компонент приложения
│   │   ├── main.tsx        # Точка входа React
│   │   └── index.css       # Глобальные стили
│   ├── shared/             # Общие типы и утилиты
│   │   └── types.ts        # Общие TypeScript типы
│   └── worker/             # Cloudflare Worker (API)
│       └── index.ts        # Worker API endpoints
├── public/                 # Статические файлы
│   └── tonconnect-manifest.json  # Манифест TON Connect
├── migrations/             # Миграции базы данных (пока пусто)
├── requirements.txt        # Список зависимостей проекта
└── README.md              # Документация проекта
```

### Настройка TON Connect

1. Обновите `public/tonconnect-manifest.json` с вашими данными:
   ```json
   {
     "url": "https://your-domain.com",
     "name": "Dash Games",
     "iconUrl": "https://your-domain.com/favicon.ico"
   }
   ```

2. Убедитесь, что манифест доступен по адресу `https://your-domain.com/tonconnect-manifest.json`

### База данных

Проект использует Cloudflare D1 (SQLite). Схема базы данных создается автоматически через миграции в папке `migrations/`.

## 🔐 Безопасность

- Приложение работает без дополнительных API ключей для базового функционала
- Если используете аутентификацию: все API ключи должны быть настроены как секреты в Cloudflare Workers
- Никогда не коммитьте секретные ключи в репозиторий
- Используйте файл `.dev.vars` для локальной разработки (добавлен в `.gitignore`)

## 🐛 Отладка

### Логи Cloudflare Workers

```bash
npx wrangler tail
```

### Локальные логи Vite

Логи доступны в файлах:
- `/var/log/vite.out.log` (stdout)
- `/var/log/vite.err.log` (stderr)

### Проверка TypeScript

```bash
npx tsc --noEmit
```

## 📱 Особенности мобильной версии

Приложение оптимизировано для мобильных устройств с фиксированной шириной 412px. Убедитесь, что:

1. Viewport настроен правильно в `index.html`
2. Все компоненты адаптированы под мобильный интерфейс
3. Touch-события работают корректно

## 🔗 Полезные ссылки

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [TON Connect Documentation](https://docs.ton.org/develop/dapps/ton-connect/overview)
- [Hono Documentation](https://hono.dev/)
- [React Documentation](https://react.dev/)

## 📄 Лицензия

Этот проект является частной собственностью. Все права защищены.

## 🆘 Поддержка

При возникновении проблем с развертыванием:

1. Проверьте логи с помощью `npx wrangler tail`
2. Убедитесь, что все секреты настроены правильно
3. Проверьте, что домен в TON Connect манифесте указан верно
4. Обратитесь к документации Cloudflare Workers

---

**Внимание**: Игра может вызывать зависимость. Играйте ответственно.
