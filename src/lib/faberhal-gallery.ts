import photo1 from "@/assets/faberhal-opbouw-1.webp.asset.json";
import photo2 from "@/assets/faberhal-opbouw-2.webp.asset.json";
import photo3 from "@/assets/faberhal-opbouw-3.webp.asset.json";
import photo4 from "@/assets/faberhal-opbouw-4.webp.asset.json";
import photo5 from "@/assets/faberhal-opbouw-5.webp.asset.json";
import photo6 from "@/assets/faberhal-opbouw-6.webp.asset.json";
import type { GalleryPhoto } from "@/components/site/PhotoGallery";

export const faberhalGalleryCaption = "Met man en macht is gewerkt aan het inrichten van de Faberhal. Alles is klaar voor het concert.";

export const faberhalGalleryPhotos: GalleryPhoto[] = [photo1, photo2, photo3, photo4, photo5, photo6].map((photo, index) => ({
  id: photo.asset_id,
  image_url: photo.url,
  caption: index === 5 ? "De Faberhal is klaar voor het concert." : "Vrijwilligers richten de Faberhal in voor het concert.",
}));