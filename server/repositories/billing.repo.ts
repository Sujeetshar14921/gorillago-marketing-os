import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BillingSubscription,
  BillingInvoice,
  BillingCredits,
  BillingCreditTransaction,
} from '@/types/database';

export class BillingRepository {
  constructor(private supabase: SupabaseClient) {}

  async getSubscription(orgId: string): Promise<BillingSubscription | null> {
    const { data, error } = await this.supabase
      .from('billing_subscriptions')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error) throw error;
    return data as BillingSubscription | null;
  }

  async getCredits(orgId: string): Promise<BillingCredits | null> {
    const { data, error } = await this.supabase
      .from('billing_credits')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error) throw error;
    return data as BillingCredits | null;
  }

  async getInvoices(orgId: string, limit: number = 20): Promise<BillingInvoice[]> {
    const { data, error } = await this.supabase
      .from('billing_invoices')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as BillingInvoice[];
  }

  async getCreditTransactions(orgId: string, limit: number = 20): Promise<BillingCreditTransaction[]> {
    const { data, error } = await this.supabase
      .from('billing_credit_transactions')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as BillingCreditTransaction[];
  }
}
