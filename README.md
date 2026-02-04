# Предпроф — Фронтенд

**Продакшен-сайт:** https://solaris.sherstd.ru/

Админ панель находится на: https://solaris.sherstd.ru/admin

Чтобы получить к ней доступ, надо войти с данными ниже:
```
Логин: user1@example.com
Пароль: 123
```

В обычный аккаунт можно зайти по этому же логину и паролю, также вы можете зарегистрироваться сами.

Клиентская часть платформы подготовки к олимпиадам (**Next.js + TypeScript**).

## **Стек**

| Часть | Технологии |
|---|---|
| Фреймворк | Next.js 16 (App Router) |
| Язык | TypeScript |
| Стили | TailwindCSS |
| UI | Shadcn UI, Lucide, Sonner |
| Состояние | Zustand |
| API client | `@hey-api/openapi-ts` (генерация в `lib/client`) |
| Развертывание | Docker, GitHub Actions |

---

## **Требования**
- Node.js 20+
- npm 9+ (или совместимая версия)

---

## **Переменные окружения**

Создайте файл **`.env`** в корне проекта и добавьте **только** это:

``` env
NEXT_PUBLIC_API_BASE=https://solaris.sherstd.ru
NEXT_PUBLIC_WS_HOST=wss://solaris.sherstd.ru
```

---

## **Быстрый старт (локально)**

1) Установить зависимости:

``` bash
npm ci
```

2) (Не обязательно) Сгенерировать API-клиент (если обновлялись типы/эндпоинты):

``` bash
npm run generate-client
```

3) Запуск в режиме разработки:

``` bash
npm run dev
```

По умолчанию dev-сервер поднимается на `http://localhost:3000`.

---

## **Сборка и запуск**

``` bash
npm run build
npm run start
```

---

## **Docker**

`Dockerfile` в корне собирает приложение в production-режиме и использует **standalone**-режим Next.js.

Сборка образа:

``` bash
docker build -t predprof-frontend .
```

Запуск контейнера:

``` bash
docker run -d \
  -p 3000:3000 \
  -e PORT=3000 \
  --env-file .env \
  --name predprof-frontend \
  predprof-frontend
```

---

## **API-клиент (OpenAPI)**

Клиент генерируется в `lib/client` через `@hey-api/openapi-ts`.

Команда генерации:

``` bash
npm run generate-client
```

---

## **Полезные команды**
- `npm run dev` — запуск разработки
- `npm run build` — сборка для production
- `npm run start` — запуск production-сервера (после `build`)
- `npm run lint` — запуск ESLint
- `npm run generate-client` — генерация/обновление API-клиента из OpenAPI

---

## **Структура проекта**
- `app/` — страницы Next.js (App Router)
- `components/` — UI-компоненты
- `lib/client/` — сгенерированный API-клиент
- `public/` — статические ассеты