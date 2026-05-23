import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Schema = z.object({
  audience: z.enum(["kind", "volwassen"]),
  experience: z.enum(["nee", "ja"]).nullable().optional(),
  prev_instrument: z.string().max(60).nullable().optional(),
  rejoin_choice: z.enum(["zelfde", "anders"]).nullable().optional(),
  chosen_instrument: z.string().max(60).nullable().optional(),
  switcher: z.boolean().default(false),
  exit_type: z.enum(["proefles", "info", "contact"]),
  preference: z.enum(["contact", "info"]),
  name: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().max(255),
  notes: z.string().max(2000).optional().nullable(),
});

function buildSubject(d: z.infer<typeof Schema>) {
  const who = d.audience === "kind" ? "Kind" : "Volwassene";
  const instr = d.chosen_instrument || d.prev_instrument || "Onbekend";
  if (d.exit_type === "contact") return `[Quickscan] Aanvraag herintreder ${instr} - ${who}`;
  if (d.exit_type === "proefles") return `[Quickscan] Aanvraag proefles ${instr} - ${who}`;
  return `[Quickscan] Informatieaanvraag ${instr} - ${who}`;
}

export const submitQuickscan = createServerFn({ method: "POST" })
  .inputValidator((input) => Schema.parse(input))
  .handler(async ({ data }) => {
    const subject = buildSubject(data);
    const { error } = await supabaseAdmin.from("quickscan_leads").insert({
      audience: data.audience,
      experience: data.experience ?? null,
      prev_instrument: data.prev_instrument ?? null,
      rejoin_choice: data.rejoin_choice ?? null,
      chosen_instrument: data.chosen_instrument ?? null,
      switcher: data.switcher,
      exit_type: data.exit_type,
      preference: data.preference,
      name: data.name?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email.trim(),
      notes: data.notes?.trim() || null,
      subject,
    });
    if (error) throw new Error(error.message);
    return { ok: true, subject };
  });
