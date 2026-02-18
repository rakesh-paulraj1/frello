import React, { useEffect, useRef } from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen) {
      dialog?.showModal();
    } else {
      dialog?.close();
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === dialogRef.current) {
      handleClose();
    }
  };

  return (
    <dialog 
      ref={dialogRef} 
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] backdrop:bg-black/50 backdrop:backdrop-blur-sm p-0 min-w-[400px] bg-white outline-none"
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
    >
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <button 
          className="text-2xl leading-none text-gray-600 hover:bg-gray-100 hover:text-black p-1 rounded transition-colors"
          onClick={handleClose} 
          aria-label="Close"
        >
          &times;
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </dialog>
  );
};
