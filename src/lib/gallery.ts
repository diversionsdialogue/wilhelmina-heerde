import { supabase } from "@/integrations/supabase/client";

export type AlbumRow = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string | null;
  excerpt: string | null;
  body_md: string | null;
  cover_image_url: string | null;
  youtube_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AlbumPhotoRow = {
  id: string;
  album_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

export async function fetchPublishedAlbums(): Promise<AlbumRow[]> {
  const { data, error } = await supabase
    .from("media_albums")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as AlbumRow[];
}

export async function fetchAlbumBySlug(
  slug: string,
): Promise<{ album: AlbumRow; photos: AlbumPhotoRow[] } | null> {
  const { data: album, error } = await supabase
    .from("media_albums")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!album) return null;
  const { data: photos, error: pErr } = await supabase
    .from("media_album_photos")
    .select("*")
    .eq("album_id", (album as AlbumRow).id)
    .order("sort_order", { ascending: true });
  if (pErr) throw pErr;
  return { album: album as AlbumRow, photos: (photos ?? []) as AlbumPhotoRow[] };
}

/** Parse a YouTube URL and return the privacy-enhanced embed URL, or null. */
export function youtubeNoCookieEmbed(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.replace(/^\//, "");
    } else if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.slice(7);
      else if (u.pathname.startsWith("/shorts/")) id = u.pathname.slice(8);
    }
    if (!id) return null;
    id = id.split(/[/?&]/)[0];
    if (!/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
  } catch {
    return null;
  }
}
