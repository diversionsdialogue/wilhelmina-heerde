import { useCallback, useEffect, useRef, useState } from "react";

export type GalleryPhoto = {
  id: string;
  image_url: string;
  caption: string | null;
};

type Props = {
  photos: GalleryPhoto[];
};

export function PhotoGallery({ photos }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <Collage photos={photos} onOpen={(i) => setOpenIndex(i)} />
      {openIndex !== null && (
        <Lightbox
          photos={photos}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}

function Collage({ photos, onOpen }: { photos: GalleryPhoto[]; onOpen: (i: number) => void }) {
  const tiles = photos.slice(0, 5);
  const extra = photos.length - tiles.length;
  const layoutClass =
    tiles.length === 1
      ? "w-gallery--1"
      : tiles.length === 2
        ? "w-gallery--2"
        : tiles.length === 3
          ? "w-gallery--3"
          : tiles.length === 4
            ? "w-gallery--4"
            : "w-gallery--5";

  return (
    <div className={`w-gallery ${layoutClass}`}>
      {tiles.map((p, i) => {
        const isLast = i === tiles.length - 1 && extra > 0;
        return (
          <button
            key={p.id}
            type="button"
            className="w-gallery__tile"
            onClick={() => onOpen(i)}
            aria-label={`Foto ${i + 1} bekijken`}
          >
            <img src={p.image_url} alt={p.caption ?? ""} loading={i === 0 ? "eager" : "lazy"} />
            {isLast && (
              <span className="w-gallery__more" aria-hidden="true">
                + {extra + 1} foto's
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Lightbox({
  photos,
  startIndex,
  onClose,
}: {
  photos: GalleryPhoto[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const touchStart = useRef<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement | null>(null);

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + photos.length) % photos.length),
    [photos.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % photos.length),
    [photos.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, prev, next]);

  // Keep active thumbnail in view
  useEffect(() => {
    const wrap = thumbsRef.current;
    if (!wrap) return;
    const active = wrap.querySelector<HTMLButtonElement>(`[data-thumb-index="${index}"]`);
    if (active) active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  const current = photos[index];

  return (
    <div className="w-lightbox" role="dialog" aria-modal="true" aria-label="Fotogalerij">
      <header className="w-lightbox__bar">
        <span className="w-lightbox__count">
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          className="w-lightbox__close"
          aria-label="Sluiten"
          onClick={onClose}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 6-12 12" /><path d="m6 6 12 12" /></svg>
        </button>
      </header>

      <div
        className="w-lightbox__stage"
        onTouchStart={(e) => {
          touchStart.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStart.current == null) return;
          const dx = e.changedTouches[0].clientX - touchStart.current;
          if (dx > 40) prev();
          else if (dx < -40) next();
          touchStart.current = null;
        }}
      >
        {photos.length > 1 && (
          <button
            type="button"
            className="w-lightbox__nav w-lightbox__nav--prev"
            aria-label="Vorige foto"
            onClick={prev}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
        )}
        <img
          key={current.id}
          className="w-lightbox__img"
          src={current.image_url}
          alt={current.caption ?? ""}
        />
        {photos.length > 1 && (
          <button
            type="button"
            className="w-lightbox__nav w-lightbox__nav--next"
            aria-label="Volgende foto"
            onClick={next}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
          </button>
        )}
      </div>

      {current.caption && <p className="w-lightbox__caption">{current.caption}</p>}

      {photos.length > 1 && (
        <div className="w-lightbox__thumbs" ref={thumbsRef}>
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              data-thumb-index={i}
              className={`w-lightbox__thumb${i === index ? " is-active" : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`Ga naar foto ${i + 1}`}
            >
              <img src={p.image_url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
