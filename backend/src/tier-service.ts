import { RedisClientType } from 'redis';

export type Tier = 'demo' | 'pro' | 'firm';

interface TrialData {
  startedAt: number;
}

interface SubscriptionData {
  tier: Tier;
  stripeCustomerId: string;
  subscriptionId: string;
  status: string; // 'active' | 'past_due' | 'cancelled'
  currentPeriodEnd: number;
  email?: string;
}

const TRIAL_TTL = 14 * 24 * 60 * 60; // 14 days in seconds

export class TierService {
  private client: RedisClientType;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  async getTier(emailHash: string): Promise<Tier> {
    // Check active subscription first
    const sub = await this.getSubscription(emailHash);
    if (sub && sub.status === 'active') {
      return sub.tier;
    }

    // Check active trial
    const trialKey = `hushroom:trial:${emailHash}`;
    const trialData = await this.client.get(trialKey);
    if (trialData) {
      return 'pro';
    }

    return 'demo';
  }

  async startTrial(emailHash: string): Promise<{ trialEnd: number }> {
    const trialKey = `hushroom:trial:${emailHash}`;
    const now = Date.now();
    const trialEnd = now + TRIAL_TTL * 1000;

    const data: TrialData = { startedAt: now };
    await this.client.setEx(trialKey, TRIAL_TTL, JSON.stringify(data));

    return { trialEnd };
  }

  async getTrialEnd(emailHash: string): Promise<number | null> {
    const trialKey = `hushroom:trial:${emailHash}`;
    const ttl = await this.client.ttl(trialKey);
    if (ttl <= 0) return null;
    return Date.now() + ttl * 1000;
  }

  async setSubscription(emailHash: string, data: SubscriptionData): Promise<void> {
    const subKey = `hushroom:sub:${emailHash}`;
    await this.client.set(subKey, JSON.stringify(data));
  }

  async getSubscription(emailHash: string): Promise<SubscriptionData | null> {
    const subKey = `hushroom:sub:${emailHash}`;
    const raw = await this.client.get(subKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SubscriptionData;
    } catch {
      return null;
    }
  }
}
