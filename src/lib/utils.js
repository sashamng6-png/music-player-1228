/** Shared, dependency-free helpers. */

export const cn = (...values) => values.filter(Boolean).join(' ');

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Build a public asset URL that also works on GitHub Pages project sites. */
export const assetUrl = (path) => {
  if (!path) return '';
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
};

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatTotalDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0 хв';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} хв`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} год ${m} хв` : `${h} год`;
}

export function pluralTracks(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} трек`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} треки`;
  return `${count} треків`;
}

export function formatDate(iso, { withTime = false } = {}) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  if (withTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return new Intl.DateTimeFormat('uk-UA', options).format(date);
}

export function formatRelativeDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfDate) / 86400000);
  if (dayDiff === 0) return 'Сьогодні';
  if (dayDiff === 1) return 'Вчора';
  if (dayDiff > 1 && dayDiff < 7) return `${dayDiff} дн. тому`;
  return formatDate(iso);
}

export function formatClock(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(date);
}

export function uid(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function shuffleArray(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const isEditableTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    target.isContentEditable ||
    target.getAttribute('role') === 'textbox'
  );
};

export const isAudioFile = (file) => {
  if (!file) return false;
  if (file.type && file.type.startsWith('audio/')) return true;
  return /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm)$/i.test(file.name || '');
};

/** "01. Artist - Title.mp3" -> { artist, title } */
export function parseTrackFilename(filename = '') {
  let base = filename.replace(/\.[a-z0-9]{2,5}$/i, '').trim();
  base = base.replace(/^\d{1,3}[\s._-]+/, '');
  base = base.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = base.split(/\s+-\s+/);
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
  }
  return { artist: 'Невідомий виконавець', title: base || 'Без назви' };
}

export function readAudioDuration(file) {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    const url = URL.createObjectURL(file);
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      audio.removeAttribute('src');
      audio.load?.();
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(value) && value > 0 ? value : 0);
    };
    const timer = setTimeout(() => finish(0), 15000);
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      clearTimeout(timer);
      finish(audio.duration);
    };
    audio.onerror = () => {
      clearTimeout(timer);
      finish(0);
    };
    audio.src = url;
  });
}

function hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const LOCAL_PALETTES = [
  ['#0f172a', '#2dd4bf', '#8b5cf6'],
  ['#1a1025', '#f472b6', '#8b5cf6'],
  ['#0b1c1a', '#22d3ee', '#14b8a6'],
  ['#241105', '#fbbf24', '#f97316'],
  ['#0b1020', '#818cf8', '#22d3ee'],
  ['#1f0d18', '#fb7185', '#a78bfa'],
];

/** Deterministic inline cover artwork for user files. */
export function createLocalCover(title = 'Трек', artist = 'You') {
  const hash = hashString(`${title}-${artist}`);
  const [bg, c1, c2] = LOCAL_PALETTES[hash % LOCAL_PALETTES.length];
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] || '')
    .join('')
    .toUpperCase();
  const angle = hash % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
    <defs>
      <linearGradient id="g" gradientTransform="rotate(${angle} 0.5 0.5)">
        <stop offset="0" stop-color="${bg}"/>
        <stop offset="0.55" stop-color="${c1}" stop-opacity="0.8"/>
        <stop offset="1" stop-color="${bg}"/>
      </linearGradient>
      <radialGradient id="o" cx="35%" cy="30%">
        <stop offset="0" stop-color="${c2}" stop-opacity="0.95"/>
        <stop offset="1" stop-color="${c1}" stop-opacity="0.1"/>
      </radialGradient>
    </defs>
    <rect width="800" height="800" fill="url(#g)"/>
    <circle cx="590" cy="210" r="250" fill="url(#o)" opacity="0.7"/>
    <g fill="none" stroke="#ffffff" stroke-opacity="0.22">
      ${Array.from({ length: 6 })
        .map((_, i) => `<circle cx="590" cy="210" r="${70 + i * 34}"/>`)
        .join('')}
    </g>
    <text x="60" y="690" font-family="Arial, sans-serif" font-size="120" font-weight="700" fill="#ffffff" fill-opacity="0.92">${initials || '♪'}</text>
    <text x="64" y="740" font-family="Arial, sans-serif" font-size="26" fill="#ffffff" fill-opacity="0.65">MusicFlow · local</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Доброї ночі';
  if (hour < 12) return 'Доброго ранку';
  if (hour < 17) return 'Доброго дня';
  return 'Доброго вечора';
}
