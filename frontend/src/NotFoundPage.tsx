import { Link } from 'react-router-dom';
import { ArrowRight, Home } from 'lucide-react';
import { usePageTitle } from './usePageTitle';

// Real 404 for unknown routes (previously `*` silently redirected to the
// landing page — a soft-404 that confused users with broken links and SEO).
export default function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-yellow-50 pt-16 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <p className="text-sm font-semibold text-emerald-600 mb-3">404</p>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Page not found</h1>
        <p className="text-gray-600 mb-8">
          This link doesn't go anywhere. If it was a room link, the room may have expired. Rooms are
          deleted automatically when their timer runs out, and nothing is kept afterwards.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-8 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 flex items-center gap-2 shadow-lg"
          >
            Create a room
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/"
            className="border border-emerald-300 text-emerald-700 font-semibold py-3 px-8 rounded-xl hover:bg-emerald-50 transition-all duration-300 flex items-center gap-2"
          >
            <Home size={18} />
            Back to hushroom.io
          </Link>
        </div>
      </div>
    </div>
  );
}
