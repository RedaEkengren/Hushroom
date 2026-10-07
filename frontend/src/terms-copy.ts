import type { Lang } from './landing-copy';
import type { LegalPageCopy } from './LegalPage';
import { ROUTES } from './routes';

// Copy for /villkor (sv) and /en/terms (en).

const sv: LegalPageCopy = {
  title: 'Användarvillkor',
  heroTitle: 'Användarvillkor',
  heroSubtitle: 'Hushroom är en tjänst för privat kommunikation. Var respektfull, följ lagen, och var medveten om att tjänsten tillhandahålls i befintligt skick utan garantier.',
  lastUpdated: 'Senast uppdaterad: 3 mars 2026',

  sections: [
    {
      heading: 'Leverantör',
      blocks: [
        { kind: 'p', text: ['Hushroom drivs av ', { b: 'Benbo.se' }, ', ett svenskt mjukvaruföretag.'] },
        { kind: 'p', text: ['Kontakt: ', { link: 'hello@hushroom.io', href: 'mailto:hello@hushroom.io' }] },
      ],
    },
    {
      heading: 'Definitioner',
      blocks: [
        {
          kind: 'table',
          firstColBold: true,
          rows: [
            [['Tjänsten'], ['Hushroom-plattformen på hushroom.io och subdomäner under *.hushroom.io, inklusive textchatt, röst och video.']],
            [['Rumsskapare'], ['En användare som verifierar sin e-post för att skapa ett kommunikationsrum.']],
            [['Deltagare'], ['Den som ansluter till ett rum via en delad länk, utan att skapa konto.']],
            [['Rum'], ['En tillfällig, krypterad kommunikationssession med bestämd längd (max 4 timmar).']],
            [['Innehåll'], ['All text, allt ljud och all video som överförs genom Tjänsten.']],
            [['Organisationskund'], ['En organisation med prenumeration på Organisationsnivån och en egen subdomän.']],
          ],
        },
      ],
    },
    {
      heading: 'Godkännande av villkoren',
      blocks: [
        { kind: 'p', text: ['Genom att använda Tjänsten godkänner du dessa villkor. Godkänner du dem inte ska du inte använda Tjänsten.'] },
        { kind: 'p', text: ['Använder du Tjänsten för en organisations räkning intygar du att du har rätt att binda organisationen till villkoren.'] },
        { kind: 'p', text: ['Vi kan uppdatera villkoren från tid till annan. Den gällande versionen finns alltid på hushroom.io/villkor. Fortsatt användning efter ändring innebär godkännande. Vid väsentliga ändringar meddelar vi via Tjänsten eller via e-post (för betalande prenumeranter).'] },
      ],
    },
    {
      heading: 'Beskrivning av tjänsten',
      blocks: [
        { kind: 'p', text: ['Hushroom tillhandahåller tillfälliga, krypterade kommunikationsrum för text, röst och video.'] },
        { kind: 'p', text: ['Allt innehåll krypteras i webbläsaren innan det skickas. Servern behandlar bara krypterad data. Krypteringsnycklarna ligger i URL-fragmentet och skickas aldrig till, och lagras aldrig på, våra servrar (zero knowledge-arkitektur).'] },
        { kind: 'p', text: ['Rumsdata lagras uteslutande i flyktigt minne (RAM) och raderas automatiskt när rummet löper ut. Ingen data skrivs till beständig lagring. Vi kan inte komma åt, läsa eller dekryptera innehållet i er kommunikation.'] },
      ],
    },
    {
      heading: 'Åldersgräns',
      blocks: [
        {
          kind: 'callout',
          tone: 'warn',
          text: [{ b: 'Åldersgräns' }, ': Du måste ha fyllt 18 år för att använda Hushroom. Tjänsten är utformad för jurister och yrkesverksamma. Genom att använda Tjänsten bekräftar du att du är 18 år eller äldre. Vi samlar inte medvetet in personuppgifter från någon under 18 år. Om vi får kännedom om att någon under 18 har använt Tjänsten raderar vi tillhörande uppgifter omgående.'],
        },
      ],
    },
    {
      heading: 'Förbjuden användning',
      blocks: [
        {
          kind: 'callout',
          tone: 'danger',
          title: 'Du får INTE använda Hushroom för:',
          items: [
            ['Olaglig verksamhet eller olagligt innehåll enligt tillämplig lag'],
            ['Trakasserier, hot eller hotfullt beteende mot andra'],
            ['Att dela, överföra, efterfråga eller möjliggöra material med sexuella övergrepp mot barn eller sexuellt innehåll som involverar minderåriga. Det är ett brott och anmäls till polis'],
            ['Att använda Tjänsten för att kontakta, utnyttja eller få olämplig tillgång till minderåriga'],
            ['Spam, kommersiella utskick eller oönskad reklam'],
            ['All verksamhet som kan skada minderåriga'],
            ['Försök att hacka, störa eller skada vår tjänst'],
            ['Att kringgå frekvensbegränsningar, autentisering eller begränsningar per prisnivå'],
            ['Automatiserade verktyg (robotar, skrapare) utan skriftligt tillstånd'],
            ['Att utge sig för att vara någon annan person eller organisation'],
            ['Att sälja vidare eller vidarelicensiera åtkomst utan skriftligt tillstånd'],
          ],
        },
      ],
    },
    {
      heading: 'Betalnivåer och fakturering',
      blocks: [
        { kind: 'p', text: ['Hushroom har tre nivåer: Gratis (begränsad), Pro (49 euro per månad) och Organisation (149 euro per månad). Se ', { link: 'priser', to: ROUTES.pricing.sv }, ' för detaljer.'] },
        { kind: 'p', text: ['Betalda prenumerationer faktureras månadsvis via Stripe i euro. Prenumerationen förnyas automatiskt varje period om den inte sägs upp.'] },
        { kind: 'labeled', label: 'Uppsägning', text: ['Du kan säga upp när som helst. Tillgången fortsätter till slutet av innevarande betalperiod. Ingen delåterbetalning sker för perioden.'] },
        { kind: 'labeled', label: 'Prisändringar', text: ['Vi meddelar minst 30 dagar i förväg före en prishöjning. Fortsatt användning efter höjningen innebär godkännande.'] },
        { kind: 'labeled', label: 'Misslyckad betalning', text: ['Om betalningen misslyckas kan vi stänga av tillgången efter rimligt varsel.'] },
        { kind: 'labeled', label: 'Skatter', text: ['Priserna är exklusive moms. Du ansvarar för eventuella skatter i din jurisdiktion.'] },
      ],
    },
    {
      heading: 'Provperiod',
      blocks: [
        { kind: 'p', text: ['Pro-nivån innehåller 14 dagars gratis provperiod utan kortuppgifter. Efter provperioden återgår kontot till Gratis om du inte tecknar en prenumeration. En provperiod per e-postadress. Vi kan ändra eller avsluta erbjudandet när som helst.'] },
      ],
    },
    {
      heading: 'Ångerrätt',
      blocks: [
        { kind: 'p', text: ['Är du konsument inom EU eller EES har du rätt att ångra en betald prenumeration inom 14 dagar från köpet, utan att ange skäl.'] },
        { kind: 'p', text: ['För att utöva ångerrätten, kontakta oss på ', { link: 'hello@hushroom.io', href: 'mailto:hello@hushroom.io' }, '.'] },
        { kind: 'p', text: ['Har du använt Tjänsten aktivt under ångerfristen kan vi dra av ett proportionerligt belopp för den tjänst som redan levererats.'] },
      ],
    },
    {
      heading: 'Användarens ansvar',
      blocks: [
        { kind: 'p', text: ['Du ansvarar för allt innehåll du delar, för att följa tillämplig lag, för att skydda rumslänkar och för att anmäla missbruk eller olagligt innehåll till oss.'] },
        { kind: 'p', text: ['Du åtar dig att hålla Benbo.se skadeslöst från krav, skador eller kostnader som uppstår ur (a) din användning av Tjänsten i strid med dessa villkor, (b) ditt brott mot tillämplig lag, eller (c) innehåll du överför genom Tjänsten. Det gäller inte i den mån kravet beror på vår vårdslöshet eller vårt avtalsbrott.'] },
      ],
    },
    {
      heading: 'Brottsbekämpning och rättsliga processer',
      blocks: [
        { kind: 'p', text: ['Vi samarbetar med lagliga begäranden från brottsbekämpande myndigheter och tillsynsmyndigheter. På grund av vår tekniska arkitektur finns strikta gränser för vad vi kan lämna ut.'] },
        {
          kind: 'table',
          firstColBold: true,
          head: ['Kategori', 'Vi KAN lämna ut', 'Vi KAN INTE lämna ut'],
          rows: [
            [['Innehåll i kommunikationen'], ['-'], ['Meddelanden, röst eller video (krypterat hela vägen, servern ser aldrig klartext)']],
            [['Metadata om rummet'], ['Tidpunkt när rummet skapades, vald längd, antal deltagare (inga namn)'], ['Deltagares identiteter (inget konto krävs för att ansluta)']],
            [['Skaparens identitet'], ['SHA-256-hash av skaparens e-post (om den finns kvar inom 30-dagarsfönstret)'], ['E-postadress i klartext (kastas efter verifieringen)']],
            [['Prenumerationsuppgifter'], ['Nivå och betalstatus (behandlas av Stripe, se deras policy)'], ['Kortuppgifter (finns hos Stripe, inte hos Hushroom)']],
            [['Rapporter om missbruk'], ['Rums-id och typ av rapport (sparas i 90 dagar)'], ['Innehållet i rapporterade meddelanden (krypterat, lagras aldrig i klartext)']],
            [['Historisk data'], ['-'], ['Historiskt rumsinnehåll (bara i RAM, raderas när rummet löper ut)']],
          ],
        },
        { kind: 'p', text: ['Att bevara innehåll är tekniskt omöjligt: all rumsdata lagras uteslutande i flyktigt minne och raderas permanent när rummet löper ut. Vi har ingen möjlighet att bevara eller återskapa tidigare kommunikation.'] },
        { kind: 'p', text: ['Rättsliga förfrågningar skickas till ', { link: 'legal@hushroom.io', href: 'mailto:legal@hushroom.io' }, '. Vi underrättar berörda användare om vi inte är förhindrade av lag.'] },
      ],
    },
    {
      heading: 'Immateriella rättigheter',
      blocks: [
        { kind: 'p', text: ['Tjänsten, inklusive all programvara, formgivning, varumärken och dokumentation, ägs av Benbo.se eller dess licensgivare. Dessa villkor överför inga äganderätter till dig.'] },
        { kind: 'p', text: ['Vi ger dig en begränsad, icke-exklusiv, icke-överlåtbar och återkallelig rätt att använda Tjänsten i enlighet med dessa villkor.'] },
        { kind: 'p', text: ['Du behåller äganderätten till allt innehåll du överför genom Tjänsten. Eftersom allt är krypterat hela vägen kan vi inte komma åt ditt innehåll och gör inte anspråk på några rättigheter till det.'] },
      ],
    },
    {
      heading: 'Dataskydd och behandling',
      blocks: [
        { kind: 'p', text: ['Benbo.se är personuppgiftsansvarig för kontorelaterade uppgifter (e-posthashar och prenumerationsuppgifter). Vi behandlar minsta möjliga: SHA-256-hash av e-post för rumsskapare, och prenumerationsuppgifter för betalande kunder.'] },
        { kind: 'p', text: ['Vi behandlar inte innehållet i er kommunikation (zero knowledge-arkitektur). Behandlingen sker inom EU, med servrar i Sverige.'] },
        { kind: 'p', text: ['För kunder på Organisationsnivån finns ett separat personuppgiftsbiträdesavtal att tillgå på begäran.'] },
        { kind: 'labeled', label: 'Underbiträden', text: ['Stripe (betalningar) och Lettermint (transaktionsmejl). Din användning av dessa tjänster omfattas av deras respektive villkor.'] },
        { kind: 'labeled', label: 'Anmälan av personuppgiftsincident', text: ['Vid en säkerhetsincident som rör personuppgifter underrättar vi berörda användare och Integritetsskyddsmyndigheten (IMY) inom 72 timmar enligt dataskyddsförordningen. På grund av zero knowledge-arkitekturen skulle en incident på serversidan inte exponera innehållet i kommunikationen.'] },
      ],
    },
    {
      heading: 'Ansvarsbegränsning',
      blocks: [
        { kind: 'p', text: ['Tjänsten tillhandahålls i befintligt skick och i mån av tillgänglighet, utan garantier av något slag, uttryckliga eller underförstådda, inklusive garantier om allmän lämplighet, lämplighet för ett visst ändamål och frånvaro av intrång.'] },
        { kind: 'p', text: ['I den utsträckning tillämplig lag tillåter ska Benbo.se totala ansvar för krav som uppstår ur eller har samband med dessa villkor eller Tjänsten inte överstiga det belopp du betalat under de tolv månader som föregår kravet, eller 100 euro för användare på gratisnivån.'] },
        { kind: 'p', text: ['Benbo.se ansvarar inte i något fall för indirekta skador, följdskador, särskilda skador eller straffskadestånd, inklusive förlust av data, intäkter eller affärsmöjligheter.'] },
        { kind: 'p', text: ['Ingenting i dessa villkor begränsar de rättigheter du kan ha enligt tvingande konsumentskyddslagstiftning i din jurisdiktion.'] },
      ],
    },
    {
      heading: 'Tillgänglighet',
      blocks: [
        { kind: 'p', text: ['Vi strävar efter hög tillgänglighet men garanterar ingen viss upptid. Planerat underhåll aviseras i förväg när det är möjligt.'] },
        { kind: 'p', text: ['Ingen av parterna ansvarar för utebliven prestation till följd av omständigheter utanför rimlig kontroll, inklusive naturkatastrofer, krig, myndighetsbeslut, strömavbrott, internetavbrott eller cyberattacker.'] },
      ],
    },
    {
      heading: 'Upphörande',
      blocks: [
        { kind: 'labeled', label: 'Av dig', text: ['Du kan sluta använda Tjänsten när som helst. Betalande prenumeranter säger upp via Stripe eller genom att kontakta oss. Uppsägningen får verkan vid slutet av innevarande betalperiod.'] },
        { kind: 'labeled', label: 'Av oss', text: ['Vi kan stänga av eller avsluta din tillgång om du bryter mot dessa villkor, ägnar dig åt förbjuden användning, eller om lag kräver det. Vi meddelar när det rimligen är möjligt.'] },
        { kind: 'labeled', label: 'Nedläggning', text: ['Om vi lägger ned Tjänsten meddelar vi betalande prenumeranter minst 90 dagar i förväg.'] },
        { kind: 'labeled', label: 'Verkan', text: ['Rumsdata är tillfällig och raderas redan automatiskt. Prenumerationsrelaterade uppgifter (e-posthash och nivå) raderas inom 30 dagar från upphörandet.'] },
      ],
    },
    {
      heading: 'Tillämplig lag och tvister',
      blocks: [
        { kind: 'p', text: ['Dessa villkor regleras av och tolkas enligt svensk rätt.'] },
        { kind: 'p', text: ['Tvister som uppstår ur dessa villkor ska avgöras av domstol i Stockholm.'] },
        { kind: 'p', text: ['För konsumenter inom EU: ingenting i denna punkt hindrar dig från att väcka talan vid domstol i ditt hemland. Europeiska kommissionen tillhandahåller en plattform för tvistlösning online på ', { link: 'ec.europa.eu/consumers/odr', href: 'https://ec.europa.eu/consumers/odr' }, '.'] },
      ],
    },
    {
      heading: 'Organisationsnivån: kompletterande villkor',
      blocks: [
        { kind: 'p', text: ['Den utsedda administratören ansvarar för att förvalta organisationskontot, inklusive användaråtkomst och efterlevnad.'] },
        { kind: 'p', text: ['Organisationskunden får en egen subdomän (dinorg.hushroom.io). Subdomäner är inte överlåtbara och tilldelas i mån av tillgång.'] },
        { kind: 'p', text: ['Ett personuppgiftsbiträdesavtal finns att tillgå på begäran för kunder på Organisationsnivån. Anpassade villkor kan förhandlas för att möta specifika efterlevnadskrav.'] },
      ],
    },
    {
      heading: 'Allmänna bestämmelser',
      blocks: [
        { kind: 'labeled', label: 'Fullständigt avtal', text: ['Dessa villkor utgör tillsammans med ', { link: 'integritetspolicyn', to: ROUTES.privacy.sv }, ' hela avtalet mellan dig och Benbo.se avseende Tjänsten.'] },
        { kind: 'labeled', label: 'Ogiltig bestämmelse', text: ['Om en bestämmelse i dessa villkor bedöms ogiltig eller omöjlig att göra gällande ska övriga bestämmelser fortsätta att gälla fullt ut.'] },
        { kind: 'labeled', label: 'Avstående', text: ['Att vi inte gör en rättighet eller bestämmelse gällande innebär inte att vi avstår från den.'] },
        { kind: 'labeled', label: 'Överlåtelse', text: ['Du får inte överlåta dina rättigheter enligt dessa villkor utan vårt skriftliga medgivande. Vi får överlåta villkoren till en efterträdare i samband med en fusion eller ett förvärv.'] },
      ],
    },
  ],

  contact: {
    heading: 'Kontakt',
    items: [
      { label: 'Allmänna frågor', email: 'hello@hushroom.io' },
      { label: 'Anmäl överträdelser', email: 'abuse@hushroom.io' },
    ],
    linkLabel: 'Läs integritetspolicyn',
  },
};

const en: LegalPageCopy = {
  title: 'Terms of Service',
  heroTitle: 'Terms of Service',
  heroSubtitle: 'Hushroom is a private communication service. Be respectful, follow the law, and understand that we provide the service "as-is" without guarantees.',
  lastUpdated: 'Last updated: 3 March 2026',

  sections: [
    {
      heading: 'Provider',
      blocks: [
        { kind: 'p', text: ['Hushroom is operated by ', { b: 'Benbo.se' }, ', a Swedish software company.'] },
        { kind: 'p', text: ['Contact: ', { link: 'hello@hushroom.io', href: 'mailto:hello@hushroom.io' }] },
      ],
    },
    {
      heading: 'Definitions',
      blocks: [
        {
          kind: 'table',
          firstColBold: true,
          rows: [
            [['Service'], ['The Hushroom platform at hushroom.io and *.hushroom.io subdomains, including text chat, voice, and video communication.']],
            [['Room Creator'], ['A user who verifies their email to create a communication room.']],
            [['Participant'], ['Any person who joins a room via a shared link, without account creation.']],
            [['Room'], ['A temporary, encrypted communication session with a defined duration (max 4 hours).']],
            [['Content'], ['Any text, audio, or video transmitted through the Service.']],
            [['Organisation Tenant'], ['An organization subscribed to the Organisation tier with a branded subdomain.']],
          ],
        },
      ],
    },
    {
      heading: 'Acceptance of terms',
      blocks: [
        { kind: 'p', text: ['By using the Service, you agree to these Terms. If you do not agree, do not use the Service.'] },
        { kind: 'p', text: ['If you use the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.'] },
        { kind: 'p', text: ['We may update these Terms from time to time. The current version is always available at hushroom.io/en/terms. Continued use after changes constitutes acceptance. For material changes, we will provide notice via the Service or email (for paying subscribers).'] },
      ],
    },
    {
      heading: 'Service description',
      blocks: [
        { kind: 'p', text: ['Hushroom provides temporary, end-to-end encrypted communication rooms for text, voice, and video.'] },
        { kind: 'p', text: ['All content is encrypted client-side before transmission. The server processes only encrypted data. Encryption keys are embedded in the URL fragment and never transmitted to or stored on our servers (zero-knowledge architecture).'] },
        { kind: 'p', text: ['Room data is stored exclusively in volatile memory (RAM) and automatically deleted when the room expires. No data is written to persistent storage. We cannot access, read, or decrypt the content of your communications.'] },
      ],
    },
    {
      heading: 'Age requirements',
      blocks: [
        {
          kind: 'callout',
          tone: 'warn',
          text: [{ b: 'Age Restriction' }, ': You must be at least 18 years old to use Hushroom. Hushroom is designed for legal professionals and business users. By using the Service you confirm that you are 18 years of age or older. We do not knowingly collect personal data from anyone under 18. If we become aware that a person under 18 has used the Service, we will promptly delete the associated data.'],
        },
      ],
    },
    {
      heading: 'Prohibited uses',
      blocks: [
        {
          kind: 'callout',
          tone: 'danger',
          title: 'You may NOT use Hushroom for:',
          items: [
            ['Illegal activities or content under any applicable law'],
            ['Harassment, threats, or intimidation of others'],
            ['Sharing, transmitting, soliciting, or facilitating child sexual abuse material (CSAM) or any sexual content involving minors. This is a criminal offense and will be reported to law enforcement'],
            ['Using the Service to groom, exploit, or gain inappropriate access to minors'],
            ['Spam, commercial solicitation, or unsolicited advertising'],
            ['Any activity that could harm minors'],
            ['Attempting to hack, disrupt, or damage our service'],
            ['Circumventing rate limits, authentication, or tier restrictions'],
            ['Using automated tools (bots, scrapers) without written permission'],
            ['Impersonating another person or entity'],
            ['Reselling or sublicensing access without written permission'],
          ],
        },
      ],
    },
    {
      heading: 'Paid tiers and billing',
      blocks: [
        { kind: 'p', text: ['Hushroom offers three tiers: Free (limited), Pro (EUR 49/month), and Organisation (EUR 149/month). See ', { link: 'pricing', to: ROUTES.pricing.en }, ' for details.'] },
        { kind: 'p', text: ['Paid subscriptions are billed monthly via Stripe in EUR. Subscriptions renew automatically each billing period unless cancelled.'] },
        { kind: 'labeled', label: 'Cancellation', text: ['You may cancel at any time. Access continues until the end of the current billing period. No partial refunds for the current period.'] },
        { kind: 'labeled', label: 'Price changes', text: ["We will provide at least 30 days' notice before any price increase. Continued use after the increase constitutes acceptance."] },
        { kind: 'labeled', label: 'Failed payments', text: ['If payment fails, we may suspend access after reasonable notice.'] },
        { kind: 'labeled', label: 'Taxes', text: ['Prices are exclusive of applicable VAT. You are responsible for any taxes in your jurisdiction.'] },
      ],
    },
    {
      heading: 'Free trial',
      blocks: [
        { kind: 'p', text: ['The Pro tier includes a 14-day free trial, no credit card required. After the trial, you revert to the Free tier unless you subscribe. One trial per email address. We may modify or discontinue the trial offer at any time.'] },
      ],
    },
    {
      heading: 'Right of withdrawal',
      blocks: [
        { kind: 'p', text: ['If you are a consumer in the EU/EEA, you have the right to withdraw from a paid subscription within 14 days of purchase, without giving a reason.'] },
        { kind: 'p', text: ['To exercise your right of withdrawal, contact us at ', { link: 'hello@hushroom.io', href: 'mailto:hello@hushroom.io' }, '.'] },
        { kind: 'p', text: ['If you have actively used the Service during the withdrawal period, we may deduct a proportionate amount for the service already provided.'] },
      ],
    },
    {
      heading: 'User responsibility',
      blocks: [
        { kind: 'p', text: ['You are responsible for all content you share, ensuring compliance with applicable laws, protecting room links, and reporting abuse or illegal content to us.'] },
        { kind: 'p', text: ['You agree to indemnify and hold harmless Benbo.se from any claims, damages, or expenses arising from: (a) your use of the Service in violation of these Terms, (b) your violation of any applicable law, or (c) content you transmit through the Service. This does not apply to the extent the claim results from our negligence or breach of these Terms.'] },
      ],
    },
    {
      heading: 'Law enforcement and legal process',
      blocks: [
        { kind: 'p', text: ['We cooperate with lawful requests from law enforcement and regulatory authorities. Due to our technical architecture, there are strict limits on what we can provide.'] },
        {
          kind: 'table',
          firstColBold: true,
          head: ['Category', 'We CAN provide', 'We CANNOT provide'],
          rows: [
            [['Communication content'], ['-'], ['Messages, voice, or video (end-to-end encrypted, server never sees plaintext)']],
            [['Room metadata'], ['Timestamp of room creation, configured duration, number of participants (no names)'], ['Participant identities (no accounts required to join)']],
            [['Creator identity'], ['SHA-256 hash of creator email (if still retained within 30-day window)'], ['Plaintext email address (discarded after OTP verification)']],
            [['Subscription data'], ['Tier, billing status (processed by Stripe, see their LEA policy)'], ['Payment card details (held by Stripe, not Hushroom)']],
            [['Abuse reports'], ['Room IDs and report types (retained 90 days)'], ['Reported message content (encrypted, never stored in plaintext)']],
            [['Historical data'], ['-'], ['Room content history (RAM-only, auto-deleted when room expires)']],
          ],
        },
        { kind: 'p', text: ['Content preservation is technically impossible: all room data is stored exclusively in volatile memory (RAM) and permanently erased when the room expires. We have no mechanism to preserve or reconstruct past communications.'] },
        { kind: 'p', text: ['Law enforcement and legal requests should be directed to: ', { link: 'legal@hushroom.io', href: 'mailto:legal@hushroom.io' }, '. We will notify affected users of legal requests unless prohibited by law.'] },
      ],
    },
    {
      heading: 'Intellectual property',
      blocks: [
        { kind: 'p', text: ['The Service, including all software, design, trademarks, and documentation, is owned by Benbo.se or its licensors. These Terms do not transfer any ownership rights to you.'] },
        { kind: 'p', text: ['We grant you a limited, non-exclusive, non-transferable, revocable license to use the Service in accordance with these Terms.'] },
        { kind: 'p', text: ['You retain ownership of all content you transmit through the Service. Due to end-to-end encryption, we cannot access your content and claim no rights to it.'] },
      ],
    },
    {
      heading: 'GDPR and data processing',
      blocks: [
        { kind: 'p', text: ['Benbo.se acts as the data controller for account-related data (email hashes, subscription data). We process the minimum data necessary: SHA-256 email hash for room creators, subscription data for paying customers.'] },
        { kind: 'p', text: ['We do not process the content of your communications (zero-knowledge architecture). Data is processed within the EU (servers located in Sweden).'] },
        { kind: 'p', text: ['For Organisation tier subscribers, a separate Data Processing Agreement (DPA) is available upon request.'] },
        { kind: 'labeled', label: 'Subprocessors', text: ['Stripe (payment processing) and Lettermint (transactional email). Your use of these services is subject to their respective terms.'] },
        { kind: 'labeled', label: 'Data breach notification', text: ['In the event of a security breach affecting personal data, we will notify affected users and the Swedish Authority for Privacy Protection (IMY) within 72 hours, as required by GDPR. Due to our zero-knowledge architecture, a server-side incident would not expose communication content.'] },
      ],
    },
    {
      heading: 'Limitation of liability',
      blocks: [
        { kind: 'p', text: ['The Service is provided "as is" and "as available" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.'] },
        { kind: 'p', text: ["To the maximum extent permitted by applicable law, Benbo.se's total liability for any claims arising from or related to these Terms or the Service shall not exceed the amounts paid by you in the 12 months preceding the claim, or EUR 100 for free-tier users."] },
        { kind: 'p', text: ['In no event shall Benbo.se be liable for indirect, incidental, special, consequential, or punitive damages, including loss of data, revenue, or business opportunities.'] },
        { kind: 'p', text: ['Nothing in these Terms limits any rights you may have under mandatory consumer protection laws in your jurisdiction.'] },
      ],
    },
    {
      heading: 'Service availability',
      blocks: [
        { kind: 'p', text: ['We aim to maintain high availability but do not guarantee a specific uptime percentage. Planned maintenance will be announced in advance where possible.'] },
        { kind: 'p', text: ['Neither party shall be liable for failure to perform obligations due to circumstances beyond reasonable control, including natural disasters, war, government actions, power failures, internet outages, or cyberattacks.'] },
      ],
    },
    {
      heading: 'Termination',
      blocks: [
        { kind: 'labeled', label: 'By you', text: ['You may stop using the Service at any time. Paying subscribers may cancel via Stripe or by contacting us. Cancellation takes effect at the end of the current billing period.'] },
        { kind: 'labeled', label: 'By us', text: ['We may suspend or terminate your access if you violate these Terms, engage in prohibited uses, or if required by law. We will provide notice where reasonably possible.'] },
        { kind: 'labeled', label: 'Discontinuation', text: ["If we discontinue the Service, we will provide at least 90 days' notice to paying subscribers."] },
        { kind: 'labeled', label: 'Effect', text: ['Room data is ephemeral and already subject to automatic deletion. Subscription-related data (email hash, tier) will be deleted within 30 days of termination.'] },
      ],
    },
    {
      heading: 'Governing law and disputes',
      blocks: [
        { kind: 'p', text: ['These Terms are governed by and construed in accordance with the laws of Sweden.'] },
        { kind: 'p', text: ['Any disputes arising from these Terms shall be resolved by the courts of Stockholm, Sweden.'] },
        { kind: 'p', text: ['EU consumers: nothing in this clause prevents you from bringing proceedings in the courts of your country of residence. The European Commission provides an online dispute resolution platform at ', { link: 'ec.europa.eu/consumers/odr', href: 'https://ec.europa.eu/consumers/odr' }, '.'] },
      ],
    },
    {
      heading: 'Organisation tier: additional terms',
      blocks: [
        { kind: 'p', text: ['The designated administrator is responsible for managing the Organisation tenant, including user access and compliance.'] },
        { kind: 'p', text: ['The Organisation tenant receives a branded subdomain (yourorg.hushroom.io). Subdomains are non-transferable and subject to availability.'] },
        { kind: 'p', text: ['A Data Processing Agreement is available upon request for Organisation subscribers. Custom terms may be negotiated to meet specific compliance requirements.'] },
      ],
    },
    {
      heading: 'General provisions',
      blocks: [
        { kind: 'labeled', label: 'Entire agreement', text: ['These Terms, together with the ', { link: 'Privacy Policy', to: ROUTES.privacy.en }, ', constitute the entire agreement between you and Benbo.se regarding the Service.'] },
        { kind: 'labeled', label: 'Severability', text: ['If any provision of these Terms is held invalid or unenforceable, the remaining provisions remain in full force.'] },
        { kind: 'labeled', label: 'Waiver', text: ['Our failure to enforce any right or provision does not constitute a waiver of that right or provision.'] },
        { kind: 'labeled', label: 'Assignment', text: ['You may not assign your rights under these Terms without our written consent. We may assign these Terms to a successor in connection with a merger or acquisition.'] },
      ],
    },
  ],

  contact: {
    heading: 'Contact',
    items: [
      { label: 'General inquiries', email: 'hello@hushroom.io' },
      { label: 'Report violations', email: 'abuse@hushroom.io' },
    ],
    linkLabel: 'Read privacy policy',
  },
};

export const TERMS_COPY: Record<Lang, LegalPageCopy> = { sv, en };
