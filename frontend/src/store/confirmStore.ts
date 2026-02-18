import { create } from "zustand";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;

  // Call this to show the dialog; returns a Promise<boolean>
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  _accept: () => void;
  _cancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: null,
  resolve: null,

  confirm: (options) =>
    new Promise<boolean>((resolve) => {
      set({ isOpen: true, options, resolve });
    }),

  _accept: () => {
    get().resolve?.(true);
    set({ isOpen: false, options: null, resolve: null });
  },

  _cancel: () => {
    get().resolve?.(false);
    set({ isOpen: false, options: null, resolve: null });
  },
}));

/** Convenience helper — call anywhere without hooks */
export const confirm = (options: ConfirmOptions | string) =>
  useConfirmStore
    .getState()
    .confirm(typeof options === "string" ? { message: options } : options);
