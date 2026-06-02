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

## 5. Деплой

Нажми Deploy. Дальше каждый `git push` в `main` будет деплоить автоматически (push-to-deploy).

> Примечание про автора коммита: на Hobby-плане приватный репо деплоится, если автор коммита = твой аккаунт (верифицированный в GitHub email). Если деплой заблокируется — поправь автора (`git commit --amend --reset-author`) на email, который подтверждён в твоём GitHub.
