import { createServerFn } from "@tanstack/react-start";

export type Lead = { nome: string; empresa: string; valor: string | null; etapa: string | null };

export const getLeads = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("leads").select("nome, empresa, valor, etapa");
  if (error) throw new Error(error.message);
  return (data ?? []) as Lead[];
});
