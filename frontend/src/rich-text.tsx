import { Fragment } from 'react';
import { Link } from 'react-router-dom';

// Copy files are plain .ts so they stay easy to diff and translate, but some
// sentences need inline emphasis (bold, italic, inline code, links). A
// paragraph is therefore an array of segments: plain strings, or one of the
// tagged objects below. <Rich> renders them.
export type Seg =
  | string
  | { b: string }                        // bold
  | { i: string }                        // italic
  | { code: string }                     // inline code
  | { link: string; to: string }         // internal route
  | { link: string; href: string };      // mailto: or external URL

export type RichText = Seg[];

const linkClass = 'text-emerald-600 hover:text-emerald-700';

export function Rich({ parts }: { parts: RichText }) {
  return (
    <>
      {parts.map((part, i) => {
        if (typeof part === 'string') return <Fragment key={i}>{part}</Fragment>;
        if ('b' in part) return <strong key={i}>{part.b}</strong>;
        if ('i' in part) return <em key={i}>{part.i}</em>;
        if ('code' in part) {
          return (
            <code key={i} className="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono">
              {part.code}
            </code>
          );
        }
        if ('to' in part) {
          return <Link key={i} to={part.to} className={linkClass}>{part.link}</Link>;
        }
        const external = /^https?:/.test(part.href);
        return (
          <a
            key={i}
            href={part.href}
            className={linkClass}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {part.link}
          </a>
        );
      })}
    </>
  );
}
