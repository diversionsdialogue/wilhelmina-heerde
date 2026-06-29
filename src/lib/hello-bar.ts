import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type HelloBar = {
  message: string;
  link_url: string | null;
  active: boolean;
};

export async function fetchHelloBar(): Promise<HelloBar | null> {
  const { data, error } = await supabase
    .from("hello_bar")
    .select("message, link_url, active")
    .eq("id", 1)
    .maybeSingle();
  if (error) return null;
  return data;
}

export function useHelloBar() {
  return useQuery({
    queryKey: ["hello-bar"],
    queryFn: fetchHelloBar,
    staleTime: 60_000,
  });
}

export async function saveHelloBar(input: HelloBar) {
  const { error } = await supabase
    .from("hello_bar")
    .upsert({ id: 1, ...input, updated_at: new Date().toISOString() });
  if (error) throw error;
}
