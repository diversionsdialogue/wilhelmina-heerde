import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PeriodSchema = z.enum(["today", "7d", "30d", "90d", "year"]);
export type Period = z.infer<typeof PeriodSchema>;

function periodRange(period: Period): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const end = new Date();
  const start = new Date();
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "7d") {
    start.setDate(start.getDate() - 7);
  } else if (period === "30d") {
    start.setDate(start.getDate() - 30);
  } else if (period === "90d") {
    start.setDate(start.getDate() - 90);
  } else if (period === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }
  const ms = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime());
  const prevStart = new Date(start.getTime() - ms);
  return { start, end, prevStart, prevEnd };
}

async function requireEditor(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_content_editor", { _user_id: context.userId });
  if (error || !data) throw new Error("Forbidden");
}

export const getDashboardStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { period: Period }) => ({ period: PeriodSchema.parse(d.period) }))
  .handler(async ({ data, context }) => {
    await requireEditor(context);
    const { start, end, prevStart, prevEnd } = periodRange(data.period);

    async function metricsFor(s: Date, e: Date) {
      const { data: rows, error } = await context.supabase
        .from("page_views")
        .select("visitor_hash,session_id")
        .gte("created_at", s.toISOString())
        .lt("created_at", e.toISOString());
      if (error) throw error;
      const visitors = new Set<string>();
      const sessionCounts = new Map<string, number>();
      for (const r of rows ?? []) {
        if (r.visitor_hash) visitors.add(r.visitor_hash);
        const sid = r.session_id ?? r.visitor_hash;
        if (sid) sessionCounts.set(sid, (sessionCounts.get(sid) ?? 0) + 1);
      }
      const pageviews = rows?.length ?? 0;
      const sessions = sessionCounts.size;
      const bounces = Array.from(sessionCounts.values()).filter((c) => c === 1).length;
      const bounce = sessions > 0 ? bounces / sessions : 0;
      const avgPerSession = sessions > 0 ? pageviews / sessions : 0;
      return { visitors: visitors.size, pageviews, sessions, bounce, avgPerSession };
    }

    const [cur, prev] = await Promise.all([metricsFor(start, end), metricsFor(prevStart, prevEnd)]);
    return { current: cur, previous: prev };
  });

export const getViewsTimeseries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { period: Period }) => ({ period: PeriodSchema.parse(d.period) }))
  .handler(async ({ data, context }) => {
    await requireEditor(context);
    const { start, end } = periodRange(data.period);
    const useHours = data.period === "today";

    const { data: rows, error } = await context.supabase
      .from("page_views")
      .select("created_at,visitor_hash")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true });
    if (error) throw error;

    const buckets = new Map<string, { pageviews: number; visitors: Set<string> }>();
    for (const r of rows ?? []) {
      const d = new Date(r.created_at);
      const key = useHours
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}`
        : d.toISOString().slice(0, 10);
      const b = buckets.get(key) ?? { pageviews: 0, visitors: new Set() };
      b.pageviews++;
      if (r.visitor_hash) b.visitors.add(r.visitor_hash);
      buckets.set(key, b);
    }

    // Fill empty buckets
    const result: { bucket: string; pageviews: number; visitors: number }[] = [];
    const cursor = new Date(start);
    cursor.setMinutes(0, 0, 0);
    if (!useHours) cursor.setHours(0, 0, 0, 0);
    while (cursor < end) {
      const key = useHours
        ? `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}T${String(cursor.getHours()).padStart(2, "0")}`
        : cursor.toISOString().slice(0, 10);
      const b = buckets.get(key);
      result.push({ bucket: key, pageviews: b?.pageviews ?? 0, visitors: b?.visitors.size ?? 0 });
      if (useHours) cursor.setHours(cursor.getHours() + 1);
      else cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  });

export const getTopPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { period: Period }) => ({ period: PeriodSchema.parse(d.period) }))
  .handler(async ({ data, context }) => {
    await requireEditor(context);
    const { start, end } = periodRange(data.period);
    const { data: rows, error } = await context.supabase
      .from("page_views")
      .select("path,visitor_hash")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString());
    if (error) throw error;
    const map = new Map<string, { pageviews: number; visitors: Set<string> }>();
    for (const r of rows ?? []) {
      const b = map.get(r.path) ?? { pageviews: 0, visitors: new Set() };
      b.pageviews++;
      if (r.visitor_hash) b.visitors.add(r.visitor_hash);
      map.set(r.path, b);
    }
    return Array.from(map.entries())
      .map(([path, v]) => ({ path, pageviews: v.pageviews, visitors: v.visitors.size }))
      .sort((a, b) => b.pageviews - a.pageviews)
      .slice(0, 10);
  });

export const getTrafficSources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { period: Period }) => ({ period: PeriodSchema.parse(d.period) }))
  .handler(async ({ data, context }) => {
    await requireEditor(context);
    const { start, end } = periodRange(data.period);
    const { data: rows, error } = await context.supabase
      .from("page_views")
      .select("referrer")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString());
    if (error) throw error;
    const map = new Map<string, number>();
    for (const r of rows ?? []) {
      let key = "Direct";
      if (r.referrer) {
        const ref = r.referrer.toLowerCase();
        if (ref.includes("google")) key = "Google";
        else if (ref.includes("bing")) key = "Bing";
        else if (ref.includes("duckduckgo")) key = "DuckDuckGo";
        else if (ref.includes("facebook")) key = "Facebook";
        else if (ref.includes("instagram")) key = "Instagram";
        else if (ref.includes("linkedin")) key = "LinkedIn";
        else if (ref.includes("youtube")) key = "YouTube";
        else if (ref.includes("t.co") || ref.includes("twitter") || ref.includes("x.com")) key = "X/Twitter";
        else key = r.referrer;
      }
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  });

export const getDeviceBreakdown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { period: Period }) => ({ period: PeriodSchema.parse(d.period) }))
  .handler(async ({ data, context }) => {
    await requireEditor(context);
    const { start, end } = periodRange(data.period);
    const { data: rows, error } = await context.supabase
      .from("page_views")
      .select("device")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString());
    if (error) throw error;
    const map = new Map<string, number>();
    for (const r of rows ?? []) {
      const k = r.device ?? "desktop";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    const total = rows?.length ?? 0;
    return Array.from(map.entries())
      .map(([device, count]) => ({ device, count, pct: total > 0 ? count / total : 0 }))
      .sort((a, b) => b.count - a.count);
  });

export const getRecentActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireEditor(context);
    const { data, error } = await context.supabase
      .from("page_views")
      .select("created_at,path,referrer,device,country")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return data ?? [];
  });
