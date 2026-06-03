# Summer App — кросс-платформенная версия

Монорепо: **общие логика и данные**, а UI нативный для каждой платформы — **web на Next.js (DOM)**, **iOS/Android на React Native (Expo)**, **десктоп на Tauri**.

## Стек

| Слой | Технология |
|---|---|
| Монорепо | Turborepo + pnpm |
| Web | Next.js 14 (App Router) — нативный DOM-UI (React + Tailwind), `@dnd-kit` |
| Mobile | Expo + Expo Router — React Native + NativeWind, draggable-flatlist |
| Desktop | Tauri (оборачивает web-сборку Next) |
| Общий React-слой | `@summer/client` — провайдеры/хуки (store, погода, sync), без UI |
| Состояние | Zustand + persist |
| Данные | Supabase (realtime sync) + KV-хранилище (localStorage / MMKV) |
| Язык | TypeScript (strict) |

## Структура

```
summer-app/
├─ apps/
│  ├─ next/        # web — нативный DOM-UI (components/ + features/)
│  ├─ expo/        # iOS/Android (Expo Router) — RN-UI
│  └─ desktop/     # Tauri (обёртка над web-сборкой)
└─ packages/
   ├─ domain/      # типы, данные расписания, чистая логика (0 зависимостей от UI)
   ├─ data/        # Supabase + KV-хранилище + sync
   ├─ state/       # Zustand store + селекторы
   ├─ client/      # React-провайдеры и хуки (общие для web и mobile, без UI)
   ├─ ui/          # RN-примитивы (только mobile)
   ├─ app/         # RN-экраны (только mobile)
   └─ config/      # дизайн-токены + общий tailwind-preset
```

**Принцип:** ключевая логика и слои данных (`domain` + `data` + `state` + `client`) — **общие**. Отличается только UI: web рисует своими DOM-компонентами в `apps/next`, mobile — RN-компонентами в `packages/app` + `packages/ui`. Так web не платит за react-native-web по перформансу, а у мобайла остаётся полный доступ к нативному SDK. Цветовые токены общие через `@summer/config` (один Tailwind-preset для DOM и NativeWind).

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

## Что перенесено

- **Доменное ядро** целиком: расписание недели, расчёт времени по длительности, прошедшие дни, категории целей, КБЖУ-нормы, погодная логика. Покрыто строгим `tsc`.
- **Состояние и синхронизация:** Zustand store со всеми действиями, persist, Supabase realtime sync за единым интерфейсом.
- **Экран «Неделя»** — карточки дней, чекбоксы, секция выполнения (Полностью/Половина/Четверть), перенос, запись тренировки, замок прошедших дней; раскладки `WeekLayout.web` (сетка) / `WeekLayout.native` (лента).
- **Экран «КБЖУ»** — выбор дня, нормы/остаток, приёмы с автодополнением; раскладки web (две колонки) / native (стопка).
- **Экран «Тренировки»** — журнал с итогами и удалением.
- **Экран «Достижения»** — сводка целей и прогресс по категориям (`selectStats`).
- **Экран «Цели»** — глобальные цели в духе milestone: создаёшь цель («Съездить в Японию»), внутрь добавляешь задачи («побывать в Токио», «побывать в Хоккайдо»); цель без задач — просто обычная цель. Задача ссылается на родителя через `parentId`, удаление цели каскадно удаляет её задачи. Добавление/удаление из UI, необязательные заметки на обоих уровнях. Данные в `AppState.goals`, синхронизируются как остальное состояние (LWW по `goalItem:<id>`). Пока только web (`apps/next/features/goals.tsx`).
- **Живой прогноз погоды** — `WeatherProvider` тянет Open-Meteo, обновляет температуру/сухо-дождь на карточках дней и показывает баннер «что изменилось».
- **Настройки** — ввод Supabase URL/ключа/кода (переопределяют env) + экспорт/импорт состояния в JSON.

## Дальше (готово к доращиванию)

- **Drag-and-drop** дел: на web — `dnd-kit`, на native — `react-native-draggable-flatlist`. Экшен `moveBlock(uid, day, index)` уже есть в store — остаётся подключить библиотеку на каждой платформе.

## Заметки

- Версии React/React Native выровнены под Expo SDK 51 (RN 0.74). При обновлении SDK держи их согласованными во всех `package.json`.
- Supabase anon/publishable-ключ безопасен на клиенте при включённом RLS (SQL из исходного приложения создаёт таблицу `app_state`, политику и Realtime).
