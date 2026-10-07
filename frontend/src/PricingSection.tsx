import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getTiers } from './pricing-data';
import type { LandingCopy } from './landing-copy';
import { pathFor } from './routes';

// The 3-card pricing block (Free / Pro / Firm) on the landing page.
// Extracted from HushroomLandingPage.tsx in Sprint 14.1. Tier copy comes
// from pricing-data.ts (shared with /pricing and /for-law-firms).
//
// Uses callbacks from the parent so the parent owns auth state +
// modal-open logic; this component is pure markup + click-routing.
export interface PricingSectionProps {
  copy: LandingCopy;
  userTier: 'demo' | 'pro' | 'firm' | null;
  isCreatorVerified: () => boolean;
  onStartTrial: () => void;
  onCheckout: (tier: 'pro' | 'firm') => void;
  onCreateRoomClick: () => void;
  onEmailVerifyDemo: () => void;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-gray-600">
      {items.map((b) => (
        <li key={b} className="flex items-center gap-2"><span className="text-emerald-500">✓</span> {b}</li>
      ))}
    </ul>
  );
}

export function PricingSection({
  copy,
  userTier,
  isCreatorVerified,
  onStartTrial,
  onCheckout,
  onCreateRoomClick,
  onEmailVerifyDemo,
}: PricingSectionProps) {
  const { free, pro, firm } = getTiers(copy.lang);
  const t = copy.pricing;
  return (
    <section id="pricing" className="py-16 bg-gradient-to-br from-emerald-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.heading}</h2>
          <p className="text-lg text-gray-600">{t.sub}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">

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
            <button
              onClick={() => {
                if (isCreatorVerified()) onCreateRoomClick();
                else onEmailVerifyDemo();
              }}
              className="mt-auto w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-md"
            >
              {t.createRoom}
            </button>
          </div>

          {/* Pro */}
          <div className="p-8 rounded-xl bg-white shadow-xl border-2 border-emerald-500 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">{t.mostPopular}</span>
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
                {t.firmActive}
              </div>
            ) : userTier === 'pro' ? (
              <>
                <div className="mt-auto w-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold py-3 px-6 rounded-xl text-center mb-2">
                  {t.trialActive}
                </div>
                <button
                  onClick={() => onCheckout('pro')}
                  className="w-full border border-emerald-400 text-emerald-600 text-sm py-2 px-4 rounded-xl hover:bg-emerald-50 transition-all"
                >
                  {t.subscribeNow(pro.price)}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onStartTrial}
                  className="mt-auto w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-md"
                >
                  {t.trialLabel}
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">{t.trialNote}</p>
              </>
            )}
          </div>

          {/* Firm */}
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
              onClick={() => { window.location.href = '/get-started/firm'; }}
              className="mt-auto w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300"
            >
              {t.getStarted}
            </button>
          </div>

        </div>
        <div className="text-center mt-8">
          <Link to={pathFor('pricing', copy.lang)} className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors">
            {t.viewFull}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
