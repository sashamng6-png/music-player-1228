import { useEffect, useState } from 'react';
import { Disc3, Music2 } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Artwork with a graceful fallback if an image is missing or blocked.
 */
export default function CoverArt({
  src,
  alt = '',
  className,
  rounded = 'rounded-xl',
  imgClassName,
  spinning = false,
  sizeHint = 'lazy',
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden bg-elevated',
        rounded,
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading={sizeHint}
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
          className={cn(
            'h-full w-full object-cover',
            spinning && 'animate-spin-slow',
            imgClassName,
          )}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/25 via-elevated to-accent2/25">
          {alt ? (
            <Disc3 className="h-1/3 w-1/3 text-ink/40" aria-hidden />
          ) : (
            <Music2 className="h-1/3 w-1/3 text-ink/40" aria-hidden />
          )}
        </div>
      )}
    </div>
  );
}
