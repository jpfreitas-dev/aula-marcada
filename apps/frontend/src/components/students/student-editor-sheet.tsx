import type { ReactNode } from 'react';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

type StudentEditorSheetProps = {
  open: boolean;
  title: string;
  confirmLabel: string;
  saving?: boolean;
  error?: string | null;
  tall?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children: ReactNode;
};

export function StudentEditorSheet({
  open,
  title,
  confirmLabel,
  saving = false,
  error = null,
  tall = false,
  onClose,
  onConfirm,
  children,
}: StudentEditorSheetProps) {
  return (
    <BottomSheet
      open={open}
      tall={tall}
      title={title}
      onClose={onClose}
      footer={
        <Button className="w-full gap-2" disabled={saving} onClick={onConfirm}>
          <Icon name="check" className="text-xl" />
          {confirmLabel}
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {children}
        {error ? <p className="text-sm text-status-danger">{error}</p> : null}
      </div>
    </BottomSheet>
  );
}
