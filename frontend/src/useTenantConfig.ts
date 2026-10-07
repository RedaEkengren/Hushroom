import { useState, useEffect } from 'react';

export interface TenantConfig {
  slug: string;
  displayName: string;
  primaryColor: string;
  logoUrl: string;
}

export function useTenantConfig(): TenantConfig | null {
  const [config, setConfig] = useState<TenantConfig | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/tenant-config')
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data && data.slug) {
          setConfig(data as TenantConfig);
        }
      })
      .catch(() => {
        // Silently fail — tenant config is optional
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
