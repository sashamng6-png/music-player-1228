import { Link } from 'react-router-dom';
import { Play, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn, formatTotalDuration, pluralTracks } from '../../lib/utils';
import PlaylistMosaic from '../ui/PlaylistMosaic';

export default function PlaylistCard({ playlist, className }) {
  const { resolvePlaylistTracks, playPlaylist } = useApp();
  const tracks = resolvePlaylistTracks(playlist);
  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);

  return (
    <article
      className={cn(
        'group relative min-w-0 overflow-hidden rounded-2xl border border-transparent bg-surface/45 p-2.5 transition-all duration-300 hover:border-line/70 hover:bg-surface/80 hover:shadow-card',
        className,
      )}
    >
      <Link
        to={`/playlists/${playlist.id}`}
        className="block focus-visible:outline-none"
        aria-label={`Відкрити плейлист ${playlist.name}`}
      >
        <div className="relative">
          <PlaylistMosaic
            tracks={tracks}
            className="aspect-square w-full cover-shadow"
            rounded="rounded-xl"
          />
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-70" />
        </div>
        <div className="min-w-0 px-0.5 pb-0.5 pt-2.5">
          <div className="flex items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink transition group-hover:text-accent">
              {playlist.name}
            </h3>
            {playlist.curated ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent">
                <Sparkles className="h-2.5 w-2.5" />
                збірка
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {pluralTracks(tracks.length)}
            {totalDuration > 0 ? ` · ${formatTotalDuration(totalDuration)}` : ''}
          </p>
        </div>
      </Link>

      {tracks.length ? (
        <button
          type="button"
          onClick={() => playPlaylist(playlist)}
          className="absolute bottom-[62px] right-4 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-accent text-[rgb(var(--accent-contrast))] shadow-glow opacity-0 transition-all duration-300 hover:brightness-110 focus-visible:opacity-100 active:scale-90 group-hover:translate-y-0 group-hover:opacity-100"
          aria-label={`Відтворити плейлист ${playlist.name}`}
        >
          <Play className="ml-0.5 h-4 w-4 fill-current" />
        </button>
      ) : null}
    </article>
  );
}
