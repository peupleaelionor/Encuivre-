import { Empty, Panel } from "@/components/ui";
import { documentExpiryAlerts } from "@/lib/risk";
import { repo } from "@/lib/store";
import type { TrackedDocument } from "@/lib/types";
import type { VerificationStatus } from "@/lib/enums";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<VerificationStatus, string> = {
  VERIFIED: "var(--green)",
  PENDING: "var(--amber)",
  UNVERIFIED: "var(--muted)",
  REJECTED: "var(--red)",
};

export default function DocumentsPage() {
  const now = new Date();
  const docs = repo.documents();
  const expiry = documentExpiryAlerts(now);
  const expiredIds = new Set(expiry.filter((a) => a.status === "EXPIRED").map((a) => a.documentId));
  const expiringIds = new Set(
    expiry.filter((a) => a.status === "EXPIRING_SOON").map((a) => a.documentId),
  );

  const expired = docs.filter((d) => expiredIds.has(d.id));
  const expiring = docs.filter((d) => expiringIds.has(d.id));
  const toVerify = docs.filter(
    (d) => !expiredIds.has(d.id) && (d.verificationStatus === "PENDING" || d.verificationStatus === "UNVERIFIED"),
  );
  const rejected = docs.filter((d) => d.verificationStatus === "REJECTED");
  const ready = docs.filter(
    (d) =>
      d.verificationStatus === "VERIFIED" && !expiredIds.has(d.id) && !expiringIds.has(d.id),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Document Readiness</h1>
        <p className="muted text-sm">
          État documentaire : expirations, vérifications en attente et documents prêts.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Expirés" value={expired.length} color="var(--red)" />
        <Stat label="Expire bientôt" value={expiring.length} color="var(--amber)" />
        <Stat label="À vérifier" value={toVerify.length} color="var(--copper-light)" />
        <Stat label="Prêts" value={ready.length} color="var(--green)" />
      </div>

      <Group title="Expirés" docs={expired} />
      <Group title="Expire sous 30 jours" docs={expiring} />
      <Group title="À vérifier" docs={toVerify} />
      <Group title="Rejetés" docs={rejected} />
      <Group title="Prêts" docs={ready} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="panel panel-2">
      <div className="text-xs muted">{label}</div>
      <div className="kpi-value mt-1" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function Group({ title, docs }: { title: string; docs: TrackedDocument[] }) {
  return (
    <Panel title={`${title} (${docs.length})`}>
      {docs.length === 0 ? (
        <Empty>Aucun document.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr>
                <th className="th">Type</th>
                <th className="th">Rattachement</th>
                <th className="th">Émis</th>
                <th className="th">Expire</th>
                <th className="th">Statut</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="td font-medium">{d.type}</td>
                  <td className="td text-xs muted">
                    {d.companyId ?? "—"}
                    {d.dealId ? ` · ${d.dealId}` : ""}
                  </td>
                  <td className="td">{fmt(d.issueDate)}</td>
                  <td className="td">{fmt(d.expiryDate)}</td>
                  <td className="td">
                    <span className="chip" style={{ color: STATUS_COLOR[d.verificationStatus] }}>
                      {d.verificationStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function fmt(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}
