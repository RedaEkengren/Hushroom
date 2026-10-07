import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Rich, type RichText } from './rich-text';

// Shared renderer for the two long legal pages (/integritet and /villkor and
// their /en counterparts). Their copy is a list of sections built from blocks,
// which keeps the copy files flat and translatable and this component small.
export type LegalBlock =
  | { kind: 'p'; text: RichText }
  | { kind: 'labeled'; label: string; text: RichText }
  | { kind: 'list'; items: RichText[] }
  | { kind: 'callout'; tone: 'info' | 'warn' | 'danger'; title?: string; items?: RichText[]; text?: RichText }
  | { kind: 'table'; head?: string[]; rows: RichText[][]; firstColBold?: boolean }
  | { kind: 'twoCol'; left: { title: string; items: RichText[] }; right: { title: string; items: RichText[] } };

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalPageCopy {
  title: string;
  heroTitle: string;
  heroSubtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
  contact: { heading: string; items: { label: string; email: string }[]; linkLabel: string };
}

const CALLOUT_TONES = {
  info: 'bg-gray-50 border-gray-200',
  warn: 'bg-yellow-50 border-yellow-200',
  danger: 'bg-red-50 border-red-200',
} as const;

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case 'p':
      return <p className="text-gray-600"><Rich parts={block.text} /></p>;
    case 'labeled':
      return <p className="text-gray-600"><strong>{block.label}:</strong> <Rich parts={block.text} /></p>;
    case 'list':
      return (
        <ul className="space-y-3 text-gray-700">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">&#10007;</span>
              <span><Rich parts={item} /></span>
            </li>
          ))}
        </ul>
      );
    case 'callout':
      return (
        <div className={`border rounded-lg p-4 ${CALLOUT_TONES[block.tone]}`}>
          {block.title && <p className="font-semibold text-gray-900 mb-2">{block.title}</p>}
          {block.text && <p className="text-gray-700"><Rich parts={block.text} /></p>}
          {block.items && (
            <ul className="space-y-3 text-gray-700 mt-2">
              {block.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">&#10007;</span>
                  <span><Rich parts={item} /></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {block.head && (
              <thead>
                <tr className="border-b border-gray-200">
                  {block.head.map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-semibold text-gray-900">{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="text-gray-600">
              {block.rows.map((row, i) => (
                <tr key={i} className={i < block.rows.length - 1 ? 'border-b border-gray-100' : ''}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={`py-3 px-4 ${block.firstColBold && j === 0 ? 'font-medium text-gray-900 whitespace-nowrap' : ''}`}
                    >
                      <Rich parts={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'twoCol':
      return (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
            <p className="font-semibold text-emerald-800 mb-3">{block.left.title}</p>
            <ul className="space-y-2 text-sm text-emerald-700">
              {block.left.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="mt-0.5">&#10003;</span> <span><Rich parts={item} /></span></li>
              ))}
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
            <p className="font-semibold text-amber-800 mb-3">{block.right.title}</p>
            <ul className="space-y-2 text-sm text-amber-700">
              {block.right.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="mt-0.5">&#10007;</span> <span><Rich parts={item} /></span></li>
              ))}
            </ul>
          </div>
        </div>
      );
  }
}

export function LegalPage({ copy, footerLinkTo }: { copy: LegalPageCopy; footerLinkTo: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-yellow-50 pt-16">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-green-600/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-emerald-600 to-green-800 bg-clip-text text-transparent">
              {copy.heroTitle}
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">{copy.heroSubtitle}</p>
          <p className="text-sm text-gray-400">{copy.lastUpdated}</p>
        </div>
      </header>

      {copy.sections.map((section, i) => (
        <section key={section.heading} className={`py-16 ${i % 2 === 1 ? 'bg-white/50 backdrop-blur-sm' : ''}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{section.heading}</h2>
            <div className="bg-white rounded-xl shadow-sm p-8 space-y-4">
              {section.blocks.map((block, j) => <Block key={j} block={block} />)}
            </div>
          </div>
        </section>
      ))}

      {/* Contact */}
      <section className="py-16 bg-gradient-to-br from-emerald-500/10 to-green-600/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{copy.contact.heading}</h2>
          <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
            {copy.contact.items.map((item) => (
              <div key={item.email} className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">{item.label}</h3>
                <a href={`mailto:${item.email}`} className="text-emerald-600 hover:text-emerald-700">{item.email}</a>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              to={footerLinkTo}
              className="inline-flex items-center gap-2 border border-emerald-300 text-emerald-700 font-semibold py-3 px-8 rounded-xl hover:bg-emerald-50 transition-all duration-300"
            >
              {copy.contact.linkLabel}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
