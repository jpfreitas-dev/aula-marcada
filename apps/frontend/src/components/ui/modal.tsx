import type { ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar modal"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative z-10 w-full max-w-sm rounded-xl bg-white p-card-padding shadow-xl"
      >
        <h2
          id="modal-title"
          className="font-display text-headline-md font-semibold text-purple-900"
        >
          {title}
        </h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
