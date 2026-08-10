import { useParams } from "react-router-dom";

export function StudentProfilePage() {
  const { id } = useParams();

  return (
    <section className="rounded-card bg-white p-4 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-purple-900">
        Perfil do aluno
      </h2>
      <p className="mt-2 text-sm text-text-muted">Aluno: {id ?? "—"}</p>
    </section>
  );
}
