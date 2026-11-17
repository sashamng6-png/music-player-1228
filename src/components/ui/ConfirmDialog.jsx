import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  title = 'Підтвердити дію',
  description,
  confirmLabel = 'Підтвердити',
  cancelLabel = 'Скасувати',
  danger = true,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description || 'Цю дію не можна скасувати.'}
      icon={<AlertTriangle className={danger ? 'h-5 w-5 text-rose-400' : 'h-5 w-5'} />}
      size="sm"
      showClose={false}
      layer={90}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              danger
                ? 'inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-400 active:scale-[0.97]'
                : 'btn-primary'
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      }
    />
  );
}
