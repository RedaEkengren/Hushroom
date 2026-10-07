import React, { useState, useEffect, useRef } from 'react';

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'reserved';
type WizardState = 'form' | 'loading' | 'error';

export default function FirmWizard() {
  const [wizardState, setWizardState] = useState<WizardState>('form');
  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#059669');
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced slug check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!slug) {
      setSlugStatus('idle');
      return;
    }
    const validFormat = /^[a-z0-9-]{1,32}$/.test(slug);
    if (!validFormat) {
      setSlugStatus('invalid');
      return;
    }
    setSlugStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (data.available) {
          setSlugStatus('available');
        } else {
          setSlugStatus(data.reason === 'reserved' ? 'reserved' : 'taken');
        }
      } catch {
        setSlugStatus('idle');
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [slug]);

  function handleDisplayNameChange(val: string) {
    setDisplayName(val);
    // Auto-suggest slug from display name
    if (!slug || slugStatus === 'idle') {
      const suggested = val
        .toLowerCase()
        .replace(/[åä]/g, 'a')
        .replace(/[ö]/g, 'o')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 32);
      if (suggested) setSlug(suggested);
    }
  }

  function slugStatusLabel(): React.ReactNode {
    switch (slugStatus) {
      case 'checking': return <span className="text-gray-400 text-sm">Checking...</span>;
      case 'available': return <span className="text-emerald-600 text-sm font-medium">✓ Available</span>;
      case 'taken': return <span className="text-red-500 text-sm font-medium">✗ Already taken</span>;
      case 'invalid': return <span className="text-red-500 text-sm font-medium">✗ Only lowercase letters, numbers, hyphens (max 32)</span>;
      case 'reserved': return <span className="text-red-500 text-sm font-medium">✗ Reserved name</span>;
      default: return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (slugStatus !== 'available') {
      setErrorMsg('Please choose an available workspace URL.');
      return;
    }
    if (!adminEmail.includes('@') || !adminEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!displayName.trim()) {
      setErrorMsg('Please enter your firm name.');
      return;
    }
    setWizardState('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/init-firm-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, displayName: displayName.trim(), adminEmail: adminEmail.trim(), primaryColor }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setWizardState('error');
        return;
      }
      window.location.href = data.url;
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setWizardState('error');
    }
  }

  const [attempted, setAttempted] = useState(false);
  const canSubmit = slugStatus === 'available' && adminEmail.includes('@') && displayName.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        {/* Header */}
        <div className="mb-8 text-center">
          <a href="/" className="inline-block mb-4">
            <img src="/logo.webp" alt="Hushroom" className="h-12 w-auto rounded-xl mx-auto" />
          </a>
          <h1 className="text-2xl font-bold text-gray-900">Set up your firm workspace</h1>
          <p className="text-gray-500 mt-1 text-sm">Your secure subdomain on hushroom.io, ready in seconds after payment.</p>
        </div>

        {wizardState === 'loading' ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
            <p className="text-gray-500">Redirecting to payment...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Firm name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Firm name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => handleDisplayNameChange(e.target.value)}
                placeholder="Advokatbyrå AB"
                maxLength={100}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
              {attempted && !displayName.trim() && (
                <p className="text-red-500 text-sm mt-1">Required</p>
              )}
            </div>

            {/* Workspace URL / slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workspace URL</label>
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent">
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="advokatbyra"
                  maxLength={32}
                  className="flex-1 px-4 py-3 text-gray-900 focus:outline-none"
                  required
                />
                <span className="bg-gray-50 px-3 py-3 text-gray-400 text-sm border-l border-gray-200 whitespace-nowrap">.hushroom.io</span>
              </div>
              <div className="mt-1 min-h-5">
                {slugStatusLabel()}
                {attempted && slugStatus !== 'available' && slugStatus !== 'checking' && !slugStatusLabel() && (
                  <span className="text-red-500 text-sm">Choose an available URL</span>
                )}
              </div>
            </div>

            {/* Admin email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="admin@advokatbyra.se"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-400 mt-1">You'll use this to log in at your workspace.</p>
              {attempted && (!adminEmail || !adminEmail.includes('@')) && (
                <p className="text-red-500 text-sm mt-1">Required</p>
              )}
            </div>

            {/* Primary color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand color <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="h-10 w-16 rounded-lg border border-gray-300 cursor-pointer p-1"
                />
                <span className="text-sm text-gray-500">{primaryColor}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              Continue to payment →
            </button>

            <p className="text-center text-xs text-gray-400">
              €149/month · Cancel anytime · Powered by Stripe
            </p>
          </form>
        )}

        <div className="mt-6 text-center">
          <a href="/" className="text-gray-400 text-sm hover:text-gray-600">← Back to hushroom.io</a>
        </div>
      </div>
    </div>
  );
}
