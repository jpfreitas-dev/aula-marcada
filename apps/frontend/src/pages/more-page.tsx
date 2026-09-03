import { useState } from 'react';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { useAuth } from '@/context/auth-context';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { useThemePreference } from '@/hooks/use-theme-preference';

function SettingIcon({ name }: { name: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
      <Icon name={name} className="text-xl" />
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
      <SettingRow icon="mobile_check" title="App instalado">
        <p className="text-sm text-text-muted">
          O Aula Marcada já está disponível na sua tela inicial.
        </p>
      </SettingRow>
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
      <SettingRow icon="install_mobile" title="Instalar aplicativo">
        <p className="text-sm text-text-muted">
          Use na tela inicial como app, sem barra do navegador.
        </p>

        {canInstall ? (
          <Button
            type="button"
            size="md"
            className="mt-3 w-full sm:w-auto"
            disabled={installing}
            onClick={() => void handleInstall()}
          >
            {installing ? 'Instalando...' : 'Instalar'}
          </Button>
        ) : null}

        {!canInstall && !isIos ? (
          <p className="mt-3 rounded-md bg-bg-subtle px-3 py-2.5 text-sm text-text-muted">
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
            className="mt-3 w-full sm:w-auto"
            onClick={() => setIosSheetOpen(true)}
          >
            Como instalar no iPhone
          </Button>
        ) : null}
      </SettingRow>
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
    <SettingRow icon="contrast" title="Aparência">
      <p className="text-sm text-text-muted">
        Escolha entre modo claro ou escuro.
      </p>
      <SegmentedToggle
        value={theme}
        onChange={setTheme}
        options={themeOptions}
        fullWidth
        className="mt-3 max-w-xs"
      />
    </SettingRow>
  );
}

function LogoutCard() {
  const { logout } = useAuth();

  return (
    <SettingRow icon="logout" title="Sair da conta">
      <p className="text-sm text-text-muted">
        Você será redirecionado para a tela de login.
      </p>
      <Button
        variant="danger"
        size="md"
        className="mt-3 w-full sm:w-auto"
        onClick={logout}
      >
        Sair
      </Button>
    </SettingRow>
  );
}

function SettingRow({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <SettingIcon name={icon} />
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-sm font-semibold text-text-main">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

export function MorePage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <section className="rounded-md border border-outline-variant/30 bg-surface p-card-padding shadow-sm">
        <div className="flex flex-col divide-y divide-outline-variant/30">
          <div className="pb-5">
            <InstallAppCard />
          </div>
          <div className="py-5">
            <ThemeCard />
          </div>
          <div className="pt-5">
            <LogoutCard />
          </div>
        </div>
      </section>
    </div>
  );
}
