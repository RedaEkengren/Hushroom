import { useLocation } from 'react-router-dom';
import { usePageTitle, useHtmlLang } from './usePageTitle';
import { PageHero } from './PageHero';
import { CtaBanner } from './CtaBanner';
import { langFromPath } from './landing-copy';
import { SECURITY_COPY } from './security-copy';
import { Rich } from './rich-text';

export default function SecurityPage() {
  const lang = langFromPath(useLocation().pathname);
  const c = SECURITY_COPY[lang];
  usePageTitle(c.title);
  useHtmlLang(lang);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-yellow-50 pt-16">
      {/* Hero */}
      <PageHero
        image="/img/security-frosted-person.webp"
        alt={c.heroAlt}
        title={c.heroTitle}
        subtitle={<Rich parts={c.heroSubtitle} />}
      />

      {/* Zero-Knowledge Design */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.zeroKnowledge.heading}</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <p className="text-gray-600 mb-4"><Rich parts={c.zeroKnowledge.p1} /></p>
            <p className="text-gray-600 mb-4">{c.zeroKnowledge.p2}</p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-emerald-800 font-medium italic text-center">{c.zeroKnowledge.quote}</p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Encrypt */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.encrypt.heading}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[c.encrypt.text, c.encrypt.media].map((block) => (
              <div key={block.heading} className="bg-white rounded-xl shadow-sm p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{block.heading}</h3>
                <p className="text-gray-600 mb-3"><Rich parts={block.body} /></p>
                <div className="text-sm text-gray-500 space-y-1">
                  {block.specs.map((s) => (
                    <p key={s.label}><strong>{s.label}:</strong> {s.value}</p>
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-6">
              <p className="text-emerald-800 font-semibold text-sm mb-2">{c.encrypt.whySecure.label}</p>
              <ul className="space-y-1.5 text-sm text-emerald-800">
                {c.encrypt.whySecure.points.map((p) => (
                  <li key={p} className="flex items-start gap-2"><span className="text-emerald-600 mt-0.5">&#10003;</span> {p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What We Don't Store */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.dontStore.heading}</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="grid sm:grid-cols-2 gap-4">
              {c.dontStore.items.map((item) => (
                <div key={item} className="flex items-center gap-3 py-2">
                  <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✕</span>
                  <span className="text-gray-600 text-sm">{item}</span>
                </div>
              ))}
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-6">
              <p className="text-emerald-800 font-semibold text-sm mb-2">{c.dontStore.whySecure.label}</p>
              <ul className="space-y-1.5 text-sm text-emerald-800">
                {c.dontStore.whySecure.points.map((p) => (
                  <li key={p} className="flex items-start gap-2"><span className="text-emerald-600 mt-0.5">&#10003;</span> {p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* If Compelled by Law. Canonical "what can be disclosed" block, linked
          from How-it-works and For Law Firms as <security>#legal */}
      <section id="legal" className="py-16 bg-white/50 backdrop-blur-sm scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.legal.heading}</h2>
          <p className="text-gray-600 mb-8">{c.legal.intro}</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h3 className="font-semibold text-amber-800 mb-4 text-lg">{c.legal.canHeading}</h3>
              <ul className="space-y-3 text-sm text-amber-900">
                {c.legal.can.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">&#9679;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <h3 className="font-semibold text-emerald-800 mb-4 text-lg">{c.legal.cannotHeading}</h3>
              <ul className="space-y-3 text-sm text-emerald-900">
                {c.legal.cannot.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">&#9679;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-6">
            <p className="text-emerald-800 font-semibold text-sm mb-2">{c.legal.whySecure.label}</p>
            <ul className="space-y-1.5 text-sm text-emerald-800">
              {c.legal.whySecure.points.map((p) => (
                <li key={p} className="flex items-start gap-2"><span className="text-emerald-600 mt-0.5">&#10003;</span> {p}</li>
              ))}
            </ul>
          </div>

          <div id="chat-control" className="bg-white rounded-xl shadow-sm p-6 mt-8 border-l-4 border-emerald-500 scroll-mt-20">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{c.chatControl.heading}</h3>
            <p className="text-gray-700 text-sm mb-3"><Rich parts={c.chatControl.p1} /></p>
            <p className="text-gray-700 text-sm mb-3">{c.chatControl.p2}</p>
            <p className="text-gray-500 text-xs">{c.chatControl.reviewed}</p>
          </div>
        </div>
      </section>

      {/* Auto-Delete */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.autoDelete.heading}</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <p className="text-gray-600 mb-4">{c.autoDelete.p1}</p>
            <p className="text-gray-600 mb-4">{c.autoDelete.p2}</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 font-medium mb-2">{c.autoDelete.noBackupsTitle}</p>
              <p className="text-gray-500 text-sm">{c.autoDelete.noBackupsBody}</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-6">
              <p className="text-emerald-800 font-semibold text-sm mb-2">{c.autoDelete.whySecure.label}</p>
              <ul className="space-y-1.5 text-sm text-emerald-800">
                {c.autoDelete.whySecure.points.map((p) => (
                  <li key={p} className="flex items-start gap-2"><span className="text-emerald-600 mt-0.5">&#10003;</span> {p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Email Handling */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.email.heading}</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <p className="text-gray-600 mb-4"><Rich parts={c.email.intro} /></p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              {c.email.steps.map((step, i) => (
                <li key={i}><Rich parts={step} /></li>
              ))}
            </ol>
            <p className="text-gray-600"><Rich parts={c.email.outro} /></p>
          </div>
        </div>
      </section>

      {/* Abuse Prevention */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.abuse.heading}</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="space-y-4 text-gray-600">
              {c.abuse.points.map((p) => (
                <p key={p.label}><strong>{p.label}:</strong> {p.text}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.infra.heading}</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="grid sm:grid-cols-2 gap-4">
              {c.infra.items.map((item) => (
                <div key={item.label} className="flex items-start gap-3 py-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-900 font-medium text-sm">{item.label}</span>
                    <p className="text-gray-500 text-sm">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CtaBanner
        lang={lang}
        heading={c.cta.heading}
        sub={c.cta.sub}
        primaryLabel={c.cta.primaryLabel}
        secondaryLabel="security@hushroom.io"
        secondaryTo="mailto:security@hushroom.io"
      />
    </div>
  );
}
