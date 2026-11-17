import { useRef, useState } from 'react';
import {
  Database,
  Download,
  Eye,
  HardDrive,
  Moon,
  Palette,
  PlayCircle,
  RotateCcw,
  Settings2,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ACCENTS } from '../../data/library';
import { cn, formatTotalDuration } from '../../lib/utils';
import Modal from '../ui/Modal';
import Slider from '../ui/Slider';
import ConfirmDialog from '../ui/ConfirmDialog';

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-line/60 bg-elevated/35 p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-ink">{title}</h3>
          {description ? <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function Toggle({ checked, onChange, label, description, id }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink">{label}</p>
        {description ? <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{description}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-accent bg-accent' : 'border-line bg-line/60',
        )}
      >
        <span
          className={cn(
            'absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-[21px]' : 'translate-x-[3px]',
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsModal() {
  const {
    settingsOpen,
    setSettingsOpen,
    settings,
    updateSettings,
    favorites,
    playlists,
    historyEntries,
    localTracks,
    exportData,
    importData,
    clearHistory,
    clearFavorites,
    clearLocalTracks,
    resetAllData,
    pushToast,
  } = useApp();
  const importRef = useRef(null);
  const [confirm, setConfirm] = useState(null);

  const totalPlaylistTracks = playlists.reduce((sum, playlist) => sum + playlist.trackIds.length, 0);
  const libraryDuration = localTracks.reduce((sum, track) => sum + (track.duration || 0), 0);

  const ask = (config) => setConfirm(config);
  const runConfirm = async () => {
    const action = confirm?.action;
    setConfirm(null);
    if (action) await action();
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const ok = await importData(file);
    if (ok) pushToast('Налаштування та добірки оновлено з файлу', 'success');
  };

  return (
    <>
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Налаштування"
        description="Зовнішній вигляд, відтворення та локальні дані MusicFlow."
        icon={<Settings2 className="h-5 w-5" />}
        size="lg"
        footer={
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-[11px] text-muted">Зміни зберігаються автоматично у цьому браузері.</p>
            <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => setSettingsOpen(false)}>
              Готово
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Section
            icon={Palette}
            title="Вигляд"
            description="Тема, акцентний колір і стиль нижньої панелі плеєра."
          >
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'dark', label: 'Темна', icon: Moon, preview: 'from-[#0a0b10] via-[#151824] to-[#24203a]' },
                { id: 'light', label: 'Світла', icon: Sun, preview: 'from-[#ffffff] via-[#eef1f7] to-[#dbe3f0]' },
              ].map((theme) => {
                const active = settings.theme === theme.id;
                const Icon = theme.icon;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => updateSettings({ theme: theme.id })}
                    className={cn(
                      'group rounded-xl border p-2 text-left transition-all duration-200',
                      active
                        ? 'border-accent/70 ring-2 ring-accent/20'
                        : 'border-line/70 hover:border-accent/30',
                    )}
                    aria-pressed={active}
                  >
                    <div
                      className={cn(
                        'relative h-16 w-full overflow-hidden rounded-lg bg-gradient-to-br',
                        theme.preview,
                      )}
                    >
                      <div className="absolute inset-x-2 bottom-2 space-y-1">
                        <div className={cn('h-1.5 w-3/4 rounded-full', theme.id === 'dark' ? 'bg-white/25' : 'bg-black/15')} />
                        <div className={cn('h-1.5 w-1/2 rounded-full', theme.id === 'dark' ? 'bg-white/15' : 'bg-black/10')} />
                      </div>
                      <div className="absolute right-2 top-2 h-4 w-4 rounded-full bg-accent/70" />
                    </div>
                    <span className="mt-2 flex items-center gap-1.5 text-[12px] font-bold text-ink">
                      <Icon className="h-3.5 w-3.5" />
                      {theme.label}
                      {active ? <span className="ml-auto text-[9px] font-bold uppercase text-accent">активна</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Акцент</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ACCENTS.map((accent) => {
                  const active = settings.accent === accent.id;
                  return (
                    <button
                      key={accent.id}
                      type="button"
                      onClick={() => updateSettings({ accent: accent.id })}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border p-2 text-left text-[12px] font-semibold transition',
                        active ? 'border-accent/70 bg-accent/[0.06] text-ink' : 'border-line/60 text-muted hover:text-ink',
                      )}
                      aria-pressed={active}
                    >
                      <span
                        className="h-5 w-5 shrink-0 rounded-full ring-2 ring-white/10"
                        style={{
                          background: `linear-gradient(135deg, ${accent.colors[0]}, ${accent.colors[1]})`,
                        }}
                      />
                      {accent.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Панель плеєра</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'comfortable', label: 'Звичайна', hint: 'Обкладинка, гучність, візуалізатор' },
                  { id: 'compact', label: 'Компактна', hint: 'Більше місця для бібліотеки' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateSettings({ playerSize: option.id })}
                    className={cn(
                      'rounded-xl border px-3 py-2.5 text-left transition',
                      settings.playerSize === option.id
                        ? 'border-accent/70 bg-accent/[0.06]'
                        : 'border-line/60 hover:border-accent/30',
                    )}
                    aria-pressed={settings.playerSize === option.id}
                  >
                    <span className="block text-[12px] font-bold text-ink">{option.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-muted">{option.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 divide-y divide-line/50">
              <Toggle
                checked={settings.showVisualizer}
                onChange={(value) => updateSettings({ showVisualizer: value })}
                label="Візуалізатор музики"
                description="Спектр у плеєрі та на екрані «Зараз грає»."
              />
              <Toggle
                checked={settings.reduceMotion}
                onChange={(value) => updateSettings({ reduceMotion: value })}
                label="Зменшити анімації"
                description="Вимикає обертання обкладинки та рух інтерфейсу."
              />
            </div>
          </Section>

          <Section
            icon={PlayCircle}
            title="Відтворення"
            description="Гучність за замовчуванням і автоматичний перехід між треками."
          >
            <div className="rounded-xl border border-line/60 bg-surface/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-[12px] font-semibold text-ink">
                  <Volume2 className="h-4 w-4 text-muted" />
                  Гучність за замовчуванням
                </span>
                <span className="rounded-md bg-elevated px-2 py-0.5 text-[11px] font-bold tabular-nums text-accent">
                  {Math.round(settings.defaultVolume * 100)}%
                </span>
              </div>
              <Slider
                value={settings.defaultVolume}
                max={1}
                step={0.01}
                onChange={(value) => updateSettings({ defaultVolume: value })}
                ariaLabel="Гучність за замовчуванням"
              />
              <p className="mt-1 text-[10px] text-muted">
                Застосовується одразу та після наступного відкриття застосунку.
              </p>
            </div>

            <div className="mt-3 divide-y divide-line/50">
              <Toggle
                checked={settings.autoplayNext}
                onChange={(value) => updateSettings({ autoplayNext: value })}
                label="Автоматичний перехід"
                description="Після завершення треку вмикати наступний у черзі."
              />
            </div>
          </Section>

          <Section
            icon={Database}
            title="Керування даними"
            description="Ваші плейлисти, улюблене та налаштування зберігаються лише локально."
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Плейлисти', value: playlists.length, hint: `${totalPlaylistTracks} треків` },
                { label: 'Улюблене', value: favorites.length, hint: 'композицій' },
                { label: 'Історія', value: historyEntries.length, hint: 'прослухано' },
                {
                  label: 'Локальні',
                  value: localTracks.length,
                  hint: formatTotalDuration(libraryDuration),
                },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-line/60 bg-surface/50 p-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted">{stat.label}</p>
                  <p className="mt-0.5 text-lg font-extrabold tabular-nums text-ink">{stat.value}</p>
                  <p className="truncate text-[9px] text-muted">{stat.hint}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={exportData} className="btn-secondary justify-start text-xs">
                <Download className="h-4 w-4" />
                Експортувати резервну копію
              </button>
              <button
                type="button"
                onClick={() => importRef.current?.click()}
                className="btn-secondary justify-start text-xs"
              >
                <Upload className="h-4 w-4" />
                Імпортувати дані
              </button>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImport}
              />
            </div>

            <div className="mt-2 space-y-1 rounded-xl border border-line/60 bg-surface/40 p-1.5">
              <button
                type="button"
                disabled={!historyEntries.length}
                onClick={() =>
                  ask({
                    title: 'Очистити історію?',
                    description: 'Список прослуханих треків буде видалено. Улюблене та плейлисти залишаться.',
                    confirmLabel: 'Очистити історію',
                    danger: false,
                    action: clearHistory,
                  })
                }
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold text-muted transition hover:bg-elevated hover:text-ink disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Очистити історію
              </button>
              <button
                type="button"
                disabled={!favorites.length}
                onClick={() =>
                  ask({
                    title: 'Очистити улюблене?',
                    description: 'Усі позначені сердечком треки буде прибрано зі списку улюбленого.',
                    confirmLabel: 'Очистити улюблене',
                    danger: false,
                    action: clearFavorites,
                  })
                }
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold text-muted transition hover:bg-elevated hover:text-ink disabled:opacity-40"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Очистити улюблене
              </button>
              <button
                type="button"
                disabled={!localTracks.length}
                onClick={() =>
                  ask({
                    title: 'Видалити локальні файли?',
                    description:
                      'Усі завантажені вами аудіофайли буде видалено з цього браузера. Демонстраційна бібліотека залишиться.',
                    confirmLabel: 'Видалити файли',
                    action: clearLocalTracks,
                  })
                }
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold text-muted transition hover:bg-elevated hover:text-ink disabled:opacity-40"
              >
                <HardDrive className="h-3.5 w-3.5" />
                Видалити локальні файли ({localTracks.length})
              </button>
              <button
                type="button"
                onClick={() =>
                  ask({
                    title: 'Скинути всі дані?',
                    description:
                      'Плейлисти, улюблене, історія, локальні файли та налаштування повернуться до початкового стану. Цю дію не можна скасувати.',
                    confirmLabel: 'Скинути все',
                    action: resetAllData,
                  })
                }
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Скинути всі збережені дані
              </button>
            </div>

            <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-muted">
              <Eye className="mt-0.5 h-3 w-3 shrink-0" />
              Резервна копія містить плейлисти, улюблене, історію та налаштування. Аудіофайли, додані вами,
              зберігаються окремо в IndexedDB і не входять у JSON-файл.
            </p>
          </Section>

          <div className="px-1 text-center text-[10px] leading-relaxed text-muted">
            MusicFlow · React + TailwindCSS + HTML5 Audio API · без бекенду
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger !== false}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
