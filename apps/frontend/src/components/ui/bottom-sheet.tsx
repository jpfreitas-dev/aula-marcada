import type { ReactNode } from 'react';

import { IconButton } from '@/components/ui/icon-button';

type BottomSheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  tall?: boolean;
};

export function BottomSheet({
  open,
  title,
  onClose,
  children,
  footer,
  tall = false,
}: BottomSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fechar painel"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        className={`relative z-10 flex w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-2xl ${
          tall ? 'h-[85dvh]' : 'max-h-[95dvh]'
        }`}
      >
        <div className="shrink-0">
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1.5 w-12 rounded-full bg-outline-variant/50" />
          </div>
          <div className="flex items-center justify-between border-b border-surface-variant px-margin-main py-3">
            <h2
              id="bottom-sheet-title"
              className="font-display text-headline-md font-bold text-text-main"
            >
              {title}
            </h2>
            <IconButton
              icon="close"
              onClick={onClose}
              aria-label="Fechar"
              className="text-text-muted"
            />
          </div>
        </div>
        <div className="scroll-area min-h-0 flex-1 px-margin-main py-4">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-surface-variant bg-white px-margin-main py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
