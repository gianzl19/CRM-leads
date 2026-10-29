import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Lead = { nome: string; empresa: string; valor: string | null; etapa: string | null };

export const ETAPAS = ["Novo", "Em contato", "Fechado"] as const;

export const leadSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome").max(200),
  empresa: z.string().trim().min(1, "Informe a empresa").max(200),
  valor: z.number().finite().min(0, "Valor inválido").max(1e12),
  etapa: z.enum(ETAPAS),
});

export const getLeads = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("leads").select("nome, empresa, valor, etapa");
  if (error) throw new Error(error.message);
  return (data ?? []) as Lead[];
});

export const createLead = createServerFn({ method: "POST" })
  .inputValidator((d) => leadSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("leads")
      .insert({ nome: data.nome, empresa: data.empresa, valor: String(data.valor), etapa: data.etapa });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateLeadEtapa = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        nome: z.string().min(1).max(200),
        empresa: z.string().min(1).max(200),
        etapa: z.enum(ETAPAS),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("leads")
      .update({ etapa: data.etapa })
      .eq("nome", data.nome)
      .eq("empresa", data.empresa);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
