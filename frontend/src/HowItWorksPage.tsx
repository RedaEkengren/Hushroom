import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { usePageTitle, useHtmlLang } from './usePageTitle';
import { PageHero } from './PageHero';
import { CtaBanner } from './CtaBanner';
import { langFromPath } from './landing-copy';
import { pathFor } from './routes';
import { HOW_COPY } from './how-copy';
import { Rich } from './rich-text';

export default function HowItWorksPage() {
  const lang = langFromPath(useLocation().pathname);
  const c = HOW_COPY[lang];
  usePageTitle(c.title);
  useHtmlLang(lang);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-yellow-50 pt-16">
      {/* Hero */}
      <PageHero
        image="/img/how-frosted-window.webp"
        alt={c.heroAlt}
        title={c.heroTitle}
        subtitle={c.heroSubtitle}
      />

      {/* How rooms work */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.rooms.heading}</h2>
          <div className="prose prose-emerald max-w-none">
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                {c.rooms.steps.map((step, i) => (
                  <div key={step.title} className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-lg">{i + 1}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.text}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">{c.rooms.storageHeading}</h3>
              <p className="text-gray-600 mb-3"><Rich parts={c.rooms.storageP1} /></p>
              <p className="text-gray-600 mb-3">{c.rooms.storageP2}</p>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-emerald-800 font-medium">{c.rooms.durations}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How encryption works */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.encryption.heading}</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{c.encryption.fragmentHeading}</h3>
            <p className="text-gray-600 mb-4"><Rich parts={c.encryption.fragmentIntro} /></p>
            <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
              <code className="text-emerald-400 text-sm font-mono">
                {c.encryption.exampleUrl}<span className="text-amber-400">{c.encryption.exampleKey}</span>
              </code>
            </div>
            <p className="text-gray-600 mb-4"><Rich parts={c.encryption.fragmentSpec} /></p>

            <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">{c.encryption.textHeading}</h3>
            <p className="text-gray-600 mb-3"><Rich parts={c.encryption.textBody} /></p>

            <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">{c.encryption.mediaHeading}</h3>
            <p className="text-gray-600 mb-3"><Rich parts={c.encryption.mediaBody} /></p>

            <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">{c.encryption.lifecycleHeading}</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              {c.encryption.lifecycle.map((item, i) => (
                <li key={i}><Rich parts={item} /></li>
              ))}
            </ul>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-6">
              <p className="text-emerald-800 font-semibold text-sm mb-2">{c.encryption.whySecure.label}</p>
              <ul className="space-y-1.5 text-sm text-emerald-800">
                {c.encryption.whySecure.points.map((p) => (
                  <li key={p} className="flex items-start gap-2"><span className="text-emerald-600 mt-0.5">&#10003;</span> {p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What the server stores */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.stores.heading}</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <p className="text-gray-600 mb-6">{c.stores.intro}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {c.stores.columns.map((col) => (
                      <th key={col} className="text-left py-3 px-4 font-semibold text-gray-900">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  {c.stores.rows.map((row, i) => (
                    <tr key={row.data} className={i < c.stores.rows.length - 1 ? 'border-b border-gray-100' : ''}>
                      <td className="py-3 px-4">{row.data}</td>
                      <td className={`py-3 px-4 ${row.highlight ? 'font-medium text-emerald-700' : ''}`}>
                        {row.code
                          ? <><code className="px-1.5 py-0.5 bg-gray-100 rounded">{row.storedAs}</code> {lang === 'sv' ? 'platshållare' : 'placeholder'}</>
                          : row.storedAs}
                      </td>
                      <td className="py-3 px-4">{row.retention}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-gray-500 text-sm mt-6">{c.stores.notCollected}</p>
          </div>
        </div>
      </section>

      {/* What can be disclosed. Canonical version lives on /sakerhet#legal */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.disclosure.heading}</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <p className="text-gray-600 mb-4">{c.disclosure.body}</p>
            <Link to={`${pathFor('security', lang)}#legal`} className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors">
              {c.disclosure.link}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ISP caveat */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{c.isp.heading}</h2>
            <p className="text-gray-600 mb-4"><Rich parts={c.isp.intro} /></p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              {c.isp.items.map((item, i) => (
                <li key={i}><Rich parts={item} /></li>
              ))}
            </ul>
            <p className="text-gray-600 mb-4"><Rich parts={c.isp.reveals} /></p>
            <p className="text-gray-600">{c.isp.advice}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CtaBanner lang={lang} secondaryLabel={c.cta.secondaryLabel} secondaryTo={pathFor('security', lang)} />
    </div>
  );
}
