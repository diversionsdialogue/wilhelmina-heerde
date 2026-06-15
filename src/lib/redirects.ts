/**
 * Statische redirect-tabel: oude WordPress-URLs → nieuwe URLs.
 *
 * Bron: https://www.wilhelmina-heerde.nl/sitemap_index.xml
 *
 * Pas dit bestand aan wanneer je een nieuwe redirect wilt toevoegen of
 * wanneer een nieuwe slug in de DB landt waarvoor een oude URL bestond.
 * Keys staan ZONDER trailing slash. De matcher normaliseert binnenkomende
 * paden automatisch.
 */

/** Vaste 1-op-1 redirects (oud pad → nieuw pad). */
const EXACT_REDIRECTS: Record<string, string> = {
  // Hoofdsecties
  "/agenda": "/optredens",
  "/media": "/beeld-en-geluid",
  "/nieuws": "/nieuws",
  "/contact": "/contact",
  "/steun-ons-via-sponsorkliks": "/steun",
  "/home/sponsoren": "/sponsoren",

  // Pagina's die nu onder /p/<slug> leven
  "/dirigent": "/p/dirigent",
  "/bestuur": "/p/bestuur",
  "/hessenblazers": "/p/hessenblazers",
  "/wilhelminaband": "/p/wilhelminaband",
  "/a-orkest": "/p/a-orkest",
  "/wilhelmina-nieuw-talent": "/p/wilhelmina-nieuw-talent",
  "/zelf-muziek-maken": "/p/zelf-muziek-maken",
  "/oud-papier-inzameling": "/p/oud-papier-inzameling",
  "/lid-worden": "/p/lid-worden",
  "/privacy-policy-privacybeleid": "/p/privacy-policy-privacybeleid",

  // Mediaalbums (WordPress slug → huidig album-slug)
  "/media/heerderlijk-festival": "/beeld-en-geluid/heerderlijk-festival",
  "/media/night-of-the-music": "/beeld-en-geluid/night-of-the-music",
  "/media/zomeravondconcert-landgoed-vosbergen": "/beeld-en-geluid/zomeravondconcert-kasteel-vosbergen",
  "/media/jubileumconcert-vosbergen": "/beeld-en-geluid/zomeravondconcert-kasteel-vosbergen",
  "/media/lammert-niessing-is-wilhelminas-maestro-2025-2": "/beeld-en-geluid/maestro-concert",

  // Nieuwsartikelen waarvan de slug afwijkt
  "/zomeravondconcert-bij-kasteel-vosbergen": "/nieuws/zomeravondconcert-bij-kasteel-vosbergen-2",
};

/**
 * Slugs die 1-op-1 als nieuwsartikel terugkomen onder /nieuws/<slug>.
 * Bron: de oude WordPress-postlijst gekruist met de huidige `news`-tabel.
 */
const NEWS_SLUGS = new Set<string>([
  "1071-2",
  "24-uurs-muziek-marathon",
  "669",
  "aankondiging-harmonie-meets-fanfare",
  "aanschaf-bassdrum",
  "afsluiting-seizoen",
  "brass-en-bigband",
  "buitenconcert-wilhelmina-heerde-afgelast",
  "buitenconcerten-2014",
  "cheque-rabobank-clubkas-campagne-2016",
  "dirigent-silva-soepboer",
  "dirigente-silva-tichelaar-soepboer-neemt-afscheid-wilhelmina",
  "dubbel-feest-bij-wilhelmina",
  "eerste-prijs-voor-a-orkest",
  "examenkandidaten-2016-geslaagd",
  "feestelijk-nieuwjaarsconcert",
  "gerben-kralt-nieuwe-dirigent-a-orkest-koninklijk-fanfarekorps-wilhelmina",
  "geslaagd-hrfstwnd-concert",
  "geslaagd-nieuwjaarsconcert",
  "geslaagd-nieuwjaarsconcert-2",
  "geslaagd-uitje-jeugd-wilhelmina",
  "geslaagd-veluws-muziek-spektakel",
  "geslaagd-voor-a-examen",
  "geslaagd-voorjaarsconcert",
  "harmonie-meets-fanfare-2",
  "hartverwarmende-kerstactiviteiten",
  "heerdelijk-festival",
  "hoogtepunten-tijdens-de-ledenvergadering",
  "hoornerfeest-2015",
  "hrfstwnd",
  "jeugd-studieweekend-2011",
  "jubilarissen-bij-koninklijk-fanfarekorps-wilhelmina",
  "jubilarissen-bij-koninklijk-fanfarekorps-wilhelmina-2",
  "jubilarissen-wilhelmina",
  "jubileumconcert-bij-kasteel-vosbergen",
  "kerstnachtdienst-schaapskooi-heerde",
  "koningsdag-2015-heerde",
  "koningsdag-2016",
  "lammert-niessing-is-wilhelminas-maestro-2025",
  "leerlingen-geslaagd-bij-wilhelmina-heerde",
  "leerlingen-wilhelmina-geslaagd",
  "maestro-concert",
  "moadventure",
  "moadventure16062018",
  "mooi-resultaat-a-orkest-hanzefestival-zutphen",
  "nieuwe-voorzitter-koninklijk-fanfarekorps-wilhelmina",
  "nieuwjaarsconcert-2",
  "nieuwjaarsconcert-3",
  "night-of-the-music-groot-succes",
  "oliebollen-actie-2014",
  "oliebollenactie-2015",
  "optreden-percussiongroep-wapenveld",
  "oranjeconcert-25-april",
  "pepermuntactie",
  "prachtig-zomeravondconcert",
  "rabobank-clubkas-campagne",
  "rabobank-clubkas-fonds",
  "sfeervol-winterconcert",
  "slagerij-guilik-nieuwe-sponsor-wilhelmina",
  "slagwerkklas-2015",
  "sponsorcontract-driesje-uitvaartverzorging",
  "succesvol-jeugdstudieweekend",
  "tentoonstelling-120-jaar-wilhelmina",
  "veluws-muziekspektakel-2016",
  "veluws-muziekspektakel-2016-2",
  "verenigingsconcert-2015",
  "verplaatsing-oud-papier-containers",
  "voorjaarsconcert",
  "voorjaarsconcert-2014-wilhelmina",
  "voorjaarsconcert-2018",
  "wilhelmina-behaalt-1e-prijs",
  "wilhelmina-bij-vosbergen",
  "wilhelmina-en-nieuw-talent-wnt-het-volwassenen-leerorkest-van-wilhelmina",
  "wilhelmina-op-het-plein-2",
  "wilhelminaband-gaat-van-start",
  "winteravondconcert",
  "winterconcert-2024",
  "winterconcert-wilhelmina",
  "wnt-is-gestart",
  "zomeravond-concert-2015",
  "zomeravondconcert-2018",
  "zomeravondconcert-bij-kasteel-vosbergen-2",
  "zomeravondconcert-op-landgoed-vosbergen",
  "zomerconcerten",
]);

/**
 * Patroon-redirects voor sitemap-groepen (WordPress-categorieën,
 * authorpagina's en individuele sponsorpagina's).
 */
const PATTERN_REDIRECTS: Array<{ test: RegExp; to: string }> = [
  { test: /^\/category(\/.*)?$/, to: "/nieuws" },
  { test: /^\/author(\/.*)?$/, to: "/" },
  // Individuele WordPress-sponsorpagina's onder /home/sponsoren/<slug>
  { test: /^\/home\/sponsoren\/[^/]+$/, to: "/sponsoren" },
];

/** Strip trailing slashes en lowercase voor stabiele lookups. */
function normalize(pathname: string): string {
  if (!pathname) return "/";
  let p = pathname.toLowerCase();
  // verwijder trailing slashes (behalve voor de root)
  while (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

/**
 * Zoek een match voor `pathname`. Retourneert het nieuwe pad (zonder
 * query/hash) of `null` als er geen redirect bestaat.
 */
export function matchRedirect(pathname: string): string | null {
  const p = normalize(pathname);

  // 1) exacte matches
  if (EXACT_REDIRECTS[p]) return EXACT_REDIRECTS[p];

  // 2) nieuwsartikelen op root-niveau
  //    /<slug> → /nieuws/<slug> als slug bekend is
  const m = p.match(/^\/([^/]+)$/);
  if (m && NEWS_SLUGS.has(m[1])) {
    return `/nieuws/${m[1]}`;
  }

  // 3) patroon-redirects
  for (const rule of PATTERN_REDIRECTS) {
    if (rule.test.test(p)) return rule.to;
  }

  return null;
}

/** Geeft de huidige redirect-tabel terug voor weergave in admin. */
export function listAllRedirects(): Array<{ from: string; to: string; kind: string }> {
  const exact = Object.entries(EXACT_REDIRECTS).map(([from, to]) => ({
    from,
    to,
    kind: "exact",
  }));
  const news = Array.from(NEWS_SLUGS)
    .sort()
    .map((slug) => ({ from: `/${slug}`, to: `/nieuws/${slug}`, kind: "news" }));
  const patterns = PATTERN_REDIRECTS.map((r) => ({
    from: r.test.source,
    to: r.to,
    kind: "pattern",
  }));
  return [...exact, ...news, ...patterns];
}
