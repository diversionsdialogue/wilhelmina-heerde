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
import photo10 from "@/assets/heerde-verbindt-terugblik-10.webp.asset.json";
import photo11 from "@/assets/heerde-verbindt-terugblik-11.webp.asset.json";
import photo12 from "@/assets/heerde-verbindt-terugblik-12.webp.asset.json";
import photo13 from "@/assets/heerde-verbindt-terugblik-13.webp.asset.json";
import photo14 from "@/assets/heerde-verbindt-terugblik-14.webp.asset.json";
import photo15 from "@/assets/heerde-verbindt-terugblik-15.webp.asset.json";
import photo16 from "@/assets/heerde-verbindt-terugblik-16.webp.asset.json";
import photo17 from "@/assets/heerde-verbindt-terugblik-17.webp.asset.json";
import photo18 from "@/assets/heerde-verbindt-terugblik-18.webp.asset.json";
import photo19 from "@/assets/heerde-verbindt-terugblik-19.webp.asset.json";
import type { GalleryPhoto } from "@/components/site/PhotoGallery";

export const heerdeVerbindtTerugblikSlug = "terugblik-heerde-verbindt-2026";

export const heerdeVerbindtTerugblikPhotos: GalleryPhoto[] = [
  photo0, photo1, photo2, photo3, photo4, photo5, photo6, photo7, photo8, photo9,
  photo10, photo11, photo12, photo13, photo14, photo15, photo16, photo17, photo18, photo19,
].map((photo) => ({
  id: photo.asset_id,
  image_url: photo.url,
  caption: null,
})).reverse();