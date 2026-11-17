import { ListMusic } from 'lucide-react';
import { cn } from '../../lib/utils';
import CoverArt from './CoverArt';

/** 2×2 playlist mosaic built from the first four artworks. */
export default function PlaylistMosaic({
  tracks = [],
  className,
  rounded = 'rounded-2xl',
  iconSize = 'h-1/4 w-1/4',
}) {
  const covers = tracks.slice(0, 4).map((track) => track.cover).filter(Boolean);

  if (!covers.length) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-accent/30 via-surface to-accent2/30',
          rounded,
          className,
        )}
      >
        <ListMusic className={cn('text-ink/45', iconSize)} aria-hidden />
      </div>
    );
  }

  return (
    <div className={cn('relative grid grid-cols-2 gap-[2px] overflow-hidden bg-elevated', rounded, className)}>
      {Array.from({ length: 4 }).map((_, index) => {
        const cover = covers[index];
        return cover ? (
          <CoverArt
            key={`${cover}-${index}`}
            src={cover}
            alt=""
            rounded="rounded-none"
            className="h-full w-full"
          />
        ) : (
          <div
            key={`fallback-${index}`}
            className="bg-gradient-to-br from-accent/20 via-elevated to-accent2/20"
          />
        );
      })}
    </div>
  );
}
