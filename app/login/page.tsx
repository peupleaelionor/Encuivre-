import { loginAction } from "@/app/auth-actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
      <div className="mb-6 text-center">
        <div className="text-2xl font-bold tracking-tight">
          EN CUIVRE <span style={{ color: "var(--copper-light)" }}>OS</span>
        </div>
        <p className="muted mt-1 text-sm">Connexion à l&apos;espace dirigeant.</p>
      </div>

      <form action={loginAction} className="panel space-y-3">
        {error && (
          <div className="rounded-lg px-3 py-2 text-sm" style={{ background: "#3a0808", color: "#f78b8b" }}>
            Identifiants invalides.
          </div>
        )}
        <label className="block text-xs muted">
          <span className="mb-1 block">Email</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={isDev ? "ceo@encuivre.example" : ""}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </label>
        <label className="block text-xs muted">
          <span className="mb-1 block">Mot de passe</span>
          <input
            name="password"
            type="password"
            required
            defaultValue={isDev ? "encuivre" : ""}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </label>
        <button className="btn w-full" type="submit">
          Se connecter
        </button>
      </form>

      {isDev && (
        <div className="panel panel-2 mt-4 text-xs muted">
          <div className="mb-1 font-semibold">Comptes de démo (dev) · mot de passe « encuivre »</div>
          <ul className="space-y-0.5">
            <li>ceo@encuivre.example — CEO (tout)</li>
            <li>finance@encuivre.example — FINANCE (marges)</li>
            <li>compliance@encuivre.example — COMPLIANCE (documents)</li>
            <li>contact@metalsud.example — SUPPLIER (portail fournisseur)</li>
            <li>achat@cableplus.example — BUYER (portail acheteur)</li>
          </ul>
        </div>
      )}
    </div>
  );
}
