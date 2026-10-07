import "./jwt-wrapper.js";
import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LayoutProvider } from './LayoutContext'
import { Layout } from './Layout'
import HushroomLandingPage from './HushroomLandingPage.tsx'
import { usePageTitle } from './usePageTitle'
import { ROUTES, LEGACY_REDIRECTS } from './routes'
import './index.css'

// Lazy-load secondary pages so the initial bundle (which loads when a user
// clicks /r/<roomId> or hits the landing page) stays small. Each of these
// is a separate chunk fetched on first navigation.
const HowItWorksPage = lazy(() => import('./HowItWorksPage.tsx'));
const SecurityPage = lazy(() => import('./SecurityPage.tsx'));
const PricingPage = lazy(() => import('./PricingPage.tsx'));
const ForLawFirmsPage = lazy(() => import('./ForLawFirmsPage.tsx'));
const AboutPage = lazy(() => import('./AboutPage.tsx'));
const PrivacyPolicyPage = lazy(() => import('./PrivacyPolicyPage.tsx'));
const TermsOfServicePage = lazy(() => import('./TermsOfServicePage.tsx'));
const AdminDashboard = lazy(() => import('./AdminDashboard.tsx'));
const FirmWizard = lazy(() => import('./FirmWizard.tsx'));
const NotFoundPage = lazy(() => import('./NotFoundPage.tsx'));

// Per-route document titles for pages outside <Layout> that we don't want
// to touch internally (AdminDashboard / FirmWizard). Pages inside Layout call
// usePageTitle themselves.
function Titled({ title, children }: { title: string; children: React.ReactNode }) {
  usePageTitle(title);
  return <>{children}</>;
}

function FirmWelcome() {
  usePageTitle('Workspace ready');
  const slug = new URLSearchParams(window.location.search).get('slug');
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your workspace is being set up</h1>
        <p className="text-gray-500 mb-6">You'll receive an email with login instructions shortly.</p>
        {slug && (
          <a
            href={`https://${slug}.hushroom.io/admin`}
            className="text-emerald-600 font-semibold hover:underline"
          >
            Go to {slug}.hushroom.io/admin →
          </a>
        )}
        <div className="mt-6">
          <a href="/" className="text-gray-400 text-sm hover:text-gray-600">Back to hushroom.io</a>
        </div>
      </div>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
      <div className="text-emerald-600 text-sm">Loading…</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LayoutProvider>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route element={<Layout />}>
              {/* Swedish gets the clean paths, English lives under /en
                  (docs/BUILD-PLAN-2026-08.md). Paths come from routes.ts. */}
              <Route path={ROUTES.landing.sv} element={<HushroomLandingPage />} />
              <Route path={ROUTES.landing.en} element={<HushroomLandingPage />} />
              <Route path="/r/:roomId" element={<HushroomLandingPage />} />

              <Route path={ROUTES.howItWorks.sv} element={<HowItWorksPage />} />
              <Route path={ROUTES.howItWorks.en} element={<HowItWorksPage />} />
              <Route path={ROUTES.security.sv} element={<SecurityPage />} />
              <Route path={ROUTES.security.en} element={<SecurityPage />} />
              <Route path={ROUTES.pricing.sv} element={<PricingPage />} />
              <Route path={ROUTES.pricing.en} element={<PricingPage />} />
              <Route path={ROUTES.lawFirms.sv} element={<ForLawFirmsPage />} />
              <Route path={ROUTES.lawFirms.en} element={<ForLawFirmsPage />} />
              <Route path={ROUTES.about.sv} element={<AboutPage />} />
              <Route path={ROUTES.about.en} element={<AboutPage />} />
              <Route path={ROUTES.privacy.sv} element={<PrivacyPolicyPage />} />
              <Route path={ROUTES.privacy.en} element={<PrivacyPolicyPage />} />
              <Route path={ROUTES.terms.sv} element={<TermsOfServicePage />} />
              <Route path={ROUTES.terms.en} element={<TermsOfServicePage />} />

              {/* The old English-only paths keep working so existing links,
                  bookmarks and the previous sitemap do not break. */}
              {LEGACY_REDIRECTS.map(({ from, to }) => (
                <Route key={from} path={from} element={<Navigate to={to} replace />} />
              ))}

              {/* Real 404 (was a silent redirect to "/": soft-404 for SEO and confusing for broken links) */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="/admin" element={<Titled title="Admin"><AdminDashboard /></Titled>} />
            <Route path="/get-started/firm" element={<Titled title="Set up your firm"><FirmWizard /></Titled>} />
            <Route path="/firm-welcome" element={<FirmWelcome />} />
          </Routes>
        </Suspense>
      </LayoutProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
