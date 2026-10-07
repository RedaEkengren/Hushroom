import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { isCreatorVerified } from './jwt-wrapper';
import { EmailVerification } from './EmailVerification';
import { usePricingState } from './usePricingState';
import { usePageTitle, useHtmlLang } from './usePageTitle';
import { PageHero } from './PageHero';
import { CtaBanner } from './CtaBanner';
import { getTiers } from './pricing-data';
import { langFromPath } from './landing-copy';
import { pathFor } from './routes';
import { PRICING_COPY } from './pricing-copy';

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-gray-600">
      {items.map((b) => (
        <li key={b} className="flex items-center gap-2"><span className="text-emerald-500">✓</span> {b}</li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  const lang = langFromPath(useLocation().pathname);
  const c = PRICING_COPY[lang];
  usePageTitle(c.title);
  useHtmlLang(lang);

  const { userTier, startTrial, checkout } = usePricingState();
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingTrialAfterVerify, setPendingTrialAfterVerify] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { free, pro, firm } = getTiers(lang);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStartTrial = async () => {
    if (!isCreatorVerified()) {
      setPendingTrialAfterVerify(true);
      setShowEmailVerification(true);
      return;
    }
    const result = await startTrial();
    if (result.success) {
      showToast(c.toasts.trialStarted, 'success');
    } else {
      showToast(result.error || c.toasts.trialFailed, 'error');
    }
  };

  const handleCheckout = async (tier: 'pro' | 'firm') => {
    const result = await checkout(tier);
    if (!result.success) {
      showToast(result.error || c.toasts.checkoutFailed, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-yellow-50 pt-16">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white text-sm font-medium`}>
          {toast.message}
        </div>
      )}

      {/* Hero */}
      <PageHero
        image="/img/pricing-office-skyline.webp"
        alt={c.heroAlt}
        title={c.heroTitle}
        subtitle={c.heroSubtitle}
      />

      {/* Pricing cards */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="p-8 rounded-xl bg-white shadow-lg border-2 border-emerald-200 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{free.name}</h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-4xl font-bold text-gray-900">{free.price}</span>
                  <span className="text-gray-500 mb-1">{free.period}</span>
                </div>
                <Bullets items={free.bullets} />
              </div>
              <Link
                to={pathFor('landing', lang)}
                className="mt-auto w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-md text-center"
              >
                {c.createRoom}
              </Link>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-xl bg-white shadow-xl border-2 border-emerald-500 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">{c.mostPopular}</span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{pro.name}</h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-4xl font-bold text-gray-900">{pro.price}</span>
                  <span className="text-gray-500 mb-1">{pro.period}</span>
                </div>
                <Bullets items={pro.bullets} />
              </div>
              {userTier === 'firm' ? (
                <div className="mt-auto w-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold py-3 px-6 rounded-xl text-center">
                  {c.firmActive}
                </div>
              ) : userTier === 'pro' ? (
                <>
                  <div className="mt-auto w-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold py-3 px-6 rounded-xl text-center mb-2">
                    {c.trialActive}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCheckout('pro')}
                    className="w-full border border-emerald-400 text-emerald-600 text-sm py-2 px-4 rounded-xl hover:bg-emerald-50 transition-all"
                  >
                    {c.subscribeNow(pro.price)}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleStartTrial}
                    className="mt-auto w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-md"
                  >
                    {c.trialLabel}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">{c.trialNote}</p>
                </>
              )}
            </div>

            {/* Organisation */}
            <div className="p-8 rounded-xl bg-white shadow-lg border-2 border-gray-200 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{firm.name}</h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-4xl font-bold text-gray-900">{firm.price}</span>
                  <span className="text-gray-500 mb-1">{firm.period}</span>
                </div>
                <Bullets items={firm.bullets} />
              </div>
              <button
                type="button"
                onClick={() => { window.location.href = '/get-started/firm'; }}
                className="mt-auto w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300"
              >
                {c.getStarted}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{c.faqHeading}</h2>
          <div className="space-y-3">
            {c.faqs.map((faq, i) => (
              <div key={faq.q} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ml-4 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className={`overflow-hidden transition-all duration-200 ${openFaq === i ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="px-5 pb-5 text-gray-600 text-sm">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <CtaBanner lang={lang} heading={c.cta.heading} sub={c.cta.sub} />

      {/* Email Verification Modal */}
      {showEmailVerification && (
        <EmailVerification
          planLabel={c.verifyPlanLabel}
          onVerified={async () => {
            setShowEmailVerification(false);
            if (pendingTrialAfterVerify) {
              setPendingTrialAfterVerify(false);
              const result = await startTrial();
              if (result.success) {
                showToast(c.toasts.trialStarted, 'success');
              } else {
                showToast(result.error || c.toasts.trialFailed, 'error');
              }
            }
          }}
          onCancel={() => {
            setPendingTrialAfterVerify(false);
            setShowEmailVerification(false);
          }}
        />
      )}
    </div>
  );
}
