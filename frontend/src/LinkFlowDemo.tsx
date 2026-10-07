import { Lock, Link2, Users, Timer } from 'lucide-react';
import type { LandingCopy } from './landing-copy';
import { formatCountdown } from './demo-data';
import { useDemoSequence, useTypewriter } from './useDemoSequence';

// Component A: the link flow. Five looping steps that show what actually
// happens to a room, ending on the one frame no competitor can show: the room
// being gone.
//
// This lives in the hero rather than in a section of its own (LandingHero.tsx
// composes it), so the parts are exported separately: the hero puts the stage
// beside the headline and the step strip underneath. useLinkFlow() owns the
// sequence they share.
//
// Under prefers-reduced-motion (and therefore in the prerendered markup, since
// the prerender runs chromium with reducedMotion: 'reduce') the hero renders
// the static storyboard of all five steps instead. That is more informative as
// a still than the last frame would be on its own, and it is real indexable
// text rather than an animation a crawler cannot see.

const STEP_MS = 2500;
const STEP_COUNT = 5;
/** Matches the 60 minute room in the copy; rendered as mm:ss at both ends of the loop. */
const ROOM_SECONDS = 60 * 60;

interface StageProps {
  copy: LandingCopy['linkFlow'];
  step: number;
  running: boolean;
}

/** Small reusable card so every step shares the hero's card treatment. */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/95 backdrop-blur-sm border border-emerald-100 rounded-xl shadow-xl ${className}`}>
      {children}
    </div>
  );
}

function Avatar({ initial, tone = 'emerald' }: { initial: string; tone?: 'emerald' | 'slate' }) {
  const toneClass = tone === 'emerald' ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white';
  return (
    <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${toneClass}`}>
      {initial}
    </span>
  );
}

function StepCreated({ copy }: StageProps) {
  return (
    <Card className="w-full max-w-sm p-5 demo-fade-up">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="font-semibold text-gray-900">{copy.room.name}</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
          <Lock size={12} aria-hidden="true" />
          E2EE
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <Users size={15} className="text-emerald-600" aria-hidden="true" />
          {copy.room.participants}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono">
          <Timer size={15} className="text-emerald-600" aria-hidden="true" />
          {formatCountdown(ROOM_SECONDS)}
        </span>
      </div>
    </Card>
  );
}

function StepLink({ copy, running }: StageProps) {
  const typed = useTypewriter(copy.url.base + copy.url.fragment, running);
  const baseShown = typed.slice(0, Math.min(typed.length, copy.url.base.length));
  const fragmentShown = typed.length > copy.url.base.length ? typed.slice(copy.url.base.length) : '';

  return (
    <Card className="w-full max-w-xl p-5 demo-fade-up">
      <div className="flex items-start gap-3">
        <Link2 size={18} className="text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
        <p className="font-mono text-sm sm:text-base break-all leading-relaxed">
          <span className="text-gray-700">{baseShown}</span>
          <span className="text-emerald-600 font-semibold">{fragmentShown}</span>
          {running && <span className="demo-caret text-emerald-600">|</span>}
        </p>
      </div>
    </Card>
  );
}

function StepShared({ copy }: StageProps) {
  return (
    <div className="w-full max-w-sm demo-fade-up">
      <div className="flex items-center justify-between gap-3">
        <Avatar initial="A" />
        <div className="flex-1 relative h-9 flex items-center">
          <span className="absolute inset-x-0 border-t border-dashed border-white/35" aria-hidden="true" />
          <span className="demo-travel relative mx-auto inline-flex items-center gap-1.5 bg-white text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
            <Link2 size={12} aria-hidden="true" />
            {copy.room.name}
          </span>
        </div>
        <Avatar initial="J" tone="slate" />
      </div>
      <p className="text-center text-sm text-emerald-50/85 mt-4">{copy.share}</p>
    </div>
  );
}

function StepTalking({ copy }: StageProps) {
  return (
    <Card className="w-full max-w-sm p-4 demo-fade-up">
      <ul className="space-y-2.5">
        {copy.messages.map((message, i) => {
          const mine = i % 2 === 1;
          return (
            <li
              key={message}
              className={`flex ${mine ? 'justify-end' : 'justify-start'} demo-fade-up`}
              style={{ animationDelay: `${i * 420}ms` }}
            >
              <span
                className={`inline-flex items-center gap-1.5 max-w-[85%] text-sm px-3 py-2 rounded-2xl ${
                  mine ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message}
                <Lock size={11} className={mine ? 'text-white/80 shrink-0' : 'text-gray-400 shrink-0'} aria-hidden="true" />
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function StepGone({ copy }: StageProps) {
  return (
    <div className="w-full max-w-sm text-center">
      <div className="demo-dissolve">
        <Card className="p-5">
          <span className="font-semibold text-gray-900">{copy.room.name}</span>
          <p className="font-mono text-2xl text-red-500 mt-2">{formatCountdown(0)}</p>
        </Card>
      </div>
      <p
        className="demo-fade-up text-white font-medium mt-6"
        style={{ animationDelay: '900ms' }}
      >
        {copy.gone}
      </p>
    </div>
  );
}

const STAGES = [StepCreated, StepLink, StepShared, StepTalking, StepGone];

/** The sequence the stage and the step strip share. Attach `ref` to whatever gates visibility. */
export function useLinkFlow() {
  return useDemoSequence<HTMLDivElement>(STEP_COUNT, STEP_MS);
}

/**
 * The animated card. Decorative: the step strip below it is the real text, so
 * this is hidden from assistive technology rather than read out mid-change.
 */
export function LinkFlowStage({ copy, step, running }: { copy: LandingCopy['linkFlow']; step: number; running: boolean }) {
  const Stage = STAGES[step] ?? STAGES[0];
  return (
    /* 200px reserves the tallest frame (the chat bubbles, measured at 182px
       down to 320px wide in both languages) so the loop never resizes the
       hero, without leaving a hole the rest of the time. */
    <div aria-hidden="true" className="flex items-center justify-center min-h-[200px]">
      <Stage copy={copy} step={step} running={running} />
    </div>
  );
}

/** The five steps, as a list. Always in the DOM, so all five captions are indexable. */
export function LinkFlowSteps({ copy, step }: { copy: LandingCopy['linkFlow']; step: number }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-5 max-w-5xl mx-auto">
      {copy.steps.map((entry, i) => {
        const current = i === step;
        return (
          <li
            key={entry.label}
            className={`rounded-xl border p-3 transition-colors duration-500 ${
              current ? 'bg-white/15 border-emerald-300/50' : 'bg-white/5 border-white/10'
            }`}
            aria-current={current ? 'step' : undefined}
          >
            <span
              className={`inline-flex w-6 h-6 rounded-full text-xs font-semibold items-center justify-center mb-2 transition-colors duration-500 ${
                current ? 'bg-emerald-400 text-emerald-950' : 'bg-white/15 text-white/70'
              }`}
            >
              {i + 1}
            </span>
            <h3 className={`text-sm font-semibold mb-1 ${current ? 'text-white' : 'text-white/70'}`}>
              {entry.label}
            </h3>
            <p className={`text-xs leading-relaxed ${current ? 'text-emerald-50/85' : 'text-white/45'}`}>
              {entry.caption}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/** Static storyboard: what a reduced-motion user and a crawler get. */
export function LinkFlowStoryboard({ copy }: { copy: LandingCopy['linkFlow'] }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 max-w-6xl mx-auto">
      {copy.steps.map((step, i) => (
        <li key={step.label} className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm">
          <span className="inline-flex w-7 h-7 rounded-full bg-emerald-500 text-white text-sm font-semibold items-center justify-center mb-3">
            {i + 1}
          </span>
          <h3 className="text-white font-semibold text-sm mb-1.5">{step.label}</h3>
          <p className="text-emerald-50/80 text-sm leading-relaxed">{step.caption}</p>
          {i === 1 && (
            <p className="font-mono text-xs break-all mt-3 text-emerald-100/80">
              {copy.url.base}
              <span className="text-emerald-300 font-semibold">{copy.url.fragment}</span>
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
