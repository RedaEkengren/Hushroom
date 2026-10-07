import { useLocation } from 'react-router-dom';
import { usePageTitle, useHtmlLang } from './usePageTitle';
import { PageHero } from './PageHero';
import { CtaBanner } from './CtaBanner';
import { langFromPath } from './landing-copy';
import { pathFor } from './routes';
import { ABOUT_COPY } from './about-copy';
import { Rich } from './rich-text';

export default function AboutPage() {
  const lang = langFromPath(useLocation().pathname);
  const c = ABOUT_COPY[lang];
  usePageTitle(c.title);
  useHtmlLang(lang);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-yellow-50 pt-16">
      {/* Hero */}
      <PageHero
        image="/img/about-stockholm-dusk.webp"
        alt={c.heroAlt}
        title={c.heroTitle}
        subtitle={c.heroSubtitle}
      />

      {/* The Story */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.why.heading}</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            {c.why.paragraphs.map((p, i) => (
              <p key={i} className={i < c.why.paragraphs.length - 1 ? 'text-gray-600 mb-4' : 'text-gray-600'}>
                <Rich parts={p} />
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.who.heading}</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            {c.who.paragraphs.map((p, i) => (
              <p key={i} className={i < c.who.paragraphs.length - 1 ? 'text-gray-600 mb-4' : 'text-gray-600'}>
                <Rich parts={p} />
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.approach.heading}</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {c.approach.cards.map((card) => (
              <div key={card.title} className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-gray-600 text-sm">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.tech.heading}</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="text-gray-600">
                  {c.tech.rows.map((row, i) => (
                    <tr key={row.label} className={i < c.tech.rows.length - 1 ? 'border-b border-gray-100' : ''}>
                      <td className="py-3 pr-4 font-medium text-gray-900 whitespace-nowrap">{row.label}</td>
                      <td className="py-3">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.contact.heading}</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="grid sm:grid-cols-3 gap-6">
              {c.contact.items.map((item) => (
                <div key={item.email}>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.label}</h3>
                  <a href={`mailto:${item.email}`} className="text-emerald-600 hover:text-emerald-700 text-sm">{item.email}</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CtaBanner lang={lang} sub={c.cta.sub} secondaryLabel={c.cta.secondaryLabel} secondaryTo={pathFor('howItWorks', lang)} />
    </div>
  );
}
