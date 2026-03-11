import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="p-6 text-center space-y-4">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Desculpe, essa rota não existe.
      </p>

      <Link to="/" className="inline-block px-4 py-2 border rounded">
        Voltar para a Home
      </Link>
    </div>
  );
}
