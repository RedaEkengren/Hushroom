import { useState, useEffect } from 'react';
import { isCreatorVerified } from './jwt-wrapper';

export function usePricingState() {
  const [userTier, setUserTier] = useState<'demo' | 'pro' | 'firm' | null>(null);

  useEffect(() => {
    if (isCreatorVerified()) {
      fetch('/api/subscription')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setUserTier(d.tier ?? 'demo'); })
        .catch(() => {});
    }
  }, []);

  const startTrial = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/start-trial', { method: 'POST' });
      if (response.ok) {
        setUserTier('pro');
        return { success: true };
      } else {
        const err = await response.json();
        return { success: false, error: err.error || 'Failed to start trial' };
      }
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const checkout = async (tier: 'pro' | 'firm'): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
        return { success: true };
      } else {
        const err = await response.json();
        return { success: false, error: err.error || 'Failed to start checkout' };
      }
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  return { userTier, setUserTier, startTrial, checkout };
}
