import { useLocation } from 'react-router-dom';
import { usePageTitle, useHtmlLang } from './usePageTitle';
import { langFromPath } from './landing-copy';
import { pathFor } from './routes';
import { TERMS_COPY } from './terms-copy';
import { LegalPage } from './LegalPage';

export default function TermsOfServicePage() {
  const lang = langFromPath(useLocation().pathname);
  const c = TERMS_COPY[lang];
  usePageTitle(c.title);
  useHtmlLang(lang);

  return <LegalPage copy={c} footerLinkTo={pathFor('privacy', lang)} />;
}
