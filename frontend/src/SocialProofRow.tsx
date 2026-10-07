import { ShieldCheck, MapPin, EyeOff, Video } from 'lucide-react';

// Slim factual trust row directly under the landing hero (the equivalent of
// TrackOne's "Aktuella uppdrag" logo strip). No customer logos — we don't
// have any yet; every item here is a verifiable property of the product.
// Text comes from landing-copy.ts so it can be sv/en; the icon order is fixed.
const ICONS = [ShieldCheck, MapPin, EyeOff, Video];

export interface SocialProofRowProps {
  items: { title: string; sub: string }[];
  label?: string;
}

export function SocialProofRow({ items, label = 'Why Hushroom' }: SocialProofRowProps) {
  return (
    <section aria-label={label} className="bg-white border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
          {items.map(({ title, sub }, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900 leading-tight">{title}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">{sub}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
