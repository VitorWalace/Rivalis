import { create } from 'zustand';

type ConfirmTone = 'danger' | 'primary' | 'warning';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
}

interface ConfirmState {
  isOpen: boolean;
  options: Required<Pick<ConfirmOptions, 'title' | 'message' | 'confirmText' | 'cancelText' | 'tone'>>;
  resolve?: (value: boolean) => void;
  open: (options: ConfirmOptions) => Promise<boolean>;
  close: () => void;
  accept: () => void;
  cancel: () => void;
}

const defaultOptions: ConfirmState['options'] = {
  title: 'Confirmar ação',
  message: 'Tem certeza que deseja continuar?',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  tone: 'primary',
};

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: defaultOptions,
  resolve: undefined,
  open: (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        options: {
          title: options.title ?? defaultOptions.title,
          message: options.message,
          confirmText: options.confirmText ?? defaultOptions.confirmText,
          cancelText: options.cancelText ?? defaultOptions.cancelText,
          tone: options.tone ?? defaultOptions.tone,
        },
        resolve,
      });
    });
  },
  close: () => {
    set({ isOpen: false, resolve: undefined });
  },
  accept: () => {
    const resolver = get().resolve;
    if (resolver) resolver(true);
    set({ isOpen: false, resolve: undefined });
  },
  cancel: () => {
    const resolver = get().resolve;
    if (resolver) resolver(false);
    set({ isOpen: false, resolve: undefined });
  },
}));

export const useConfirm = () => {
  const open = useConfirmStore((s) => s.open);
  return open;
};
