# Документация архитектуры

Полное описание монорепо: какие пакеты есть, зачем они, на чём держатся и где используются. Дополняет `README.md` (запуск) и `DEPLOY.md` (Vercel).

## 1. Идея

Один и тот же UI и вся бизнес-логика живут в общих пакетах и переиспользуются тремя приложениями:

```
                       ┌─────────── apps ───────────┐
                       │  next (web)  expo (mobile)  desktop (Tauri) │
                       └──────────────┬──────────────┘
                                      │ импортируют
        ┌───────────────┬────────────┼────────────┬───────────────┐
     @summer/app   @summer/ui   @summer/state  @summer/data   @summer/config
        │               │            │             │
        └──────► @summer/domain ◄─────┘─────────────┘   (чистое ядро, без UI)
```

Поток данных в одну сторону: **UI → действия store → persist (локально) + sync (облако) → подписки store → ре-рендер UI**. Производные данные считаются селекторами, не хранятся.

## 2. Карта репозитория

```
apps/
  next/      Next.js (App Router) — web. Через react-native-web рендерит те же RN-компоненты.
  expo/      Expo Router — iOS/Android. Нативный React Native.
  desktop/   Tauri — оборачивает статическую web-сборку Next в нативное окно.
packages/
  domain/    Чистое ядро: типы, данные расписания, вся логика. Ноль UI-зависимостей.
  data/      Внешний мир: Supabase-клиент, sync, абстракция хранилища (KV).
  state/     Zustand store (+persist) и селекторы (производные данные).
  ui/        Универсальные примитивы (Box, Txt, Card, Checkbox…) на NativeWind.
  app/       Экраны, провайдеры, фичи. Композирует ui+state+domain.
  config/    Дизайн-токены и общий tailwind-preset (источник правды по стилям).
```

## 3. Пакеты подробно

### `@summer/domain` — ядро (зачем: единая правда логики)
Чистый TypeScript, **никаких зависимостей** (даже React). Поэтому покрывается строгим `tsc` и переносится куда угодно.
- `types.ts` — `AppState`, `Block`, `Day`, `Workout`, `Meal`, `SyncConfig`, `WeatherDay`…
- `schedule.ts` — данные недели; реестр блоков `BLOCKS` (ключ `uid` стабилен при перетаскивании); `defaultLayout()`.
- `logic.ts` — `parseDur`/`fmtTOD`/`sequentialTimes` (время), `isPast`, `relativeDate`, `goalSport`/`estimateKcal` (калории), `CATEGORIES`, `dayNorm` (КБЖУ), `weatherInfo`/`parseForecast`/`diffWeather`/`FORECAST_URL` (погода), `fmtDuration`.
- `constants.ts` — `SHORT`, `KBJU_BONUS`, `COMPLETION_LEVELS`.

**Используется:** всеми пакетами и приложениями.

### `@summer/data` — внешний мир (зачем: изолировать I/O за интерфейсами)
- `storage.ts` — интерфейс `KVStorage` + `webStorage` (localStorage) + `memoryStorage`. Нативная реализация (MMKV) живёт в `apps/expo` и инжектится.
- `supabase.ts` — `getSupabase(config)`, `configFromEnv()`.
- `sync.ts` — `connectSync()`: тянет/создаёт строку `app_state` по коду, подписывается на realtime, отдаёт `push`/`dispose`.

**Зависит от:** `domain`, `@supabase/supabase-js`. **Используется:** `state`, `app`.

### `@summer/state` — состояние (зачем: единый источник изменяемых данных)
- `store.ts` — `createAppStore(kv)`: Zustand + `persist` (через адаптер `KVStorage`). Все действия: `toggleBlock`, `setLevel`, `setMovedDate`, `moveBlock`, `addWorkout`, `addMeal`, `rememberFood`, `setLastWeather`, `setSyncConfig`, `replaceAll`. `normalizeLayout` гарантирует целостность раскладки.
- `selectors.ts` — производные данные: `selectDayBlocks` (с пересчётом времени), `selectWeekProgress`, `selectStats`, `selectKbju`.

**Зависит от:** `domain`, `data`, `zustand`. **Используется:** `app`.

### `@summer/ui` — примитивы (зачем: общий визуальный язык на обеих платформах)
RN-компоненты (`View`/`Text`/`Pressable`) со стилями через `className` (NativeWind). `Box`, `Txt`, `Card`, `Btn`, `Tag`, `Checkbox`, `ProgressBar`, `Segmented`, `MetricCard`.

**Зависит от (peer):** `react`, `react-native`, `nativewind`; типы из `domain`. **Используется:** `app`.

### `@summer/app` — фичи и экраны (зачем: вся композиция UI в одном месте)
- `provider/` — `StoreProvider` (создаёт store, инжектит storage), `WeatherProvider` (тянет прогноз, считает изменения), `SyncBridge` (конфиг из настроек/env → `useSync`), `AppProviders` (всё вместе — единая точка для приложений), `useSync`.
- `features/<name>/` — каждый экран: `use<Name>` (логика-хук) + `parts/` (общие кубики) + `*.web.tsx`/`*.native.tsx` (раскладки) + тонкий `*Screen.tsx`.
  - `week/` — Неделя (DayCard, BlockRow, CheckinSection, **BlockList** = drag-and-drop).
  - `kbju/` — КБЖУ.
  - `workouts/`, `stats/`, `settings/`.

**Зависит от:** `domain`, `data`, `state`, `ui` (+ peer react/react-native/nativewind; dev: dnd-kit, draggable-flatlist — только для типов платформенных файлов). **Используется:** всеми приложениями.

### `@summer/config` — токены (зачем: один источник стилей)
`tokens.js` (цвета/радиусы/отступы) + `tailwind-preset.js` (классы `bg-primary`, `text-ink`, `bg-tag-*`…). Подключается в tailwind-конфиге каждого приложения.

## 4. Внешние зависимости: что и где

| Пакет | Зачем | Где |
|---|---|---|
| `turbo` | оркестрация задач монорепо | root |
| `typescript`, `prettier` | язык, формат | root / все |
| `@supabase/supabase-js` | клиент Supabase, realtime | `data` |
| `zustand` | стор + persist | `state` |
| `react`, `react-native` | базовые примитивы | `ui`, `app`, apps |
| `nativewind` | Tailwind-классы на web и native | `ui`, `app`, apps |
| `next`, `react-dom` | web-фреймворк | `apps/next` |
| `react-native-web` | рендер RN-компонентов в DOM | `apps/next` |
| `tailwindcss`, `postcss`, `autoprefixer` | сборка стилей | apps (web/native) |
| `@dnd-kit/core/sortable/utilities` | drag-and-drop на web | `apps/next` (+ типы в `app`) |
| `expo`, `expo-router`, `expo-*` | мобильный фреймворк и навигация | `apps/expo` |
| `react-native-mmkv` | быстрое локальное хранилище (native) | `apps/expo` |
| `react-native-draggable-flatlist` | drag-and-drop на native | `apps/expo` (+ типы в `app`) |
| `react-native-reanimated`, `react-native-gesture-handler` | жесты/анимации для DnD | `apps/expo` |
| `react-native-safe-area-context`, `react-native-screens` | навигация/края экрана | `apps/expo` |
| `@tauri-apps/cli` (+ Rust `tauri`) | десктопный контейнер | `apps/desktop` |

## 5. Паттерн платформенных файлов

При импорте `./Foo` бандлер выбирает реализацию: **Metro → `Foo.native.tsx`**, **Next/webpack → `Foo.web.tsx`** (порядок расширений задан в `apps/next/next.config.js`). Рядом кладётся `Foo.d.ts` — только чтобы `tsc` видел типы (на сборку не влияет).

Сейчас так сделаны:
- `week/WeekLayout` — `.web` (сетка) / `.native` (лента).
- `kbju/KbjuLayout` — `.web` (две колонки) / `.native` (стопка).
- `week/parts/BlockList` — `.web` (dnd-kit) / `.native` (draggable-flatlist).

Так добавляется любое расхождение под платформу, не задевая остальные.

## 6. Drag-and-drop

Список блоков дня — компонент `BlockList` (платформенный):
- **web:** `@dnd-kit` — сортировка внутри дня; за грип ⠿ тянется строка.
- **native:** `react-native-draggable-flatlist` — длинный тап по строке начинает перетаскивание.
- **между днями (обе платформы):** чипы дней «В день недели:» в секции выполнения вызывают `moveBlock(uid, dayIndex, end)`.

Любой результат сводится к действию `moveBlock(uid, toDay, toIndex)`; порядок хранится в `layout` и синхронизируется.

> Требует установки: `@dnd-kit/*` (web) и `react-native-draggable-flatlist` + `react-native-reanimated` + `react-native-gesture-handler` (native, плюс плагин reanimated в `apps/expo/babel.config.js` и `GestureHandlerRootView` в `_layout.tsx`). Нативный DnD вложен в ScrollView — для коротких списков ок; при росте дня перейти на `NestableScrollContainer`.

## 7. Рецепт: новый экран

1. `packages/app/src/features/<name>/` → `use<Name>.ts` (логика через селекторы), `parts/` (кубики на `@summer/ui`), при необходимости `<Name>Layout.web/.native.tsx` + `.d.ts`, тонкий `<Name>Screen.tsx`.
2. Экспорт в `packages/app/src/index.ts`.
3. Роут: `apps/next/app/<name>/page.tsx` (`"use client"`) и `apps/expo/app/<name>.tsx`; добавить вкладку в `apps/next/app/nav.tsx` и `apps/expo/app/_layout.tsx`.

Новые данные — поле в `AppState` + действие в `store.ts` + (если нужно) селектор. Чистую логику — в `domain` (и покрыть `tsc`).

## 8. Команды

```bash
pnpm install            # установка всего монорепо
pnpm dev:web            # Next → localhost:3000
pnpm dev:mobile         # Expo
pnpm --filter desktop dev   # Tauri (нужен Rust)
pnpm build:web          # сборка web
pnpm typecheck          # проверка типов по всем пакетам
```
