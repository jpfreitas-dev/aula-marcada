import { useState } from 'react';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { useThemePreference } from '@/hooks/use-theme-preference';

function InstallCardIcon({ name }: { name: string }) {
  return (
    <span className="mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary sm:mx-0">
      <Icon name={name} className="text-2xl" />
    </span>
  );
}

function IosInstallSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <BottomSheet open={open} title="Como instalar no iPhone" onClose={onClose}>
      <ol className="list-decimal space-y-3 pl-5 text-sm text-text-main">
        <li>Toque no botão Compartilhar na barra inferior do Safari.</li>
        <li>Role a lista e escolha Adicionar à Tela de Início.</li>
        <li>Confirme o nome Aula Marcada e toque em Adicionar.</li>
      </ol>
    </BottomSheet>
  );
}

function InstallAppCard() {
  const { canInstall, isInstalled, isIos, promptInstall } = usePwaInstall();
  const [iosSheetOpen, setIosSheetOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (isInstalled) {
    return (
      <section className="rounded-md border border-outline-variant/30 bg-surface p-card-padding shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          <InstallCardIcon name="mobile_check" />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-semibold text-purple-900">
              App instalado
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              O Aula Marcada já está disponível na sua tela inicial.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const handleInstall = async () => {
    setInstalling(true);

    try {
      await promptInstall();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      <section className="rounded-md border border-outline-variant/30 bg-surface p-card-padding shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          <InstallCardIcon name="install_mobile" />
          <div className="flex w-full min-w-0 flex-1 flex-col">
            <h3 className="font-display text-base font-semibold text-purple-900">
              Instalar aplicativo
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              Use na tela inicial como app, sem barra do navegador.
            </p>

            {canInstall ? (
              <Button
                type="button"
                size="md"
                className="mt-4 w-full sm:w-auto sm:self-start"
                disabled={installing}
                onClick={() => void handleInstall()}
              >
                {installing ? 'Instalando...' : 'Instalar'}
              </Button>
            ) : null}

            {!canInstall && !isIos ? (
              <p className="mt-4 rounded-md bg-bg-subtle px-3 py-2.5 text-sm text-text-muted">
                Abra o menu do navegador (⋮) e escolha{' '}
                <span className="font-medium text-text-main">
                  Instalar aplicativo
                </span>
                .
              </p>
            ) : null}

            {isIos ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="mt-4 w-full sm:w-auto sm:self-start"
                onClick={() => setIosSheetOpen(true)}
              >
                Como instalar no iPhone
              </Button>
            ) : null}
          </div>
        </div>
      </section>
      <IosInstallSheet
        open={iosSheetOpen}
        onClose={() => setIosSheetOpen(false)}
      />
    </>
  );
}

const themeOptions = [
  { value: 'light' as const, label: 'Modo claro' },
  { value: 'dark' as const, label: 'Modo escuro' },
];

function ThemeCard() {
  const { theme, setTheme } = useThemePreference();

  return (
    <section className="rounded-md border border-outline-variant/30 bg-surface p-card-padding shadow-sm">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <InstallCardIcon name="contrast" />
        <div className="flex w-full min-w-0 flex-1 flex-col">
          <h3 className="font-display text-base font-semibold text-purple-900">
            Aparência
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            Escolha entre modo claro ou escuro.
          </p>
          <SegmentedToggle
            value={theme}
            onChange={setTheme}
            options={themeOptions}
            fullWidth
            className="mt-4 max-w-xs sm:self-start"
          />
        </div>
      </div>
    </section>
  );
}

export function MorePage() {
  return (
    <div className="flex flex-col gap-stack-md">
      <InstallAppCard />
      <ThemeCard />
    </div>
  );
}
