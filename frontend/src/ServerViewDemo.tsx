import { useEffect, useState } from 'react';
import { Database, Monitor, Radio } from 'lucide-react';
import type { LandingCopy } from './landing-copy';
import {
  DEMO_EMAIL_HASH,
  DEMO_TTL_SECONDS,
  TTL_NO_KEY,
  chunk,
  participantsKey,
  roomKey,
  roomsByEmailKey,
  storedMessageFor,
  truncate,
  wireRecordFor,
} from './demo-data';
import { useDemoSequence } from './useDemoSequence';

// Component B: one moment, three views, across the whole life of a room.
//
// Everything on screen is sourced, not invented (demo-data.ts documents the
// derivation). The two details that matter most:
//
//   - the relayed envelope has no `text` field at all; only the stored record
//     has one, and its value is the literal string [encrypted]
//   - the three keys are the three keys createRoom() actually writes, with the
//     TTL it actually sets
//
// The last frame is the whole product: GET returns (nil) and TTL returns -2,
// because the key expired on its own rather than being deleted by anyone.

const STEP_MS = 2400;

/**
 * One slot per step of the loop. 'live' is the frame where all three columns
 * are populated, so it is also the reduced-motion and prerendered frame: the
 * empty post-expiry frame does not explain itself without the animation that
 * leads up to it. 'gone' gets two slots so the loop holds on it.
 */
const PHASES = ['fill1', 'fill2', 'fill3', 'live', 'later', 'gone', 'gone'] as const;
type Phase = (typeof PHASES)[number];

const SHOWN_BY_PHASE: Record<Phase, number> = {
  fill1: 1,
  fill2: 2,
  fill3: 3,
  live: 3,
  later: 3,
  gone: 0,
};

function Panel({
  label,
  icon,
  dark = false,
  minH,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  dark?: boolean;
  /** Reserved body height. Per panel on mobile, shared on desktop (the row stretches anyway). */
  minH: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl shadow-sm overflow-hidden flex flex-col ${
        dark ? 'bg-gray-900' : 'bg-white border border-gray-100'
      }`}
    >
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${dark ? 'border-white/10' : 'border-gray-100'}`}>
        {icon}
        <span className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{label}</span>
      </div>
      {/* Reserves the tallest phase so the loop never resizes the page under the
          reader. Stacked on mobile each panel reserves only what it needs; side
          by side on desktop the row stretches to the tallest anyway, which is
          the wire panel. The numbers are measured across 320 to 1600px, with
          headroom, and want re-measuring if the demo copy changes length. */}
      <div className={`p-4 flex-1 ${minH} md:min-h-[704px]`}>{children}</div>
    </div>
  );
}

/** One JSON field line, so a record reads as data rather than as prose. */
function Field({ name, children, comma = true }: { name: string; children: React.ReactNode; comma?: boolean }) {
  return (
    <span className="block pl-3">
      <span className="text-sky-300">"{name}"</span>
      <span className="text-gray-500">: </span>
      {children}
      {comma && <span className="text-gray-500">,</span>}
    </span>
  );
}

/** A redis-cli prompt line. */
function Cmd({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-gray-500 mt-3 first:mt-0">
      <span className="text-emerald-400 select-none">&gt; </span>
      <span className="text-gray-300 break-all">{children}</span>
    </p>
  );
}

export function ServerViewDemo({ copy }: { copy: LandingCopy }) {
  const t = copy.serverView;
  const { ref, step, isStatic, running } = useDemoSequence<HTMLDivElement>(PHASES.length, STEP_MS);
  const phase: Phase = isStatic ? 'live' : (PHASES[step] ?? 'live');
  const visible = t.messages.slice(0, SHOWN_BY_PHASE[phase]);
  const gone = phase === 'gone';
  // The placeholder in the GET value comes from the same helper the unit tests
  // pin to the backend's literal, so this line cannot drift from the code.
  const storedPlaceholder = storedMessageFor(t.messages[0], 0).text;
  // The room id comes from the copy so both demos on the page name the same
  // room, in whichever language the page is in.
  const room = roomKey(t.roomId);

  // The TTL ticks in real seconds while the room is live, which is exactly what
  // Redis does. The jump to the last seconds is labelled rather than faked by
  // running a 3600 second countdown to zero in three seconds.
  const [ttl, setTtl] = useState(DEMO_TTL_SECONDS);
  useEffect(() => {
    if (!running || phase !== 'live') {
      if (phase !== 'live') setTtl(DEMO_TTL_SECONDS);
      return;
    }
    const timer = window.setInterval(() => setTtl((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running, phase]);

  const [tail, setTail] = useState(3);
  useEffect(() => {
    if (!running || phase !== 'later') {
      setTail(3);
      return;
    }
    const timer = window.setInterval(() => setTail((v) => Math.max(0, v - 1)), 650);
    return () => window.clearInterval(timer);
  }, [running, phase]);

  const shownTtl = phase === 'later' ? tail : ttl;

  return (
    <section id="server-view" className="py-16">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{t.heading}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t.sub}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          {/* 1. The browser: the only place the words exist. */}
          <Panel
            label={t.browserLabel}
            minH="min-h-[264px]"
            icon={<Monitor size={16} className="text-emerald-600" aria-hidden="true" />}
          >
            {/* An empty panel on its own reads as a broken page. One muted line
                turns the emptiness into the thing being demonstrated. */}
            {gone && <p className="text-sm text-gray-400 demo-fade-up">{t.goneBrowser}</p>}
            <ul className="space-y-3">
              {visible.map((message, i) => (
                <li key={message.text} className={`flex ${i % 2 === 1 ? 'justify-end' : 'justify-start'} demo-fade-up`}>
                  <span className="max-w-[90%]">
                    <span className="block text-[11px] text-gray-400 mb-1 px-1">{message.sender}</span>
                    <span
                      className={`inline-block text-sm px-3 py-2 rounded-2xl ${
                        i % 2 === 1 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.text}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          {/* 2. The wire: the relayed envelope, which carries no text field. */}
          <Panel
            label={t.wireLabel}
            dark
            minH="min-h-[704px]"
            icon={<Radio size={16} className="text-emerald-400" aria-hidden="true" />}
          >
            {gone && <p className="font-mono text-[11px] text-gray-500 demo-fade-up">{t.goneWire}</p>}
            <ul className="space-y-3 font-mono text-[11px] leading-relaxed">
              {visible.map((message, i) => {
                const record = wireRecordFor(message, i);
                return (
                  <li key={message.text} className="demo-fade-up text-gray-400">
                    <span className="text-gray-600">{'{'}</span>
                    <Field name="user">
                      <span className="text-amber-200">"{record.user}"</span>
                    </Field>
                    <Field name="ciphertext">
                      <span className="text-emerald-300/80">
                        "
                        {chunk(record.ciphertext, 32).map((line, j) => (
                          <span key={line + j} className="block pl-2">
                            {line}
                          </span>
                        ))}
                        "
                      </span>
                    </Field>
                    <Field name="nonce">
                      <span className="text-emerald-300/80 break-all">"{record.nonce}"</span>
                    </Field>
                    <Field name="timestamp" comma={false}>
                      <span className="text-purple-300">{record.timestamp}</span>
                    </Field>
                    <span className="text-gray-600">{'}'}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {/* 3. The database: the three real keys, and then their absence. */}
          <Panel
            label={t.dbLabel}
            dark
            minH="min-h-[360px]"
            icon={<Database size={16} className="text-emerald-400" aria-hidden="true" />}
          >
            <div className="font-mono text-[11px] leading-relaxed">
              <Cmd>KEYS hushroom:*</Cmd>
              {gone ? (
                <p className="text-gray-500 pl-3 demo-fade-up">(empty array)</p>
              ) : (
                <ol className="pl-3 text-gray-400 space-y-0.5">
                  {[room, participantsKey(t.roomId), roomsByEmailKey(truncate(DEMO_EMAIL_HASH, 8))].map((key, i) => (
                    <li key={key} className="break-all">
                      <span className="text-gray-600">{i + 1}) </span>
                      <span className="text-emerald-300/90">"{key}"</span>
                    </li>
                  ))}
                </ol>
              )}

              <Cmd>GET {room}</Cmd>
              {gone ? (
                <p className="text-red-400 pl-3 text-base font-semibold demo-fade-up">(nil)</p>
              ) : (
                <p className="pl-3 text-gray-400 break-all demo-fade-up">
                  <span className="text-gray-500">"{'{'}</span>
                  <span>"id":"{t.roomId}",…,"messages":[{'{'}…</span>
                  <span className="text-amber-200 font-semibold">"text":"{storedPlaceholder}"</span>
                  <span>…{'}'}]</span>
                  <span className="text-gray-500">{'}'}"</span>
                </p>
              )}

              <Cmd>TTL {room}</Cmd>
              <p className="pl-3">
                <span className="text-gray-500">(integer) </span>
                <span className={gone ? 'text-red-400 font-semibold' : 'text-purple-300 font-semibold'}>
                  {gone ? TTL_NO_KEY : shownTtl}
                </span>
              </p>

              {phase === 'later' && <p className="mt-4 text-gray-500 italic demo-fade-up">{t.laterLabel}</p>}
            </div>
            {gone && (
              <p className="demo-fade-up mt-5 text-sm leading-relaxed text-emerald-200 border-t border-white/10 pt-4">
                {t.goneLine}
              </p>
            )}
          </Panel>
        </div>

        <p className="text-sm text-gray-500 max-w-3xl mx-auto text-center mt-6 leading-relaxed">{t.caption}</p>
      </div>
    </section>
  );
}
