import { Link } from 'react-router-dom';
import { ArrowRight, Globe, Check, X, Minus } from 'lucide-react';
import type { LandingCopy } from './landing-copy';
import { pathFor } from './routes';
import { ServerViewDemo } from './ServerViewDemo';

// Marketing sections rendered on the landing page when the user is not in a
// room. All strings come from landing-copy.ts so "/" (sv) and "/en" can't
// drift; only the illustrations/icons are hard-coded here.
const CARD_ICONS = [
  // End-to-end encrypted (shield + padlock)
  <svg key="shield" width="28" height="28" viewBox="0 0 80 80" fill="none">
    <path d="M40 6 L66 20 L66 42 C66 58, 54 70, 40 76 C26 70, 14 58, 14 42 L14 20 Z" stroke="#fff" strokeWidth="4" fill="none" strokeLinejoin="round"/>
    <rect x="30" y="38" width="20" height="16" rx="3" fill="#fff"/>
    <path d="M34 38 L34 32 C34 26, 46 26, 46 32 L46 38" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    <circle cx="40" cy="46" r="2.5" fill="#10B981"/>
    <rect x="39" y="47" width="2.5" height="4" rx="0.5" fill="#10B981"/>
  </svg>,
  // Self-destructing rooms (timer dissolving)
  <svg key="timer" width="28" height="28" viewBox="0 0 80 80" fill="none">
    <path d="M62 40 A22 22 0 1 0 40 62" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <line x1="40" y1="40" x2="40" y2="24" stroke="#fff" strokeWidth="4" strokeLinecap="round"/>
    <line x1="40" y1="40" x2="52" y2="40" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"/>
    <circle cx="40" cy="40" r="3" fill="#fff"/>
    <circle cx="56" cy="56" r="3" fill="#fff" opacity="0.7"/>
    <circle cx="50" cy="62" r="2.5" fill="#fff" opacity="0.45"/>
    <circle cx="62" cy="50" r="2" fill="#fff" opacity="0.3"/>
    <circle cx="58" cy="64" r="2" fill="#fff" opacity="0.15"/>
  </svg>,
  // No sign-up (link + no-account)
  <svg key="link" width="28" height="28" viewBox="0 0 80 80" fill="none">
    <path d="M34 46 L28 52 C22 58, 22 58, 16 52 C10 46, 10 46, 16 40 L24 32 C30 26, 30 26, 36 32" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <path d="M46 34 L52 28 C58 22, 58 22, 64 28 C70 34, 70 34, 64 40 L56 48 C50 54, 50 54, 44 48" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <line x1="32" y1="48" x2="48" y2="32" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M58 56 L58 70 L63 65 L69 72" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
];

const TONE_ICON = {
  good: <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />,
  bad: <X size={14} className="text-red-500 shrink-0 mt-0.5" aria-hidden="true" />,
  mixed: <Minus size={14} className="text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />,
};

const TONE_TEXT = { good: 'text-emerald-700', bad: 'text-gray-600', mixed: 'text-gray-600' };

export function LandingMarketingSections({ copy }: { copy: LandingCopy }) {
  const { how, features, situations, compare, testimonial } = copy;
  // Hushroom is the last column in the data but must be the first data column
  // on screen (on mobile the rest scrolls out of view — see the same fix on
  // ForLawFirmsPage).
  const order = [compare.columns.length - 1, ...compare.columns.map((_, i) => i).slice(0, -1)];

  return (
    <>
      {/* How it works */}
      <section id="how-it-works" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{how.heading}</h2>
            <p className="text-lg text-gray-600">{how.sub}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {how.steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-lg">{i + 1}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to={pathFor('howItWorks', copy.lang)} className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors">
              {how.more}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="security" className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{features.heading}</h2>
            <p className="text-lg text-gray-600">{features.sub}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.cards.map((card, i) => (
              <div key={card.title} className="group p-8 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {CARD_ICONS[i % CARD_ICONS.length]}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{card.title}</h3>
                <p className="text-gray-600">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof of the claim the feature cards just made. */}
      <ServerViewDemo copy={copy} />

      {/* Situations — full-bleed photo */}
      <section id="legal-professionals" className="relative overflow-hidden">
        <img
          src="/img/legal-phone-window.webp"
          alt={situations.imageAlt}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(4,32,24,0.92) 0%, rgba(4,32,24,0.78) 55%, rgba(4,32,24,0.5) 100%)' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300 mb-4">{situations.eyebrow}</p>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">{situations.heading}</h3>
            <p className="text-lg text-emerald-50/85 mb-8">{situations.intro}</p>

            <div className="grid sm:grid-cols-3 gap-5 mb-8">
              {situations.items.map((item) => (
                <div key={item.title} className="bg-white/10 border border-white/20 rounded-xl p-5 backdrop-blur-sm">
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-emerald-50/80">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-8">
              {situations.chips.map((chip) => (
                <span key={chip} className="px-4 py-2 bg-white/10 text-white rounded-full text-sm font-medium border border-white/25 backdrop-blur-sm">{chip}</span>
              ))}
            </div>
            <Link to={pathFor('lawFirms', copy.lang)} className="inline-flex items-center gap-2 text-emerald-300 hover:text-white font-semibold transition-colors">
              {situations.lawFirmsLink}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Why not just Teams? */}
      <section id="compare" className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{compare.heading}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{compare.sub}</p>
          </div>

          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left font-semibold text-gray-700 px-4 py-4 w-44"> </th>
                  {order.map((idx, pos) => (
                    <th
                      key={compare.columns[idx]}
                      className={`text-left font-semibold px-4 py-4 ${pos === 0 ? 'text-emerald-700 bg-emerald-50/70' : 'text-gray-500'}`}
                    >
                      {compare.columns[idx]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compare.rows.map((row) => (
                  <tr key={row.label} className="border-b border-gray-50 last:border-0 align-top">
                    <th scope="row" className="text-left font-medium text-gray-900 px-4 py-4">{row.label}</th>
                    {order.map((idx, pos) => {
                      const cell = row.cells[idx];
                      return (
                        <td key={idx} className={`px-4 py-4 ${pos === 0 ? 'bg-emerald-50/70' : ''}`}>
                          <span className={`flex items-start gap-1.5 ${TONE_TEXT[cell.tone]} ${pos === 0 ? 'font-medium' : ''}`}>
                            {TONE_ICON[cell.tone]}
                            <span>{cell.text}</span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 text-center mt-4">{compare.note}</p>
        </div>
      </section>

      {/* Testimonial */}
      <section id="use-case" className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-10">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Globe size={24} className="text-white" aria-hidden="true" />
            </div>
            <blockquote className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 italic">
              {testimonial.quote}
            </blockquote>
            <p className="text-sm text-gray-500 mt-2">{testimonial.attribution}</p>
            <p className="text-gray-500 mt-1">{testimonial.note}</p>
          </div>
        </div>
      </section>
    </>
  );
}
