# Документация архитектуры

Полное описание монорепо: какие пакеты есть, зачем они, на чём держатся и где используются, и как работает синхронизация. Дополняет `README.md` (запуск) и `DEPLOY.md` (Vercel).

## 1. Идея

**Общие — логика и данные. Разный — UI.** Web рисует нативными DOM-компонентами (Next.js), мобайл — React Native (Expo), а вся бизнес-логика, состояние и слой данных живут в общих пакетах. Web не платит за `react-native-web` по перформансу, а у мобайла остаётся полный доступ к нативному SDK.

```
                 apps (UI per platform)
        ┌───────────────┬───────────────┐
   next (web DOM)   expo (React Native)  desktop (Tauri → web build)
        │               │
        │ оба используют общие пакеты
        ▼               ▼
   ┌──────────────────────────────────────────┐
   │  @summer/client   React-провайдеры/хуки   │  (store, погода, sync) — без UI
   │  @summer/state    Zustand store + селекторы + LWW-merge
   │  @summer/data     Supabase + KV-хранилище + sync-транспорт
   │  @summer/domain   типы, данные, чистая логика (0 зависимостей)
   └──────────────────────────────────────────┘
```

Поток данных однонаправленный: **UI → действия store → persist (локально) + sync (облако) → подписки store → ре-рендер**. Производные значения считаются селекторами, не хранятся.

## 2. Карта репозитория

```
apps/
  next/      web — нативный DOM-UI (components/ui.tsx + features/*.tsx), dnd-kit
  expo/      iOS/Android — React Native UI (Expo Router)
  desktop/   Tauri — оборачивает статическую web-сборку Next
packages/
  domain/    типы, данные расписания, чистая логика. Ноль зависимостей.
  data/      Supabase-клиент, sync-транспорт, абстракция хранилища (KV)
  state/     Zustand store, селекторы, бесконфликтный merge (LWW)
  client/    React-провайдеры и хуки (общие для web и mobile), без UI
  ui/        RN-примитивы — ТОЛЬКО mobile
  app/       RN-экраны — ТОЛЬКО mobile
  config/    дизайн-токены + общий tailwind-preset (DOM и NativeWind)
```

## 3. Пакеты

### `@summer/domain` — ядро
Чистый TypeScript, **ноль зависимостей**. Переносится куда угодно, покрыт строгим `tsc`.
- `types.ts` — `AppState` (включая `clock` для merge), `SyncState`, `Block`, `Workout`, `Meal`, `Goal` (дерево целей: `parentId` + `order`/`createdAt`, см. §8)…
- `schedule.ts` — данные недели, реестр блоков `BLOCKS` (стабильный `uid`).
- `logic.ts` — время (`parseDur`/`sequentialTimes`), `isPast`, калории (`goalSport`/`estimateKcal`), КБЖУ (`dayNorm`), погода (`parseForecast`/`diffWeather`).
- `constants.ts` — `SHORT`, `KBJU_BONUS`, `COMPLETION_LEVELS`.

### `@summer/data` — внешний мир
- `storage.ts` — интерфейс `KVStorage` + `webStorage` (localStorage). MMKV-реализация — в `apps/expo`, инжектится.
- `supabase.ts` — `getSupabase(config)`, `configFromEnv()`.
- `sync.ts` — `connectSync()`: транспорт. Тянет/создаёт строку `app_state` по коду, подписывается на realtime, отдаёт `push`/`dispose`. Дедуп канала под StrictMode.

### `@summer/state` — состояние
- `store.ts` — `createAppStore(kv)`: Zustand + persist. Все действия бампают `clock`. Действие `mergeRemote` сливает облако без потерь. Цели: `addGoal` (возвращает `id` — нужен редактору для фокуса), `updateGoal`, `removeGoal` (каскадно удаляет всё поддерево по `parentId`).
- `selectors.ts` — производные: `selectDayBlocks` (с пересчётом времени), `selectWeekProgress`, `selectStats`, `selectKbju`.
- `merge.ts` — `mergeStates(local, remote)`: бесконфликтный LWW-merge (см. §7).

### `@summer/client` — React-слой (общий)
Провайдеры и хуки на чистом React, **без UI** — поэтому работают и в DOM, и в RN.
- `StoreProvider` + `useAppStore`/`useActions`/`useRawStore`.
- `WeatherProvider` + `useWeather` (тянет Open-Meteo, считает изменения).
- `useSync` — realtime-синхронизация поверх `connectSync` + merge.
- `SyncBridge` — берёт конфиг из настроек/env и подключает `useSync` (конфиг мемоизируется, иначе новый объект на каждый рендер ре-триггерил бы reconnect).
- `SyncStatus` — статус синка (`online`/`connected`/`syncing`) как **внешний стор** (`useSyncExternalStore`): `useSyncStatus()` для бейджей в UI, `setSyncStatus()` пишет из `useSync`. Не Context — апдейт ре-рендерит только читающие компоненты, без шторма по всему дереву.
- `AppProviders` — всё вместе, единая точка для приложений.

### `@summer/ui` и `@summer/app` — только mobile
RN-примитивы и RN-экраны (Expo). Web их не использует. Провайдеры в `@summer/app` — тонкие реэкспорты из `@summer/client`.

### `@summer/config` — токены
`tokens.js` + `tailwind-preset.js`. Один preset и для DOM-Tailwind (web), и для NativeWind (mobile) — цвета совпадают.

## 4. Внешние зависимости

| Пакет | Зачем | Где |
|---|---|---|
| `turbo`, `typescript` | монорепо, язык | root |
| `@supabase/supabase-js` | клиент + realtime | `data` |
| `zustand` | стор + persist | `state` |
| `next`, `react-dom` | web-фреймворк | `apps/next` |
| `@dnd-kit/*` | drag-and-drop на web | `apps/next` |
| `clsx`, `tailwindcss` | классы/стили web | `apps/next` |
| `react-native`, `nativewind` | mobile UI | `apps/expo`, `ui`, `app` |
| `react-native-mmkv` | локальное хранилище native | `apps/expo` |
| `react-native-draggable-flatlist` + `reanimated` + `gesture-handler` | DnD native | `apps/expo`, `app` |
| `expo`, `expo-router` | мобильный фреймворк | `apps/expo` |
| `@tauri-apps/cli` | десктоп-контейнер | `apps/desktop` |

## 5. Платформенный UI

Web и mobile имеют **разные** наборы UI-компонентов:
- web — `apps/next/components/ui.tsx` (DOM) + `apps/next/features/*.tsx` (экраны).
- mobile — `packages/ui` (RN-примитивы) + `packages/app/src/features/*` (экраны).

Внутри mobile, где нужно расхождение раскладки, используются файлы платформы (`*.native.tsx`) — Metro подставит нужный. Общими между web и mobile остаются хуки/селекторы (`@summer/client`, `@summer/state`) и логика (`@summer/domain`). Добавляешь фичу мобайлу — трогаешь только `apps/expo`/`@summer/app`, web не задет (и наоборот).

## 6. Drag-and-drop

Любой результат сводится к действию `moveBlock(uid, toDay, toIndex)`; порядок хранится в `layout`.
- web — `@dnd-kit` в `apps/next/features/week.tsx` (тянешь за грип ⠿).
- mobile — `react-native-draggable-flatlist` в `@summer/app` (долгий тап).
- между днями (везде) — чипы дней в секции выполнения.

## 7. Синхронизация (как работает)

Цель: несколько вкладок/устройств на одном «коде синхронизации» работают **без потерь** — параллельные правки сливаются, ничего не затирается, все сходятся к одному состоянию.

### 7.1 Транспорт (Supabase)
В Supabase одна таблица `app_state(code, data jsonb, updated_at)`. Состояние всего приложения хранится одним JSONB-блобом, ключ — общий `code` (он же логин+пароль). `connectSync()`:
1. читает строку по коду;
2. подписывается на Postgres realtime по этой строке;
3. отдаёт `push(state)` (upsert) и `dispose()`.
Каждая запись помечается `_writer` (id клиента) — свои же эхо-события игнорируются.

### 7.2 Бесконфликтный merge (LWW-CRDT)
Главное: облако **не заменяет** локальное состояние, а **сливается** по полям. У каждого поля есть логический таймстамп в карте `clock`:
- `dayDone:<uid>`, `goalLevel:<uid>`, `goalMoved:<uid>`, `foods:<name>` — пер-ключевой LWW;
- `workout:<id>`, `meal:<id>`, `goalItem:<id>` — пер-сущностный LWW (наличие/удаление тоже по таймстампу — «tombstone», чтобы старый клиент не воскрешал удалённое);
- `layout` — один таймстамп на всю раскладку.

Каждое действие в store ставит `clock[key] = Date.now()`. При получении удалённого состояния `mergeStates(local, remote)`:
- для каждого поля берёт значение со **стороны с большим таймстампом**;
- правки **разных** полей в разных вкладках — обе сохраняются;
- правки **одного** поля — побеждает более свежая (last-writer-wins).

Merge **коммутативен и идемпотентен**, поэтому все клиенты сходятся к идентичному состоянию (проверено).

### 7.3 Защита от циклов и гонок (`useSync`)
- **Pull-first:** пуш включается только ПОСЛЕ первичной загрузки облака — переоткрытая вкладка с устаревшим `localStorage` сперва подтянет свежее, а не затрёт его. После подключения один раз пушит свой (уже слитый) результат, чтобы её правки разъехались.
- **Канонический stringify** (сортировка ключей) для всех сравнений + детерминированная сортировка массивов в merge — логически равные состояния считаются равными, поэтому нет бесконечного пинг-понга порядков.
- **Дедуп**: одинаковые снапшоты не применяются и не пушатся; свои realtime-эхо игнорируются по `_writer`; дублирующиеся каналы (StrictMode) убираются.
- **Generation-guard на `connect()`:** каждый вызов берёт токен `++gen`; параллельные подключения (начальный connect + событие `online`, либо два `online` подряд) не могут оба «победить» — устаревший после `await` диспозит свой handle вместо перезаписи, иначе утекала бы realtime-подписка.

> Замечание про хранение: локальная копия живёт в `localStorage`/MMKV и **привязана к origin** (на web). На Vercel это значит, что per-deploy preview-URL открывается с пустым хранилищем — данные подтягиваются из облака только если настроен синк. Подробности и восстановление — `DEPLOY.md` §6.

### 7.4 Поток на практике
Отметил блок в вкладке A → `clock["dayDone:X"]=t` → debounce-push в облако → realtime → вкладка B получает → `mergeRemote` сливает (у B появляется отметка X, её собственные правила Y сохраняются) → B пушит слитый результат → сходимость. Конфликт по одному полю решается по таймстампу.

### 7.5 Границы
Это LWW на уровне значений: при одновременной правке **одного и того же** поля победит последний по времени (это ожидаемо). Для текстов с одновременным набором в одно поле нужен был бы text-CRDT — здесь не требуется. `clock` растёт по мере удалений (tombstones); при больших объёмах можно добавить периодическую очистку старых tombstone.

## 8. Цели: модель и outline-редактор

Вкладка «Цели» (`apps/next/features/goals.tsx`, пока только web) — редактор списков в духе Apple Notes: каждая строка всегда редактируема, без отдельных форм и режимов.

### 8.1 Модель данных
Все цели и задачи — записи одного типа `Goal` в плоском массиве `AppState.goals`:

| Поле | Назначение |
|---|---|
| `id` | стабильный uid |
| `title` | текст строки (сохраняется на каждое нажатие) |
| `parentId?` | ссылка на родителя; нет — верхний уровень (глобальная цель). Вложенность не ограничена |
| `note?` | необязательная заметка |
| `createdAt?` | время создания |
| `order?` | явный ключ сортировки среди соседей (см. 8.3) |

Дерево строится на лету: `Map<parentId, Goal[]>`. Защиты при сборке (после merge данные могут быть любыми): задачи-сироты (родитель удалён на другом устройстве) и узлы, попавшие в цикл, всплывают на верхний уровень — ничего не теряется.

### 8.2 Клавиатура
- **Enter** — новая строка ниже на том же уровне (у строки с детьми — первым ребёнком, чтобы визуально встать сразу под ней);
- **Tab / Shift+Tab** — вложить под предыдущего соседа / вынести на уровень родителя;
- **Backspace на пустой строке без детей** — удалить, фокус на строку выше;
- ✎ (заметка) и ✕ (удалить с поддеревом) — по наведению;
- нижняя строка-«призрак»: начал печатать — создалась новая глобальная цель.

### 8.3 Порядок строк
Merge сортирует массив `goals` по `id` (нужно для детерминизма, см. §7.3), поэтому порядок отображения — забота UI: сортировка по `orderKey = order ?? createdAt ?? clock["goalItem:<id>"]`.
- Вставка между соседями — fractional ranking: `order = (a + b) / 2`, в конец — `+1000`;
- `createdAt` — фолбэк для записей, созданных до появления `order`;
- фолбэк на `clock` ненадёжен (бампается каждым редактированием) — поэтому при открытии экрана записям без `order` один раз проставляется текущая позиция как явный `order` (миграция; сходится между устройствами через LWW).

### 8.4 Фокус
Действия Enter/Tab/Backspace меняют структуру, и React пересобирает строки — фокус нельзя ставить «в лоб». Строки регистрируют свои `input` в `Map<id, HTMLInputElement>`, действие пишет id в `pendingFocus`, а `useLayoutEffect` родителя после ре-рендера (до отрисовки кадра) переводит каретку.

### 8.5 Удаление
`removeGoal` в store каскадный: обход поддерева по рёбрам `parentId`, каждый удалённый id получает бамп `clock` (tombstone) — другие устройства не воскресят поддерево.

## 9. Рецепт: новый экран

1. Логику — в хук/селектор (`@summer/state`), общую для платформ.
2. **web:** компонент в `apps/next/features/<name>.tsx` (DOM + Tailwind) + роут `apps/next/app/<name>/page.tsx` + вкладка в `nav.tsx`.
3. **mobile:** экран в `packages/app/src/features/<name>/` (RN) + роут `apps/expo/app/<name>.tsx` + вкладка в `_layout.tsx`.
4. Новые данные — поле в `AppState` + действие в `store.ts` (не забудь бамп `clock`, если поле синкается) + при необходимости селектор и ветка в `mergeStates`.

## 10. Команды

```bash
pnpm install            # установка
pnpm dev:web            # Next → localhost:3000
pnpm dev:mobile         # Expo
pnpm --filter desktop dev   # Tauri (нужен Rust)
pnpm build:web          # сборка web
pnpm typecheck          # типы по всем пакетам
```
