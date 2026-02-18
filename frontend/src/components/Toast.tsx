import { useEffect, useState } from 'react';
import { useToastStore, type Toast as ToastItem, type ToastType } from '../store/toastStore';

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const styles: Record<ToastType, { bar: string; icon: string; bg: string }> = {
  success: {
    bar: 'bg-green-500',
    icon: 'bg-green-100 text-green-700',
    bg: 'bg-white border-green-500',
  },
  error: {
    bar: 'bg-red-500',
    icon: 'bg-red-100 text-red-700',
    bg: 'bg-white border-red-500',
  },
  warning: {
    bar: 'bg-yellow-400',
    icon: 'bg-yellow-100 text-yellow-700',
    bg: 'bg-white border-yellow-400',
  },
  info: {
    bar: 'bg-blue-500',
    icon: 'bg-blue-100 text-blue-700',
    bg: 'bg-white border-blue-500',
  },
};

function ToastItem({ toast }: { toast: ToastItem }) {
  const { removeToast } = useToastStore();
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleRemove = () => {
    setVisible(false);
    setTimeout(() => removeToast(toast.id), 300);
  };

  const s = styles[toast.type];

  return (
    <div
      className={`
        flex items-start gap-3 w-80 border-2 ${s.bg} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        transition-all duration-300 ease-out overflow-hidden
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
      `}
    >
      {/* Left accent bar */}
      <div className={`w-1 self-stretch flex-shrink-0 ${s.bar}`} />

      {/* Icon */}
      <div className={`mt-3 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${s.icon}`}>
        {icons[toast.type]}
      </div>

      {/* Message */}
      <p className="flex-1 py-3 pr-1 text-sm font-medium text-gray-800 leading-snug">
        {toast.message}
      </p>

      {/* Close */}
      <button
        onClick={handleRemove}
        className="mt-2 mr-2 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/** Mount this once at the app root (e.g. in App.tsx or main layout) */
export default function ToastContainer() {
  const { toasts } = useToastStore();

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
