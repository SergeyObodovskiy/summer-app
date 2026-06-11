# Деплой web на Vercel (монорепо)

Web-приложение — это `apps/next` (Next.js) внутри pnpm/Turborepo монорепо. Vercel это поддерживает: нужно указать ему корневую папку приложения.

## 1. Лок-файл (обязательно)

Vercel ставит зависимости по `pnpm-lock.yaml`. Его генерирует локальная установка — сгенерируй и закоммить:

```bash
cd "/Users/johndoe/Documents/Claude/Projects/My organiser/summer-app"
pnpm install            # создаёт pnpm-lock.yaml
git add pnpm-lock.yaml && git commit -m "add pnpm lockfile"
```

## 2. Залить в GitHub

```bash
# создай пустой приватный репозиторий, напр. summer-app
git remote add origin https://github.com/SergeyObodovskiy/summer-app.git
git push -u origin main
```

## 3. Создать проект на Vercel

Vercel → Add New → Project → импортируй репозиторий `summer-app`, затем:

- **Root Directory:** `apps/next`  ← ключевая настройка для монорепо
- Framework Preset: **Next.js** (определится сам)
- Install Command / Build Command — оставить по умолчанию (Vercel сам поднимет pnpm workspace из корня)

## 4. Переменные окружения

В Project Settings → Environment Variables добавь (значения из `apps/next/.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SYNC_CODE
```

**Включи их для всех окружений (Production + Preview), а не только Production.** Это `NEXT_PUBLIC_*` — они инлайнятся в бандл на этапе сборки. Если их нет в Preview-сборке, на preview-URL синхронизация не подключится и приложение откроется пустым (см. §6 — почему это критично именно на Vercel).

## 5. Деплой

Нажми Deploy. Дальше каждый `git push` в `main` будет деплоить автоматически (push-to-deploy).

> Примечание про автора коммита: на Hobby-плане приватный репо деплоится, если автор коммита = твой аккаунт (верифицированный в GitHub email). Если деплой заблокируется — поправь автора (`git commit --amend --reset-author`) на email, который подтверждён в твоём GitHub.

## 6. Данные и домены (важно)

Локальные данные приложения лежат в **`localStorage` (ключ `summer-app:v1`)**, а `localStorage` **привязан к origin** (схема+домен). Это рождает ловушку на Vercel:

- **Стабильный продакшн-алиас** (`https://summer-app-next.vercel.app`) — origin не меняется между деплоями, `localStorage` сохраняется. **Открывай приложение только по нему.**
- **Per-deploy preview-URL** (`https://<hash>-summer-app-next.vercel.app`) — у каждого деплоя **новый поддомен = новый origin = пустой `localStorage`**. Откроешь такой URL — увидишь пустое приложение. Данные не потеряны, просто это «другой сайт» с точки зрения браузера.

**Облако — источник правды между origin'ами.** Если env-переменные синка заданы для всех окружений (§4) и используется один `NEXT_PUBLIC_SYNC_CODE`, то на любом новом origin приложение при загрузке стянет состояние из Supabase (`app_state`) и восстановит данные автоматически (pull-first merge, см. `DOCS.md` §7.3). Без настроенного синка единственная копия — `localStorage` конкретного origin.

**Восстановление, если данные «пропали»:**
1. Открой стабильный продакшн-URL — скорее всего данные там.
2. Иначе включи синхронизацию (Настройки → Синхронизация: URL, anon key, тот же код, что в строке `app_state`) — облако зальёт всё назад.
3. Либо вручную: скопируй JSON из `app_state.data` в Supabase → Настройки → Резервная копия → Импорт.

> ⚠️ Не делай «Clear site data» / не чисти `localStorage`, пока не убедился, что данные есть в облаке или на другом origin — это может стереть последнюю копию.
