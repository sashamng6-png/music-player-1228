import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Music2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useCommunity } from '../../context/CommunityContext';
import {
  AUDIO_MAX_BYTES,
  COVER_MAX_BYTES,
  validateAudioFile,
  validateCoverFile,
} from '../../lib/supabase';
import { cn, formatTime, parseTrackFilename, readAudioDuration } from '../../lib/utils';
import CoverArt from '../ui/CoverArt';

const mb = (bytes) => `${Math.round(bytes / (1024 * 1024))} МБ`;

export default function TrackForm({
  mode = 'create',
  initial = null,
  onSubmit,
  onCancel,
  submitLabel,
}) {
  const { genreOptions } = useCommunity();

  const [form, setForm] = useState({
    title: initial?.title || '',
    artist: initial?.artist || '',
    genre: initial?.genre || 'Інше',
    description: initial?.description || '',
  });
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [duration, setDuration] = useState(initial?.duration || 0);
  const [fieldError, setFieldError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(null);
  const audioInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const audioPreviewUrl = useMemo(
    () => (audioFile ? URL.createObjectURL(audioFile) : null),
    [audioFile],
  );
  const coverPreviewUrl = useMemo(() => {
    if (coverFile) return URL.createObjectURL(coverFile);
    if (removeCover) return null;
    return initial?.cover || null;
  }, [coverFile, removeCover, initial?.cover]);

  useEffect(
    () => () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    },
    [audioPreviewUrl],
  );
  useEffect(
    () => () => {
      if (coverPreviewUrl && coverFile) URL.revokeObjectURL(coverPreviewUrl);
    },
    [coverPreviewUrl, coverFile],
  );

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || '',
        artist: initial.artist || '',
        genre: initial.genre || 'Інше',
        description: initial.description || '',
      });
      setDuration(initial.duration || 0);
      setAudioFile(null);
      setCoverFile(null);
      setRemoveCover(false);
      setFieldError(null);
      setProgress(0);
      setSuccess(null);
    }
  }, [initial]);

  const genreList = useMemo(() => {
    const list = [...genreOptions];
    if (form.genre && !list.includes(form.genre)) list.unshift(form.genre);
    return list;
  }, [genreOptions, form.genre]);

  const update = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleAudioChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const error = validateAudioFile(file);
    if (error) {
      setFieldError(error);
      return;
    }
    setFieldError(null);
    setSuccess(null);
    setAudioFile(file);
    const detected = await readAudioDuration(file);
    setDuration(detected || 0);
    const parsed = parseTrackFilename(file.name);
    setForm((prev) => ({
      ...prev,
      title: prev.title.trim() || (parsed.title === 'Без назви' ? '' : parsed.title),
      artist:
        prev.artist.trim() ||
        (parsed.artist === 'Невідомий виконавець' ? '' : parsed.artist),
    }));
  };

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const error = validateCoverFile(file);
    if (error) {
      setFieldError(error);
      return;
    }
    setFieldError(null);
    setSuccess(null);
    setCoverFile(file);
    setRemoveCover(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setFieldError(null);
    setSuccess(null);

    if (!form.title.trim()) {
      setFieldError('Вкажіть назву треку.');
      return;
    }
    if (!form.artist.trim()) {
      setFieldError('Вкажіть ім’я виконавця.');
      return;
    }
    if (mode === 'create' && !audioFile) {
      setFieldError('Оберіть аудіофайл (MP3, WAV або OGG).');
      return;
    }
    if (audioFile) {
      const audioError = validateAudioFile(audioFile);
      if (audioError) {
        setFieldError(audioError);
        return;
      }
    }
    if (coverFile) {
      const coverError = validateCoverFile(coverFile);
      if (coverError) {
        setFieldError(coverError);
        return;
      }
    }

    setBusy(true);
    setProgress(0);
    try {
      await onSubmit(
        {
          title: form.title.trim(),
          artist: form.artist.trim(),
          genre: form.genre,
          description: form.description.trim(),
          audioFile,
          coverFile,
          removeCover,
          duration: duration || null,
        },
        (value) => setProgress(value),
      );
      setSuccess(
        mode === 'create'
          ? 'Трек опубліковано в спільноті Music Player 1228.'
          : 'Зміни збережено.',
      );
      setProgress(1);
    } catch (error) {
      setFieldError(error?.message || 'Не вдалося зберегти трек.');
      setProgress(0);
    } finally {
      setBusy(false);
    }
  };

  const percent = Math.round(progress * 100);
  const uploading = busy && progress > 0 && progress < 1;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* audio picker */}
      <div>
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,audio/flac,.mp3,.wav,.ogg,.oga,.m4a,.flac"
          className="hidden"
          onChange={handleAudioChange}
          disabled={busy}
        />
        <div
          className={cn(
            'flex items-center gap-3 rounded-2xl border border-dashed px-4 py-3.5 transition',
            audioFile
              ? 'border-accent/50 bg-accent/[0.07]'
              : 'border-line/70 bg-elevated/40 hover:border-accent/40 hover:bg-elevated/70',
          )}
        >
          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            disabled={busy}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                audioFile ? 'bg-accent text-[rgb(var(--accent-contrast))]' : 'bg-accent/10 text-accent',
              )}
            >
              {audioFile ? <Music2 className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink">
                {audioFile
                  ? audioFile.name
                  : mode === 'edit'
                    ? 'Замінити аудіофайл (необов’язково)'
                    : 'Оберіть аудіофайл'}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted">
                {audioFile
                  ? `${mb(audioFile.size)}${duration ? ` · ${formatTime(duration)}` : ''}`
                  : `MP3, WAV, OGG · до ${mb(AUDIO_MAX_BYTES)}`}
              </span>
            </span>
          </button>
          {audioFile ? (
            <button
              type="button"
              onClick={() => {
                setAudioFile(null);
                setDuration(initial?.duration || 0);
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-rose-400"
              aria-label="Прибрати вибраний файл"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* cover + main fields */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="mx-auto w-32 shrink-0 sm:mx-0">
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleCoverChange}
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={busy}
            className="group relative block w-full overflow-hidden rounded-2xl border border-line/70 bg-elevated/40"
            aria-label="Обрати обкладинку"
          >
            <CoverArt
              src={coverPreviewUrl}
              alt={form.title || 'Обкладинка'}
              rounded="rounded-2xl"
              className="aspect-square w-full"
            />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
              <ImagePlus className="h-5 w-5" />
              {coverPreviewUrl ? 'Замінити' : 'Додати обкладинку'}
            </span>
          </button>
          <p className="mt-1.5 text-center text-[10px] leading-snug text-muted">
            JPG, PNG, WebP · до {mb(COVER_MAX_BYTES)}
          </p>
          {coverPreviewUrl ? (
            <button
              type="button"
              onClick={() => {
                setCoverFile(null);
                setRemoveCover(true);
              }}
              className="mx-auto mt-1 flex items-center gap-1 text-[10px] font-semibold text-muted transition hover:text-rose-400"
            >
              <Trash2 className="h-3 w-3" />
              Прибрати
            </button>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
              Назва треку *
            </span>
            <input
              type="text"
              value={form.title}
              onChange={update('title')}
              placeholder="Наприклад, Нічний драйв"
              maxLength={120}
              className="field h-11"
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
              Виконавець *
            </span>
            <input
              type="text"
              value={form.artist}
              onChange={update('artist')}
              placeholder="Ваше ім’я або псевдонім"
              maxLength={120}
              className="field h-11"
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
              Жанр
            </span>
            <select
              value={form.genre}
              onChange={update('genre')}
              className="field h-11"
              disabled={busy}
            >
              {genreList.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
          Опис композиції
        </span>
        <textarea
          value={form.description}
          onChange={update('description')}
          rows={3}
          maxLength={1000}
          placeholder="Розкажіть про трек: настрій, історія створення, натхнення..."
          className="field resize-y"
          disabled={busy}
        />
        <span className="mt-1 block text-right text-[10px] text-muted">
          {form.description.length}/1000
        </span>
      </label>

      {fieldError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-rose-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {fieldError}
        </div>
      ) : null}

      {success ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </div>
      ) : null}

      {busy ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted">
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
              {uploading
                ? 'Завантажуємо файли у Supabase Storage...'
                : 'Зберігаємо у базі даних...'}
            </span>
            <span className="tabular-nums text-ink">{percent}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-elevated"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label="Прогрес завантаження треку"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-[width] duration-200"
              style={{ width: `${Math.max(percent, 2)}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={busy}
          >
            Скасувати
          </button>
        ) : null}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          {busy
            ? 'Зберігаємо...'
            : submitLabel || (mode === 'edit' ? 'Зберегти зміни' : 'Опублікувати трек')}
        </button>
      </div>
    </form>
  );
}
