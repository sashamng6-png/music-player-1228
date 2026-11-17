import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/* Track open modals so nested dialogs only handle their own Escape/Tab. */
const modalStack = [];
let modalId = 0;

/**
 * Accessible modal: Escape to close, click outside, body scroll lock,
 * simple focus trap and focus restoration.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  showClose = true,
  layer = 80,
  className,
  bodyClassName,
}) {
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const instanceIdRef = useRef(null);
  if (instanceIdRef.current === null) {
    modalId += 1;
    instanceIdRef.current = modalId;
  }

  useEffect(() => {
    if (!open) return undefined;
    const instanceId = instanceIdRef.current;
    modalStack.push(instanceId);
    restoreFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      const focusable = panelRef.current?.querySelector(
        'input:not([type="hidden"]), textarea, select, button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable instanceof HTMLElement) focusable.focus();
      else panelRef.current?.focus();
    }, 40);

    const handleKeyDown = (event) => {
      if (modalStack[modalStack.length - 1] !== instanceId) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const nodes = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes || nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown, true);
      const index = modalStack.lastIndexOf(instanceId);
      if (index !== -1) modalStack.splice(index, 1);
      document.body.style.overflow = previousOverflow;
      if (restoreFocusRef.current instanceof HTMLElement) {
        restoreFocusRef.current.focus?.();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-6"
      style={{ zIndex: layer }}
      role="presentation"
    >
      <div
        className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-md"
        onClick={() => onClose?.()}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-line/70 bg-surface shadow-2xl animate-slide-up sm:rounded-[28px]',
          SIZES[size] || SIZES.md,
          className,
        )}
      >
        {(title || showClose) && (
          <div className="flex items-start gap-3 border-b border-line/60 px-5 py-4 sm:px-6">
            {icon ? (
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-accent">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              {title ? (
                <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
              ) : null}
            </div>
            {showClose ? (
              <button
                type="button"
                onClick={() => onClose?.()}
                className="icon-btn -mr-1 -mt-1 h-9 w-9"
                aria-label="Закрити вікно"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        )}
        {children !== undefined && children !== null ? (
          <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6', bodyClassName)}>
            {children}
          </div>
        ) : null}
        {footer ? (
          <div className="border-t border-line/60 bg-elevated/50 px-5 py-4 sm:px-6">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
