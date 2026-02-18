import { useEffect, useRef } from 'react';
import { useConfirmStore } from '../store/confirmStore';
import Button from './Button';

const variantStyles = {
  danger: {
    icon: '🗑',
    iconBg: 'bg-red-100',
    confirmBtn: 'bg-red-600 hover:bg-red-700 text-white border-red-700' as const,
    confirmVariant: 'primary' as const,
  },
  warning: {
    icon: '⚠️',
    iconBg: 'bg-yellow-100',
    confirmBtn: 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600' as const,
    confirmVariant: 'primary' as const,
  },
  default: {
    icon: '?',
    iconBg: 'bg-gray-100',
    confirmBtn: '' as const,
    confirmVariant: 'primary' as const,
  },
};


export default function ConfirmDialog() {
  const { isOpen, options, _accept, _cancel } = useConfirmStore();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  if (!options) return null;

  const variant = options.variant ?? 'default';
  const v = variantStyles[variant];

  return (
    <dialog
      ref={dialogRef}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] backdrop:bg-black/50 backdrop:backdrop-blur-sm p-0 w-[360px] bg-white outline-none"
      onKeyDown={(e) => e.key === 'Escape' && _cancel()}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${v.iconBg} flex items-center justify-center text-xl flex-shrink-0`}>
            {v.icon}
          </div>
          {options.title && (
            <h2 className="text-lg font-bold text-black">{options.title}</h2>
          )}
        </div>

        <p className="text-gray-700 font-medium leading-relaxed pl-1">
          {options.message}
        </p>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" size="sm" onClick={_cancel}>
            {options.cancelLabel ?? 'Cancel'}
          </Button>
          <button
            onClick={_accept}
            className={`
              px-4 py-2 text-sm font-bold border-2 transition-colors
              ${variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 text-white border-red-700'
                : variant === 'warning'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600'
                  : 'bg-black hover:bg-gray-800 text-white border-black'
              }
            `}
          >
            {options.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
