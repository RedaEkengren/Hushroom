import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || '';
const STRIPE_FIRM_PRICE_ID = process.env.STRIPE_FIRM_PRICE_ID || '';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    stripeClient = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' });
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return !!STRIPE_SECRET_KEY && !!STRIPE_WEBHOOK_SECRET;
}

export async function createCheckoutSession(
  tier: 'pro' | 'firm',
  emailHash: string,
  email: string,
  successUrl: string,
  cancelUrl: string,
  setupToken?: string
): Promise<string> {
  const stripe = getStripe();

  const priceId = tier === 'pro' ? STRIPE_PRO_PRICE_ID : STRIPE_FIRM_PRICE_ID;
  if (!priceId) {
    throw new Error(`Price ID for tier '${tier}' not configured`);
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { emailHash, tier, ...(setupToken ? { setupToken } : {}) },
    success_url: successUrl,
    cancel_url: cancelUrl,
  };

  // Only pass customer_email if we have a valid one (Stripe rejects empty strings)
  if (email && email.includes('@')) {
    sessionParams.customer_email = email;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL');
  }

  return session.url;
}

export function constructWebhookEvent(
  payload: Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
}

export async function getSubscriptionDetails(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  return stripe.subscriptions.retrieve(subscriptionId);
}
