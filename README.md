# Music Player 1228 🎧

Сучасний музичний плеєр на **React + Vite + TailwindCSS** із локальною бібліотекою та
спільною музичною платформою на **Supabase**: реєстрація, завантаження власних треків,
публічні профілі авторів і керування своєю музикою.

Демо-бібліотека, локальні файли, плейлисти, улюблене, історія та налаштування працюють
**без бекенду**. Спільнота вмикається після додавання ключів Supabase.

🌐 Жива версія: <https://sashamng6-png.github.io/music-player-1228/>

---

## Можливості

### Плеєр і локальна бібліотека
- Відтворення, пауза, перемотування, гучність, mute, shuffle, repeat.
- Улюблене, історія прослуховувань, плейлисти (створення / перейменування / видалення).
- Локальне завантаження аудіофайлів (IndexedDB) і відновлення після перезавантаження.
- Пошук, фільтр за жанрами, сортування, список і сітка.
- Теми, акценти, експорт / імпорт налаштувань, скидання даних.
- Адаптивний інтерфейс, клавіатурні скорочення, Media Session API.

### Спільнота (Supabase)
- Реєстрація та вхід за email/паролем (PKCE, без конфліктів із HashRouter).
- Завантаження треків: аудіо (MP3 / WAV / OGG, до 25 МБ), обкладинка (JPG / PNG / WebP, до 5 МБ),
  назва, виконавець, жанр, опис.
- Реальний прогрес завантаження у Supabase Storage.
- Сторінка **«Спільнота»**: усі опубліковані треки, пошук за назвою / виконавцем / автором,
  фільтр за жанрами, сортування за датою, назвою чи виконавцем, відтворення.
- Публічні профілі `/u/:userId`: аватар, нікнейм, дата реєстрації, кількість треків, список.
- **«Мої треки»**: редагування метаданих, заміна аудіо та обкладинки, видалення.
- Гості можуть слухати, шукати й переглядати профілі. Публікація потребує входу.
- RLS: публічне читання, вставка лише авторизованими, зміна / видалення — лише власником.

---

## Швидкий старт

```bash
npm install
npm run dev
```

Застосунок відкриється на `http://localhost:5173/`.

Без `.env` увесь локальний функціонал працює, а сторінки спільноти показують інструкцію
підключення Supabase.

---

## Налаштування Supabase

Проєкт: <https://supabase.com/dashboard/project/kjwwsretcsgwvgtjgqah>

### 1. Створіть таблиці, бакети й політики

1. Відкрийте **SQL Editor** у Supabase Dashboard.
2. Скопіюйте весь вміст файлу [`supabase/schema.sql`](supabase/schema.sql).
3. Натисніть **Run**.

Скрипт створює:
- `public.profiles` — профілі користувачів;
- `public.tracks` — опубліковані треки;
- індекси, тригери `updated_at`, тригер автоматичного створення профілю;
- бакети Storage `tracks` (аудіо) і `covers` (обкладинки) з лімітами типів/розміру;
- повний набір RLS-політик для таблиць і Storage.

Скрипт ідемпотентний — його можна запускати повторно.

### 2. Отримайте ключі

**Project Settings → API**:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon / publishable key** → `VITE_SUPABASE_ANON_KEY`

Створіть `.env` у корені проєкту (шаблон — [`.env.example`](.env.example)):

```env
VITE_SUPABASE_URL=https://kjwwsretcsgwvgtjgqah.supabase.co
VITE_SUPABASE_ANON_KEY=ваш_anon_key
```

> `anon` ключ публічний за призначенням — доступ до даних обмежують RLS-політики.
> **Ніколи** не додавайте `service_role` ключ у frontend або в репозиторій.

Після зміни `.env` перезапустіть `npm run dev`.

### 3. Налаштуйте Auth URL

**Authentication → URL Configuration**:

- **Site URL**: `https://<ваш-нікнейм>.github.io/music-player-1228/`
- **Redirect URLs**: додайте
  - `https://<ваш-нікнейм>.github.io/music-player-1228/`
  - `http://localhost:5173/`

**Підтвердження email вимкнено** для цього проєкту
(**Authentication → Sign In / Providers → Email → Confirm email** = off), тому після
реєстрації користувач одразу отримує активну сесію — без листів і переходів за посиланням.

Якщо колись увімкнете підтвердження назад: користувач отримає лист, а після переходу за
посиланням сесія відновиться автоматично (PKCE) — код це вже підтримує.

### 4. Перевірка

1. Зареєструйте користувача.
2. Відкрийте **«Завантажити трек»**, виберіть аудіо та обкладинку.
3. Дочекайтеся прогресу 100% — трек з’явиться у «Спільноті» та «Моїх треках».
4. Увійдіть іншим акаунтом: чужий трек можна слухати, але кнопок редагування/видалення немає.

### 5. Модератори (видалення чужих треків)

Модератори зберігаються в таблиці `public.admins`. У «Спільноті» вони бачать кнопку
видалення на кожній картці, а RLS дозволяє їм видаляти чужі треки разом із файлами у Storage.

Додати модератора (SQL Editor):

```sql
insert into public.admins (user_id)
select id from auth.users where lower(email) = lower('email@example.com')
on conflict (user_id) do nothing;
```

Прибрати права:

```sql
delete from public.admins
where user_id = (select id from auth.users where lower(email) = lower('email@example.com'));
```

У `supabase/schema.sql` уже є рядок, який додає `olyaninos07@gmail.com` як модератора —
за потреби замініть email там.

---

## Деплой на GitHub Pages

Репозиторій: <https://github.com/sashamng6-png/music-player-1228>

GitHub Pages уже увімкнено (**Source: GitHub Actions**), а деплой запускається
автоматично на кожен push у `main`.

1. Додайте secrets у GitHub: **Settings → Secrets and variables → Actions**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Після додавання secrets перезапустіть останній workflow (**Actions → Deploy Music Player 1228
   to GitHub Pages → Re-run all jobs**), щоб зібрати сайт уже з ключами.

> Поки secrets не додані, сайт працює в локальному режимі («Спільнота» показує
> інструкцію підключення Supabase).

Проєкт використовує `base: './'` і `HashRouter`, тому працює на GitHub Pages без
додаткових rewrite-правил.

Альтернатива без Actions:

```bash
npm run deploy
```

---

## Встановлення як програми (PWA)

Застосунок можна встановити на комп'ютер або телефон — він відкриватиметься в окремому
вікні, без адресного рядка, зі своєю іконкою.

- **Chrome / Edge (Windows, macOS, Linux):** іконка встановлення в адресному рядку або
  меню ⋮ → «Встановити Music Player 1228». Те саме доступно в **Налаштуваннях** застосунку —
  кнопка «Встановити застосунок».
- **Android:** Chrome → меню ⋮ → «Встановити застосунок».
- **iPhone / iPad:** Safari → «Поділитися» → «На Початковий екран».

Що це дає:

- власне вікно, іконка в «Пуску» та на панелі задач;
- офлайн-доступ до оболонки, демо-бібліотеки, плейлистів, улюбленого й власних файлів
  (вони й так зберігаються в IndexedDB);
- «Спільнота», вхід і завантаження треків, як і раніше, потребують інтернету.

Технічно: `public/manifest.webmanifest`, `public/sw.js` (service worker з кешем оболонки),
іконки в `public/icons/`, реєстрація — у `src/main.jsx` і лише в production-збірці.
PWA потребує HTTPS (GitHub Pages це забезпечує; локально працює `localhost`).

### Мобільний вигляд

- Нижня навігація (Головна · Спільнота · Бібліотека · Мої треки · Ще) на екранах до 1024px.
- Міні-плеєр стоїть над вкладками; поки трек не вибрано — не займає місця.
- Враховано «чубчик» і жести: `env(safe-area-inset-*)` у шапці, меню та плеєрі.
- Splash-екрани для iOS — `public/splash/` (підключені в `index.html`).
- `theme-color` змінюється разом із темою (темна/світла).
- Поля вводу на мобільних мають 16px, щоб Safari не зумив сторінку при фокусі.

### APK для Android (за бажанням)

Готовий `.apk` можна отримати двома шляхами:

1. **PWABuilder** — <https://www.pwabuilder.com>: вставити URL опублікованого сайту →
   **Android** → завантажити пакет. Нічого встановлювати на комп'ютер не потрібно
   (для Google Play — власний ключ підпису й акаунт розробника).
2. **Capacitor** — якщо є Android Studio:
   ```bash
   npm i -D @capacitor/cli @capacitor/core @capacitor/android
   npx cap init "Music Player 1228" app.musicplayer1228 --web-dir=dist
   npm run build && npx cap add android && npx cap sync
   npx cap open android
   ```
   Далі **Build → Generate Signed Bundle / APK**.

Для iPhone окремого файлу немає: Apple дозволяє встановлювати лише з App Store
(потрібен Mac і акаунт розробника), тому на iOS використовуйте PWA з Safari.

---

## Безпека

- **RLS увімкнено** для `profiles` і `tracks`.
- `tracks`: `SELECT` — усім для `published = true`; `INSERT` — лише `auth.uid() = user_id`;
  `UPDATE` / `DELETE` — лише власник; `DELETE` також для модератора з `public.admins`.
- `profiles`: публічне читання; зміна — лише власного профілю.
- `admins`: читають лише авторизовані; додавати/прибирати модераторів можна тільки через
  SQL Editor (немає INSERT/UPDATE/DELETE політик, тож користувач не може зробити себе адміном).
- Storage: публічне читання файлів; завантаження — лише у власну папку `<user_id>/...`;
  зміна / видалення — лише власних об’єктів.
- Обмеження типів і розмірів задані на рівні бакетів **і** перевіряються у клієнті.
- У фронтенді використовується лише `anon` ключ.

---

## Структура

```
src/
  components/
    auth/AuthModal.jsx
    community/CommunityTrackCard.jsx
    community/SetupNotice.jsx
    tracks/TrackForm.jsx
    tracks/TrackRow.jsx
    tracks/TrackCard.jsx
  context/
    AppContext.jsx        # плеєр, локальна бібліотека, плейлисти
    AuthContext.jsx       # сесія, профіль, вхід/реєстрація
    CommunityContext.jsx  # треки спільноти, Storage, CRUD
  lib/
    supabase.js           # клієнт, валідація, upload із прогресом
  hooks/
    useInstallPrompt.js   # рідна кнопка «Встановити застосунок» (PWA)
  components/layout/
    MobileTabBar.jsx      # нижня навігація для телефонів
  pages/
    CommunityPage.jsx
    UploadTrackPage.jsx
    MyTracksPage.jsx
    ProfilePage.jsx
public/
  manifest.webmanifest    # PWA-манифест
  sw.js                   # service worker (офлайн-оболонка)
  icons/                  # іконки 192/512/maskable/apple
  splash/                 # splash-екрани iOS
supabase/schema.sql
.github/workflows/deploy.yml
```

---

## Скрипти

| Команда | Дія |
| --- | --- |
| `npm run dev` | Локальний dev-сервер |
| `npm run build` | Production-збірка у `dist/` |
| `npm run preview` | Перегляд збірки |
| `npm run deploy` | Збірка + публікація через `gh-pages` |
| `npm run generate:media` | Генерація демо-аудіо та обкладинок |

---

## Часті проблеми

**«Supabase не налаштовано»** — перевірте `.env`, назви змінних (`VITE_` обов’язковий) і
перезапустіть dev-сервер.

**«Таблиці не створені» / «Bucket not found»** — виконайте `supabase/schema.sql` у SQL Editor.

**«Доступ заборонено правилами безпеки»** — переконайтеся, що користувач увійшов, а
`user_id` треку дорівнює `auth.uid()`; політики з `schema.sql` мають бути застосовані.

**Лист підтвердження веде не туди** — перевірте **Authentication → URL Configuration**
(Site URL і Redirect URLs).

**Файл не завантажується** — перевірте формат і розмір: аудіо до 25 МБ, обкладинка до 5 МБ.
