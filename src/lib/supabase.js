import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL?.trim() || '').replace(/\/+$/, '');
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

const looksPlaceholder = (value) =>
  !value || /PASTE|YOUR_|example|changeme/i.test(value);

export const supabaseConfig = {
  url: rawUrl,
  anonKey: rawKey,
};

/** The app keeps working offline/local-only when these are not configured. */
export const isSupabaseConfigured =
  !looksPlaceholder(rawUrl) && !looksPlaceholder(rawKey);

export const supabase = isSupabaseConfigured
  ? createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // PKCE keeps the auth code in the query string, which is important
        // because the app uses hash routing for GitHub Pages.
        flowType: 'pkce',
      },
    })
  : null;

/** Where Supabase should send users after e-mail confirmation. */
export function authRedirectUrl() {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}${window.location.pathname}`;
}

export const COMMUNITY_BUCKETS = {
  audio: 'tracks',
  covers: 'covers',
};

export const AUDIO_MAX_BYTES = 25 * 1024 * 1024;
export const COVER_MAX_BYTES = 5 * 1024 * 1024;
export const AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/flac'];
export const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function fileExtension(name = '') {
  return (name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function inferMime(file) {
  if (file?.type) return file.type;
  const ext = fileExtension(file?.name);
  const map = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    oga: 'audio/ogg',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  return map[ext] || 'application/octet-stream';
}

export function validateAudioFile(file) {
  if (!file) return 'Оберіть аудіофайл.';
  const ext = fileExtension(file.name);
  const typeOk = AUDIO_TYPES.includes(file.type) || ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'flac'].includes(ext);
  if (!typeOk) return 'Підтримуються MP3, WAV, OGG (також M4A та FLAC).';
  if (file.size > AUDIO_MAX_BYTES) return 'Аудіофайл завеликий. Максимум — 25 МБ.';
  return null;
}

export function validateCoverFile(file) {
  if (!file) return null;
  const ext = fileExtension(file.name);
  const typeOk = COVER_TYPES.includes(file.type) || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
  if (!typeOk) return 'Обкладинка має бути JPG, PNG або WebP.';
  if (file.size > COVER_MAX_BYTES) return 'Обкладинка завелика. Максимум — 5 МБ.';
  return null;
}

export function friendlyAuthError(error) {
  const message = error?.message || '';
  const lower = message.toLowerCase();
  if (lower.includes('invalid login')) return 'Невірний email або пароль.';
  if (lower.includes('email not confirmed')) return 'Підтвердіть email за посиланням у листі.';
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'Користувач з таким email вже зареєстрований.';
  }
  if (lower.includes('password should be at least')) return 'Пароль має містити щонайменше 6 символів.';
  if (lower.includes('invalid email')) return 'Введіть коректний email.';
  if (lower.includes('rate limit')) return 'Забагато спроб. Зачекайте хвилину й спробуйте знову.';
  if (lower.includes('signup disabled')) return 'Реєстрація вимкнена в налаштуваннях Supabase.';
  if (lower.includes('invalid api key') || lower.includes('invalid jwt')) {
    return 'Невірний anon-ключ Supabase. Перевірте VITE_SUPABASE_ANON_KEY у файлі .env.';
  }
  return message || 'Не вдалося виконати дію. Спробуйте ще раз.';
}

export function friendlyDataError(error, fallback = 'Не вдалося виконати запит до Supabase.') {
  const message = error?.message || '';
  const code = error?.code || '';
  if (message.includes('row-level security')) {
    return 'Доступ заборонено правилами безпеки Supabase.';
  }
  if (message.includes('Bucket not found')) {
    return 'Сховище Supabase не створене. Запустіть SQL зі supabase/schema.sql.';
  }
  if (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('Could not find the table') ||
    message.includes('schema cache') ||
    (message.includes('relation') && message.includes('does not exist'))
  ) {
    return 'Таблиці Supabase не створені. Запустіть SQL зі supabase/schema.sql.';
  }
  if (message.includes('Failed to fetch')) {
    return 'Немає зв’язку з Supabase. Перевірте інтернет і URL проєкту.';
  }
  if (message.includes('Invalid API key') || message.includes('Invalid JWT')) {
    return 'Невірний anon-ключ Supabase. Перевірте VITE_SUPABASE_ANON_KEY у файлі .env.';
  }
  return message || fallback;
}

function encodedPath(path) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

/**
 * Upload a file straight to Supabase Storage with real byte progress.
 * supabase-js does not expose upload progress, so this uses the same
 * Storage REST endpoint with the current access token.
 */
export async function uploadFileWithProgress(bucket, path, file, onProgress) {
  if (!supabase) throw new Error('Supabase не налаштовано.');

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.access_token) throw new Error('Потрібно увійти в акаунт.');

  const endpoint = `${supabaseConfig.url}/storage/v1/object/${bucket}/${encodedPath(path)}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);
    xhr.timeout = 180000;
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.setRequestHeader('apikey', supabaseConfig.anonKey);
    xhr.setRequestHeader('Content-Type', inferMime(file));
    xhr.setRequestHeader('cache-control', '3600');
    xhr.setRequestHeader('x-upsert', 'false');

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || typeof onProgress !== 'function') return;
      onProgress(event.loaded / event.total);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        resolve({ path, publicUrl: data.publicUrl });
        return;
      }
      let message = `Не вдалося завантажити файл (${xhr.status}).`;
      try {
        const payload = JSON.parse(xhr.responseText);
        message = payload.message || payload.error || message;
      } catch {
        /* keep generic message */
      }
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error('Помилка мережі під час завантаження файлу.'));
    xhr.ontimeout = () => reject(new Error('Завантаження триває занадто довго. Спробуйте менший файл.'));
    xhr.send(file);
  });
}

export function storagePathFromUrl(url, bucket) {
  if (!url || !bucket) return null;
  for (const mode of ['public', 'sign']) {
    const marker = `/storage/v1/object/${mode}/${bucket}/`;
    const index = url.indexOf(marker);
    if (index !== -1) {
      return decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
    }
  }
  return null;
}

export async function removeStorageFiles(bucket, urls) {
  if (!supabase) return;
  const paths = (Array.isArray(urls) ? urls : [urls])
    .map((url) => storagePathFromUrl(url, bucket))
    .filter(Boolean);
  if (!paths.length) return;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw error;
}
