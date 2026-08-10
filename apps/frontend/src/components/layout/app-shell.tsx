import { Outlet, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Início", path: "/" },
  { label: "Alunos", path: "/students" },
  { label: "Financeiro", path: "/financial" },
  { label: "Mais", path: "/more" },
] as const;

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg-subtle">
      <header className="bg-purple-900 px-4 py-4 text-white">
        <p className="text-xs uppercase tracking-wide text-white/70">
          Aulas de reforço
        </p>
        <h1 className="font-display text-xl font-bold">Agenda</h1>
      </header>

      <main className="flex-1 px-4 py-4">
        <Outlet />
      </main>

      <nav
        className="sticky bottom-0 border-t border-outline-variant/40 bg-white px-2 pb-2 pt-1"
        aria-label="Navegação principal"
      >
        <div className="flex items-end justify-around">
          {navItems.slice(0, 2).map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`px-3 py-2 text-sm font-medium ${
                location.pathname === item.path ? "text-primary" : "text-text-muted"
              }`}
            >
              {item.label}
            </button>
          ))}

          <button
            type="button"
            className="-mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-md"
            aria-label="Adicionar aula"
          >
            +
          </button>

          {navItems.slice(2).map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`px-3 py-2 text-sm font-medium ${
                location.pathname === item.path ? "text-primary" : "text-text-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
