export function OfflineBanner() {
  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-margin-main py-2 text-center text-sm text-amber-900"
    >
      Sem conexão com a internet. Algumas funções podem ficar indisponíveis.
    </div>
  );
}
