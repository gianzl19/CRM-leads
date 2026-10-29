import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getLeads } from "@/lib/leads.functions";

const leadsQuery = queryOptions({ queryKey: ["leads"], queryFn: () => getLeads() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Leads — CRM Comercial" },
      { name: "description", content: "Lista de todos os leads do CRM Comercial." },
      { property: "og:title", content: "Leads — CRM Comercial" },
      { property: "og:description", content: "Lista de todos os leads do CRM Comercial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(leadsQuery),
  component: Index,
});

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatValor(v: string | null) {
  if (v == null || v.trim() === "") return "—";
  const s = v.trim().replace(/[R$\s]/g, "");
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  return Number.isFinite(n) ? brl.format(n) : v;
}

function Index() {
  const { data: leads } = useSuspenseQuery(leadsQuery);
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground">Leads</h1>
      <p className="mt-1 text-sm text-muted-foreground">{leads.length} leads</p>
      <div className="mt-6 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Etapa</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-3 text-foreground">{l.nome}</td>
                <td className="px-4 py-3 text-foreground">{l.empresa}</td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">{formatValor(l.valor)}</td>
                <td className="px-4 py-3 text-foreground">{l.etapa ?? "—"}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhum lead encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
