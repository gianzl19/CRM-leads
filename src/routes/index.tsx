import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { createLead, getLeads, leadSchema } from "@/lib/leads.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function NovoLeadForm() {
  const qc = useQueryClient();
  const create = useServerFn(createLead);
  const [form, setForm] = useState({ nome: "", empresa: "", valor: "", etapa: "" });
  const [erro, setErro] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      setForm({ nome: "", empresa: "", valor: "", etapa: "" });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: () => setErro("Não foi possível salvar o lead. Tente novamente."),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    const parsed = leadSchema.safeParse({ ...form, valor: form.valor === "" ? NaN : Number(form.valor) });
    if (!parsed.success) {
      setErro(parsed.error.issues[0]?.message === "Expected number, received nan" ? "Informe o valor" : parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    mutation.mutate({ data: parsed.data });
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-lg border p-4 sm:grid-cols-4">
      <div className="grid gap-1.5"><Label htmlFor="nome">Nome</Label><Input id="nome" value={form.nome} onChange={set("nome")} maxLength={200} /></div>
      <div className="grid gap-1.5"><Label htmlFor="empresa">Empresa</Label><Input id="empresa" value={form.empresa} onChange={set("empresa")} maxLength={200} /></div>
      <div className="grid gap-1.5"><Label htmlFor="valor">Valor (R$)</Label><Input id="valor" type="number" step="0.01" min="0" value={form.valor} onChange={set("valor")} /></div>
      <div className="grid gap-1.5"><Label htmlFor="etapa">Etapa</Label><Input id="etapa" value={form.etapa} onChange={set("etapa")} maxLength={100} /></div>
      <div className="flex items-center gap-3 sm:col-span-4">
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Salvando..." : "Adicionar lead"}</Button>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </div>
    </form>
  );
}

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
      <NovoLeadForm />
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
