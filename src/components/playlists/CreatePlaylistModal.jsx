import { useEffect, useState } from 'react';
import { ListMusic } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';

export default function CreatePlaylistModal({ open, onClose, onCreated, initialName = '' }) {
  const { createPlaylist } = useApp();
  const [name, setName] = useState(initialName || '');

  useEffect(() => {
    if (open) setName(initialName || '');
  }, [open, initialName]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const created = createPlaylist(name);
    if (created) {
      setName('');
      onClose?.();
      onCreated?.(created);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новий плейлист"
      description="Дайте добірці назву — треки додасте наступним кроком."
      icon={<ListMusic className="h-5 w-5" />}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Скасувати
          </button>
          <button
            type="submit"
            form="create-playlist-form"
            className="btn-primary"
            disabled={!name.trim()}
          >
            Створити плейлист
          </button>
        </div>
      }
    >
      <form id="create-playlist-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="playlist-name"
            className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted"
          >
            Назва
          </label>
          <input
            id="playlist-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field"
            placeholder="Мій новий плейлист"
            maxLength={80}
            autoComplete="off"
          />
          <p className="mt-2 text-[11px] text-muted">
            {name.trim().length}/80 символів. Плейлист збережеться у цьому браузері.
          </p>
        </div>
        <div className="rounded-xl bg-elevated/60 p-3 text-xs leading-relaxed text-muted">
          Порада: перетягніть власні аудіофайли у «Мою музику», щоб додати їх до плейлиста.
        </div>
      </form>
    </Modal>
  );
}
