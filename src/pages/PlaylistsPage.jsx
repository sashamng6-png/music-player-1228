import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderHeart, ListMusic, Plus, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import EmptyState from '../components/ui/EmptyState';
import PlaylistCard from '../components/playlists/PlaylistCard';
import CreatePlaylistModal from '../components/playlists/CreatePlaylistModal';

export default function PlaylistsPage() {
  const { playlists, curatedPlaylists } = useApp();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent">
            Колекції
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Плейлисти
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Створюйте власні добірки, змінюйте назви та додавайте треки. Усе зберігається локально.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Новий плейлист
        </button>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <FolderHeart className="h-4 w-4 text-accent" />
          <h2 className="section-title">Мої добірки</h2>
          <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-bold text-muted">
            {playlists.length}
          </span>
        </div>

        {playlists.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line/70 bg-surface/25 p-4 text-center transition-all hover:border-accent/50 hover:bg-surface/50"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent transition group-hover:bg-accent group-hover:text-[rgb(var(--accent-contrast))]">
                <Plus className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">Створити плейлист</span>
                <span className="mt-0.5 block text-[11px] text-muted">Нова добірка під настрій</span>
              </span>
            </button>
          </div>
        ) : (
          <EmptyState
            title="Ще жодного плейлиста"
            description="Створіть першу добірку та додавайте до неї треки з бібліотеки — вони збережуться у браузері."
            compact
            action={
              <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Створити перший плейлист
              </button>
            }
          />
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent2" />
          <h2 className="section-title">Збірки Music Player 1228</h2>
          <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent">
            редакція
          </span>
        </div>
        <p className="mb-3 max-w-xl text-xs leading-relaxed text-muted">
          Готові добірки з демонстраційної бібліотеки — слухайте одразу або додавайте треки у власні плейлисти.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {curatedPlaylists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </section>

      <div className="flex items-start gap-2 rounded-2xl border border-line/50 bg-surface/35 px-4 py-3 text-[10px] leading-relaxed text-muted">
        <ListMusic className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
        Плейлисти, улюблені треки та історія слухання зберігаються у localStorage. Локальні аудіофайли — в
        IndexedDB цього браузера.
      </div>

      <CreatePlaylistModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(playlist) => navigate(`/playlists/${playlist.id}`)}
      />
    </div>
  );
}
