import { useLocation } from 'react-router-dom';
import { usePageTitle, useHtmlLang } from './usePageTitle';
import { langFromPath } from './landing-copy';
import { pathFor } from './routes';
import { PRIVACY_COPY } from './privacy-copy';
import { LegalPage } from './LegalPage';

export default function PrivacyPolicyPage() {
  const lang = langFromPath(useLocation().pathname);
  const c = PRIVACY_COPY[lang];
  usePageTitle(c.title);
  useHtmlLang(lang);

  return <LegalPage copy={c} footerLinkTo={pathFor('security', lang)} />;
}
