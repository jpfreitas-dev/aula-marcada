export function OfflineBanner() {
  return (
    <div
      role="status"
      className="border-b border-warning-banner-border bg-warning-banner-bg px-margin-main py-2 text-center text-sm text-warning-banner-text"
    >
      Sem conexão com a internet. Algumas funções podem ficar indisponíveis.
    </div>
  );
}
