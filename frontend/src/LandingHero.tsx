import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import type { RecentRoom } from './recent-rooms';
import type { LandingCopy } from './landing-copy';
import { LinkFlowStage, LinkFlowSteps, LinkFlowStoryboard, useLinkFlow } from './LinkFlowDemo';

// Landing-page hero: full-bleed photo (silhouettes behind frosted glass)
// under a dark green overlay, headline and primary CTA on the left, the live
// room animation on the right, and the five steps it illustrates underneath.
//
// The animation used to be a section of its own, directly below, on the same
// photo with the same overlay: one section cut in two. Merging them puts the
// demonstration above the fold, where it is the argument rather than a reward
// for scrolling, and loads the photo once.
//
// The h1 text is asserted by e2e ("Secure conversations" / "Zero trace") and
// the hero must stay a <header> containing the two subtitle sentences.
export interface LandingHeroProps {
  copy: LandingCopy;
  onCreateClick: () => void;
  recentRooms: RecentRoom[];
  onRemoveRecent: (roomId: string) => void;
}

export function LandingHero({ copy, onCreateClick, recentRooms, onRemoveRecent }: LandingHeroProps) {
  const t = copy.hero;
  const flow = copy.linkFlow;
  const { ref, step, isStatic, running } = useLinkFlow();

  return (
    <header className="relative overflow-hidden -mt-16 pt-16">
      <img
        src="/img/hero-frosted-doors.webp"
        alt={t.heroImageAlt}
        className="absolute inset-0 w-full h-full object-cover"
        fetchPriority="high"
        decoding="async"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(6,40,30,0.55) 0%, rgba(6,40,30,0.72) 55%, rgba(4,30,22,0.94) 100%)' }}
      />

      {/* id and ref both belong here: the whole merged block is the link-flow
          demo as far as the tests and the visibility observer are concerned. */}
      <div id="link-flow" ref={ref} className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        {/* Two columns only when there is an animation to put in the second
            one. Under reduced motion the storyboard below carries the demo, so
            a half-empty hero would be the only thing the grid achieved. */}
        <div className={`grid gap-6 lg:gap-12 items-center ${isStatic ? '' : 'lg:grid-cols-[1.1fr_1fr]'}`}>
          <div className={`text-center text-white ${isStatic ? '' : 'lg:text-left'}`}>
            <div className={`flex items-center justify-center mb-6 ${isStatic ? '' : 'lg:justify-start'}`}>
              <img
                src="/logo.webp"
                alt=""
                aria-hidden="true"
                className="h-12 w-auto rounded-xl shadow-xl ring-2 ring-white/40"
              />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[2.75rem] xl:text-[3.25rem] font-bold tracking-tight mb-6 drop-shadow-sm text-balance">
              {t.line1}
              <br />
              <span className="text-emerald-300">{t.line2}</span>
            </h1>
            <div className={`text-lg md:text-xl text-emerald-50/90 mb-8 max-w-2xl mx-auto leading-relaxed ${isStatic ? '' : 'lg:mx-0'}`}>
              <p className="mb-3">{t.sub1}</p>
              <p className="text-base text-emerald-100/75">{t.sub2}</p>
            </div>

            <div className={`max-w-md mx-auto ${isStatic ? '' : 'lg:mx-0'}`}>
              <button
                onClick={onCreateClick}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-lg shadow-xl shadow-emerald-900/40"
              >
                {t.cta}
                <ArrowRight size={20} />
              </button>
              <p className="text-sm text-emerald-100/75 mt-4">{t.micro}</p>

              {recentRooms.length > 0 && (
                <div className="mt-8 text-left bg-white/95 backdrop-blur-sm border border-emerald-100 rounded-xl p-4 shadow-lg">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{t.recentTitle}</h2>
                  <ul className="space-y-1">
                    {recentRooms.map(room => {
                      const minutesLeft = Math.max(0, Math.round((room.expiresAt - Date.now()) / 60000));
                      return (
                        <li key={room.roomId} className="flex items-center justify-between gap-2 py-1.5 group">
                          <Link
                            to={`/r/${room.roomId}`}
                            className="flex-1 min-w-0 flex items-center gap-2 text-sm text-gray-700 hover:text-emerald-700 truncate"
                          >
                            <span className="truncate font-medium">{room.name}</span>
                            <span className="text-xs text-gray-400 shrink-0">{t.recentMinutesLeft(minutesLeft)}</span>
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              onRemoveRecent(room.roomId);
                            }}
                            className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={t.recentRemove}
                            title={t.recentRemove}
                          >
                            <X size={14} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-[11px] text-gray-400 mt-2">{t.recentNote}</p>
                </div>
              )}
            </div>
          </div>

          {/* The animation only has a column of its own when there is room for
              one. Stacked, it sits between the CTA and the steps it explains. */}
          {!isStatic && <LinkFlowStage copy={flow} step={step} running={running} />}
        </div>

        <div className="mt-12 md:mt-16">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{flow.heading}</h2>
            <p className="text-emerald-50/85">{flow.sub}</p>
          </div>
          {isStatic ? <LinkFlowStoryboard copy={flow} /> : <LinkFlowSteps copy={flow} step={step} />}
          <p className="text-center text-xs text-white/45 mt-6">{flow.exampleBadge}</p>
        </div>
      </div>
    </header>
  );
}
