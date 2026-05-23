import { SiteLayout } from "@/components/site/SiteLayout";
import { NewsletterForm } from "@/components/site/NewsletterForm";

function NewsletterBand() {
  return (
    <section className="w-news" id="nieuwsbrief">
      <div className="w-container">
        <div className="w-news__inner">
          <div>
            <p className="w-eyebrow">Nieuwsbrief</p>
            <h2 className="w-news__title" style={{ marginTop: 14 }}>Schrijf je in voor onze nieuwsbrief</h2>
            <p className="w-news__dek">
              Blijf op de hoogte van actuele informatie over onze concerten, musici en achtergrondverhalen — circa zes uitgaven per jaar.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}

export { NewsletterBand, SiteLayout };
