# Summer App — кросс-платформенная версия

Монорепо: один и тот же UI и вся логика работают на **web (Next.js)**, **iOS/Android (Expo / React Native)** и **десктопе (Tauri)**.

## Стек

| Слой | Технология |
|---|---|
| Монорепо | Turborepo + pnpm |
| Web | Next.js 14 (App Router) + react-native-web |
| Mobile | Expo + Expo Router |
| Desktop | Tauri (оборачивает web-сборку) |
| UI / стили | React Native primitives + NativeWind (Tailwind для web+native) |
| Навигация | Expo Router (native) / Next App Router (web) |
| Состояние | Zustand + persist |
| Данные | Supabase (realtime sync) + KV-хранилище (localStorage / MMKV) |
| Язык | TypeScript (strict) |

## Структура

```
summer-app/
├─ apps/
│  ├─ next/        # web (Next.js)
│  ├─ expo/        # iOS/Android (Expo Router)
│  └─ desktop/     # Tauri (обёртка над web-сборкой)
└─ packages/
   ├─ domain/      # типы, данные расписания, чистая логика (0 зависимостей от UI)
   ├─ data/        # Supabase + KV-хранилище + sync
   ├─ state/       # Zustand store + селекторы
   ├─ ui/          # универсальные примитивы (Box, Txt, Card, Checkbox, ...)
   ├─ app/         # экраны (WeekScreen, KbjuScreen) + провайдеры
   └─ config/      # дизайн-токены + общий tailwind-preset
```

**Принцип портируемости:** весь UI написан один раз в `packages/app` на RN-примитивах из `packages/ui`. На web их рендерит `react-native-web`, на мобайле — нативный React Native, на десктопе — та же web-сборка внутри Tauri. Платформам остаётся только тонкая «обёртка» (роуты + инъекция хранилища).

## Установка

```bash
cd summer-app
pnpm install
```

Скопируй переменные окружения:
```bash
cp apps/next/.env.local.example apps/next/.env.local
cp apps/expo/.env.example apps/expo/.env
```

## Запуск

```bash
pnpm dev:web      # Next.js  → http://localhost:3000
pnpm dev:mobile   # Expo (QR-код для Expo Go / симулятор)
pnpm --filter desktop dev   # Tauri (нужен Rust toolchain)
```

## Сборка

```bash
pnpm build:web                 # Next.js (Vercel)
pnpm --filter desktop build    # десктопный бинарник (Tauri)
# мобайл: cd apps/expo && eas build  (через Expo EAS)
```

## Что уже перенесено (каркас)

- **Доменное ядро** целиком: расписание недели, расчёт времени по длительности, прошедшие дни, категории целей, КБЖУ-нормы, погодная логика. Покрыто строгим `tsc`.
- **Состояние и синхронизация:** Zustand store со всеми действиями (отметки, уровни, перенос, тренировки, приёмы пищи, layout), persist, Supabase realtime sync за единым интерфейсом.
- **Экран «Неделя»:** карточки дней, чекбоксы (выполнено), тап по делу → секция выполнения (Полностью/Половина/Четверть), перенос (на завтра/послезавтра), запись тренировки; замок прошедших дней.
- **Экран «КБЖУ»:** выбор дня, нормы/остаток, список приёмов, добавление с автодополнением из сохранённых блюд.

## Дальше (готово к доращиванию)

- **Drag-and-drop** дел: на web — `dnd-kit`, на native — `react-native-draggable-flatlist`. Экшен `moveBlock(uid, day, index)` уже есть в store — остаётся подключить библиотеку на каждой платформе.
- **Живой прогноз погоды:** `FORECAST_URL` / `parseForecast` / `diffWeather` уже в `domain`; нужен хук `useWeather()` (один `fetch`, общий для платформ).
- **Экран статистики** (вкладка достижений): селектор `selectStats` готов — остаётся экран.
- **Настройки синхронизации** (ввод кода) — сейчас код берётся из env.

## Заметки

- Версии React/React Native выровнены под Expo SDK 51 (RN 0.74). При обновлении SDK держи их согласованными во всех `package.json`.
- Supabase anon/publishable-ключ безопасен на клиенте при включённом RLS (SQL из исходного приложения создаёт таблицу `app_state`, политику и Realtime).
