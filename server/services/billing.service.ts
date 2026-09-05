import type { SupabaseClient } from '@supabase/supabase-js';
import { BillingRepository } from '../repositories/billing.repo';
import type {
  BillingSubscription,
  BillingCredits,
  BillingInvoice,
  BillingCreditTransaction,
} from '@/types/database';

export interface BillingOverview {
  subscription: BillingSubscription | null;
  credits: BillingCredits | null;
  invoices: BillingInvoice[];
  transactions: BillingCreditTransaction[];
}

export class BillingService {
  private repo: BillingRepository;

  constructor(supabase: SupabaseClient) {
    this.repo = new BillingRepository(supabase);
  }

  async getOverview(orgId: string): Promise<BillingOverview> {
    const [subscription, credits, invoices, transactions] = await Promise.all([
      this.repo.getSubscription(orgId),
      this.repo.getCredits(orgId),
      this.repo.getInvoices(orgId, 20),
      this.repo.getCreditTransactions(orgId, 20),
    ]);

    return {
      subscription,
      credits,
      invoices,
      transactions,
    };
  }

  async getSubscription(orgId: string): Promise<BillingSubscription | null> {
    return this.repo.getSubscription(orgId);
  }

  async getCredits(orgId: string): Promise<BillingCredits | null> {
    return this.repo.getCredits(orgId);
  }

  async getInvoices(orgId: string): Promise<BillingInvoice[]> {
    return this.repo.getInvoices(orgId);
  }
}
