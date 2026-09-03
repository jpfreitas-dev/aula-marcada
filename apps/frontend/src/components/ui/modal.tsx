import type { FormEvent, ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  children: ReactNode;
};

export function Modal({
  open,
  title,
  onClose,
  onSubmit,
  submitDisabled = false,
  children,
}: ModalProps) {
  if (!open) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!submitDisabled && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar modal"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative z-10 w-full max-w-sm rounded-md bg-surface p-card-padding shadow-xl"
      >
        <h2
          id="modal-title"
          className="font-display text-headline-md font-semibold text-purple-900"
        >
          {title}
        </h2>
        <div className="mt-4">{children}</div>
      </form>
    </div>
  );
}
