import { Lettermint } from 'lettermint';
import { logger } from './logger.js';

const LETTERMINT_API_TOKEN = process.env.LETTERMINT_API_TOKEN;
const LETTERMINT_FROM_EMAIL = process.env.LETTERMINT_FROM_EMAIL || 'noreply@hushroom.io';

// Defensive killswitch added 2026-05-06 after a Playwright run with cleared
// rate-limits triggered 3 real Lettermint sends to fake @example.com
// addresses (the exact pattern Lettermint suspends accounts for). Setting
// DISABLE_EMAIL_SEND=1 in any non-prod environment stops every send call
// from leaving the process. Production must NOT set this var.
const EMAIL_DISABLED =
  process.env.DISABLE_EMAIL_SEND === '1' ||
  process.env.DISABLE_EMAIL_SEND === 'true';

let lettermint: Lettermint | null = null;

function getClient(): Lettermint {
  if (!lettermint) {
    if (!LETTERMINT_API_TOKEN) {
      throw new Error('LETTERMINT_API_TOKEN not configured');
    }
    lettermint = new Lettermint({ apiToken: LETTERMINT_API_TOKEN });
  }
  return lettermint;
}

// "Configured" = the OTP/onboarding flows may proceed. With DISABLE_EMAIL_SEND
// set (local dev / CI) we report true so /auth/request-link still writes the
// code to Redis and the UI flow is usable end-to-end; the actual send is
// short-circuited in shouldSkipSend() and the code is logged (dev only).
export function isEmailConfigured(): boolean {
  if (EMAIL_DISABLED) return process.env.NODE_ENV !== 'production';
  return !!LETTERMINT_API_TOKEN;
}

// Internal guard — every send-* function calls this BEFORE getClient().
// When DISABLE_EMAIL_SEND is set we log loudly and short-circuit. The OTP
// code (or whatever payload) still reaches Redis upstream, so unit tests
// can inject + verify-code as documented in memory/feedback_no_lettermint_in_tests.md.
function shouldSkipSend(operation: string, recipient: string): boolean {
  if (EMAIL_DISABLED) {
    logger.warn('Email send skipped (DISABLE_EMAIL_SEND set)', { operation, recipient });
    return true;
  }
  return false;
}

export async function sendTrialReminder(email: string, daysLeft: number): Promise<void> {
  if (shouldSkipSend('trial-reminder', email)) return;
  const client = getClient();

  await client.email
    .from(`Hushroom <${LETTERMINT_FROM_EMAIL}>`)
    .to(email)
    .subject(`Your Hushroom Pro trial expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`)
    .html(`
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #059669; font-size: 28px; margin: 0;">Hushroom</h1>
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Your Hushroom Pro trial expires in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Add a payment method to keep unlimited rooms, 12 participants, and 4-hour sessions — all fully encrypted.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://hushroom.io/#pricing"
             style="display: inline-block; background: #059669; color: white; font-weight: 600; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 16px;">
            Keep Pro access →
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Hushroom - Privacy-first instant rooms
        </p>
      </div>
    `)
    .text(`Your Hushroom Pro trial expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Visit https://hushroom.io/#pricing to keep access.`)
    .tag('trial-reminder')
    .send();
}

export async function sendPaymentFailed(email: string): Promise<void> {
  if (shouldSkipSend('payment-failed', email)) return;
  const client = getClient();

  await client.email
    .from(`Hushroom <${LETTERMINT_FROM_EMAIL}>`)
    .to(email)
    .subject('Hushroom payment failed — action required')
    .html(`
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #059669; font-size: 28px; margin: 0;">Hushroom</h1>
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          We were unable to process your payment for Hushroom Pro.
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Please update your payment method to avoid losing access to Pro features.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://hushroom.io/#pricing"
             style="display: inline-block; background: #dc2626; color: white; font-weight: 600; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 16px;">
            Update payment →
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Hushroom - Privacy-first instant rooms
        </p>
      </div>
    `)
    .text('We were unable to process your Hushroom payment. Visit https://hushroom.io/#pricing to update your payment method.')
    .tag('payment-failed')
    .send();
}

export async function sendFirmOnboardingEmail(
  email: string,
  slug: string,
  displayName: string
): Promise<void> {
  if (shouldSkipSend('firm-onboarding', email)) return;
  const client = getClient();
  const adminUrl = `https://${slug}.hushroom.io/admin`;
  const roomUrl = `https://${slug}.hushroom.io`;

  await client.email
    .from(`Hushroom <${LETTERMINT_FROM_EMAIL}>`)
    .to(email)
    .subject(`Welcome to Hushroom Firm — ${displayName}`)
    .html(`
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #059669; font-size: 28px; margin: 0;">Hushroom</h1>
        </div>
        <h2 style="color: #111827; font-size: 20px;">Welcome, ${displayName}!</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Your Hushroom Firm workspace is ready.
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          <strong>Admin dashboard:</strong><br/>
          <a href="${adminUrl}" style="color: #059669;">${adminUrl}</a>
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Log in with this email address using your OTP code.
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          <strong>Share room links with clients:</strong><br/>
          <a href="${roomUrl}" style="color: #059669;">${roomUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Hushroom - Privacy-first instant rooms
        </p>
      </div>
    `)
    .text(
      `Welcome to Hushroom Firm — ${displayName}!\n\n` +
      `Admin dashboard: ${adminUrl}\n` +
      `Log in with this email address using your OTP code.\n\n` +
      `Share room links with clients: ${roomUrl}`
    )
    .tag('firm-onboarding')
    .send();
}

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  if (shouldSkipSend('verification-code', email)) {
    // Dev convenience: surface the code in the log so the local UI flow can be
    // completed without Redis access. Never reached in prod (EMAIL_DISABLED
    // must not be set there — isEmailConfigured() returns false in that case).
    if (process.env.NODE_ENV !== 'production') {
      logger.warn(`[DEV] OTP code for verification: ${code}`);
    }
    return;
  }
  const client = getClient();

  await client.email
    .from(`Hushroom <${LETTERMINT_FROM_EMAIL}>`)
    .to(email)
    .subject(`${code} — Your Hushroom verification code`)
    .html(`
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #059669; font-size: 28px; margin: 0;">Hushroom</h1>
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Your verification code is:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; background: #f0fdf4; border: 2px solid #059669; border-radius: 12px; padding: 16px 40px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #059669; font-family: monospace;">
            ${code}
          </div>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Hushroom - Privacy-first instant rooms
        </p>
      </div>
    `)
    .text(`Your Hushroom verification code: ${code}\n\nThis code expires in 10 minutes.`)
    .tag('verification-code')
    .send();
}
