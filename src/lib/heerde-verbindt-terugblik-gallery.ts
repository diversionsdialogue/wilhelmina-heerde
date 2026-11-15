import photo0 from "@/assets/heerde-verbindt-terugblik-0.webp.asset.json";
import photo1 from "@/assets/heerde-verbindt-terugblik-1.webp.asset.json";
import photo2 from "@/assets/heerde-verbindt-terugblik-2.webp.asset.json";
import photo3 from "@/assets/heerde-verbindt-terugblik-3.webp.asset.json";
import photo4 from "@/assets/heerde-verbindt-terugblik-4.webp.asset.json";
import photo5 from "@/assets/heerde-verbindt-terugblik-5.webp.asset.json";
import photo6 from "@/assets/heerde-verbindt-terugblik-6.webp.asset.json";
import photo7 from "@/assets/heerde-verbindt-terugblik-7.webp.asset.json";
import photo8 from "@/assets/heerde-verbindt-terugblik-8.webp.asset.json";
import photo9 from "@/assets/heerde-verbindt-terugblik-9.webp.asset.json";
import type { GalleryPhoto } from "@/components/site/PhotoGallery";

export const heerdeVerbindtTerugblikSlug = "terugblik-heerde-verbindt-2026";

export const heerdeVerbindtTerugblikPhotos: GalleryPhoto[] = [
  photo0, photo1, photo2, photo3, photo4, photo5, photo6, photo7, photo8, photo9,
].map((photo) => ({
  id: photo.asset_id,
  image_url: photo.url,
  caption: null,
}));