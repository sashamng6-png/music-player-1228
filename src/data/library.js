/**
 * Налаштування застосунку за замовчуванням.
 *
 * Демо-бібліотеку видалено: «Моя музика» містить лише файли, які користувач
 * додав сам, а «Спільнота» — треки, завантажені на платформу.
 */

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  accent: 'teal',
  defaultVolume: 0.8,
  autoplayNext: true,
  showVisualizer: true,
  playerSize: 'comfortable',
  reduceMotion: false,
};

export const ACCENTS = [
  { id: 'teal', label: 'Бірюза', colors: ['#2dd4bf', '#8b5cf6'] },
  { id: 'violet', label: 'Фіолет', colors: ['#a78bfa', '#22d3ee'] },
  { id: 'pink', label: 'Рожевий', colors: ['#f472b6', '#8b5cf6'] },
  { id: 'amber', label: 'Бурштин', colors: ['#fbbf24', '#f472b6'] },
];
