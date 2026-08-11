import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/icon';

type BottomSheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function BottomSheet({
  open,
  title,
  onClose,
  children,
}: BottomSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar painel"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        className="relative z-10 w-full max-w-lg rounded-t-2xl bg-white px-margin-main pb-6 pt-4 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="bottom-sheet-title"
            className="font-display text-headline-md font-semibold text-purple-900"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-text-muted hover:bg-bg-subtle"
            aria-label="Fechar"
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
