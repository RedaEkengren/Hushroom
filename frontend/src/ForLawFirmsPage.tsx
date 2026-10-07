import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Shield, Users, Lock, Building2, BarChart3, Globe2, Scale, Handshake } from 'lucide-react';
import { usePageTitle, useHtmlLang } from './usePageTitle';
import { PageHero } from './PageHero';
import { CtaBanner } from './CtaBanner';
import { getTiers } from './pricing-data';
import { langFromPath } from './landing-copy';
import { pathFor } from './routes';
import { LAWFIRMS_COPY, type Tone } from './lawfirms-copy';

const PROBLEM_ICONS = [Scale, Handshake, Lock];
const FEATURE_ICONS = [Building2, BarChart3, Users, Globe2, Lock, Shield];

export default function ForLawFirmsPage() {
  const lang = langFromPath(useLocation().pathname);
  const c = LAWFIRMS_COPY[lang];
  usePageTitle(c.title);
  useHtmlLang(lang);

  const { pro, firm } = getTiers(lang);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-yellow-50 pt-16">
      {/* Hero */}
      <PageHero
        image="/img/lawfirms-table-city.webp"
        alt={c.heroAlt}
        title={c.heroTitle}
        subtitle={c.heroSubtitle}
      />

      {/* The Problem */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{c.problem.heading}</h2>
          <p className="text-gray-600 mb-8">{c.problem.intro}</p>
          <div className="grid md:grid-cols-3 gap-6">
            {c.problem.cards.map((card, i) => {
              const Icon = PROBLEM_ICONS[i % PROBLEM_ICONS.length];
              return (
                <div key={card.title} className="bg-white rounded-xl shadow-sm p-6">
                  <Icon className="text-emerald-600 mb-3" size={28} />
                  <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-gray-600 text-sm">{card.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison table. Hushroom is the FIRST data column so it is always in
          the first 390px on mobile (previously last, so it scrolled off-screen). */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{c.compare.heading}</h2>
          <p className="text-gray-600 mb-8">{c.compare.intro}</p>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">{c.compare.columns.feature}</th>
                    <th className="text-center py-3 px-4 font-semibold text-emerald-800 bg-emerald-50 border-x border-emerald-100">{c.compare.columns.hushroom}</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-500">{c.compare.columns.teams}</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-500">{c.compare.columns.signal}</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-500">{c.compare.columns.phone}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  {c.compare.rows.map((row, i) => (
                    <tr key={row.feature} className={i < c.compare.rows.length - 1 ? 'border-b border-gray-100' : ''}>
                      <td className="py-3 px-4 font-medium text-gray-900">{row.feature}</td>
                      <td className="py-3 px-4 text-center text-emerald-700 font-medium bg-emerald-50/60 border-x border-emerald-100">{row.hushroom}</td>
                      <td className={`py-3 px-4 text-center ${toneClass(row.teamsTone)}`}>{row.teams}</td>
                      <td className={`py-3 px-4 text-center ${toneClass(row.signalTone)}`}>{row.signal}</td>
                      <td className={`py-3 px-4 text-center ${toneClass(row.phoneTone)}`}>{row.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* How it works for your firm */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{c.how.heading}</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="grid md:grid-cols-3 gap-8">
              {c.how.steps.map((step, i) => (
                <div key={step.title} className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-lg">{i + 1}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What can be disclosed. Canonical version lives on <security>#legal */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{c.disclosure.heading}</h2>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <p className="text-gray-600 mb-4">{c.disclosure.body}</p>
            <Link to={`${pathFor('security', lang)}#legal`} className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors">
              {c.disclosure.link}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Organisation plan features */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{c.features.heading}</h2>
          <p className="text-gray-600 mb-8">{c.features.intro}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {c.features.cards.map((card, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
              return (
                <div key={card.title} className="bg-white rounded-xl shadow-sm p-6">
                  <Icon className="text-emerald-600 mb-3" size={24} />
                  <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                  <p className="text-gray-600 text-sm">{card.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing (Pro + Organisation from shared pricing-data) */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{c.pricing.heading}</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Pro */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{pro.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{pro.tagline}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{pro.price}</span>
                <span className="text-gray-500">{pro.period}</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                {[...pro.bullets, c.pricing.trialBullet].map((b) => (
                  <li key={b} className="flex items-start gap-2"><span className="text-emerald-500">&#10003;</span> {b}</li>
                ))}
              </ul>
              <Link
                to={pathFor('pricing', lang)}
                className="block w-full text-center border border-emerald-300 text-emerald-700 font-semibold py-3 rounded-xl hover:bg-emerald-50 transition-all duration-300"
              >
                {c.pricing.startTrial}
              </Link>
            </div>

            {/* Organisation */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-emerald-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">{c.pricing.recommended}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{firm.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{firm.tagline}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{firm.price}</span>
                <span className="text-gray-500">{firm.period}</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                {firm.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2"><span className="text-emerald-500">&#10003;</span> {b}</li>
                ))}
              </ul>
              <Link
                to="/get-started/firm"
                className="block w-full text-center bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg"
              >
                {c.pricing.getStarted}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CtaBanner lang={lang} sub={c.cta.sub} secondaryLabel={c.cta.secondaryLabel} secondaryTo="/get-started/firm" />
    </div>
  );
}

function toneClass(tone?: Tone): string {
  switch (tone) {
    case 'good': return 'text-emerald-600';
    case 'warn': return 'text-amber-500';
    case 'bad': return 'text-red-500';
    case 'na': return 'text-gray-400';
    default: return '';
  }
}
