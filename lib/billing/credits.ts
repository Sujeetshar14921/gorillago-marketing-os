import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreditType, BillingPlan } from '@/types/database';

export const PLAN_DEFAULT_CREDITS: Record<BillingPlan, { content: number; image: number; video: number }> = {
  free: { content: 10, image: 2, video: 0 },
  starter: { content: 100, image: 20, video: 5 },
  growth: { content: 500, image: 100, video: 20 },
  agency: { content: 2000, image: 500, video: 100 },
  enterprise: { content: 10000, image: 3000, video: 500 },
};

export interface CheckCreditResult {
  hasEnough: boolean;
  remaining: number;
  required: number;
  error?: string;
}

export interface DeductCreditResult {
  success: boolean;
  remaining: number;
  deducted: number;
  error?: string;
}

/**
 * Check if an organization has enough credits before invoking AI providers.
 * If no credits row exists, auto-provisions Free tier credits.
 */
export async function checkCredits(
  supabase: SupabaseClient,
  organizationId: string,
  creditType: CreditType,
  amount: number = 1
): Promise<CheckCreditResult> {
  try {
    // 1. Try atomic RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('check_ai_credits', {
      p_org_id: organizationId,
      p_credit_type: creditType,
      p_amount: amount,
    });

    if (!rpcError && rpcData && typeof rpcData.has_enough === 'boolean') {
      return {
        hasEnough: rpcData.has_enough,
        remaining: rpcData.remaining ?? 0,
        required: rpcData.required ?? amount,
      };
    }

    // 2. Direct fallback if RPC is not yet registered in database
    const { data: row } = await supabase
      .from('billing_credits')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (!row) {
      // Auto-provision free tier
      const freeCredits = PLAN_DEFAULT_CREDITS.free;
      const { data: newRow } = await supabase
        .from('billing_credits')
        .insert({
          organization_id: organizationId,
          ai_content_credits: freeCredits.content,
          ai_image_credits: freeCredits.image,
          ai_video_credits: freeCredits.video,
        })
        .select()
        .single();

      const balance =
        creditType === 'content'
          ? (newRow?.ai_content_credits ?? freeCredits.content)
          : creditType === 'image'
          ? (newRow?.ai_image_credits ?? freeCredits.image)
          : (newRow?.ai_video_credits ?? freeCredits.video);

      return {
        hasEnough: balance >= amount,
        remaining: balance,
        required: amount,
      };
    }

    const currentBalance =
      creditType === 'content'
        ? (row.ai_content_credits ?? 0)
        : creditType === 'image'
        ? (row.ai_image_credits ?? 0)
        : (row.ai_video_credits ?? 0);

    return {
      hasEnough: currentBalance >= amount,
      remaining: currentBalance,
      required: amount,
    };
  } catch (error: any) {
    console.error('Error checking credits:', error);
    // Fail closed or return 0 remaining
    return {
      hasEnough: false,
      remaining: 0,
      required: amount,
      error: error?.message || 'Failed to check credits',
    };
  }
}

/**
 * Deduct credits atomically after successful AI generation and storage.
 * Records a usage entry in billing_credit_transactions.
 */
export async function deductCredits(
  supabase: SupabaseClient,
  organizationId: string,
  creditType: CreditType,
  amount: number = 1,
  description: string = 'AI asset generation',
  referenceId?: string | null
): Promise<DeductCreditResult> {
  try {
    // 1. Try atomic RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('deduct_ai_credits', {
      p_org_id: organizationId,
      p_credit_type: creditType,
      p_amount: amount,
      p_description: description,
      p_reference_id: referenceId ?? null,
    });

    if (!rpcError && rpcData && typeof rpcData.success === 'boolean') {
      return {
        success: rpcData.success,
        remaining: rpcData.remaining ?? 0,
        deducted: rpcData.deducted ?? amount,
        error: rpcData.error,
      };
    }

    // 2. Direct fallback
    const { data: row } = await supabase
      .from('billing_credits')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (!row) {
      return {
        success: false,
        remaining: 0,
        deducted: 0,
        error: 'No credits record found for organization',
      };
    }

    const currentBalance =
      creditType === 'content'
        ? (row.ai_content_credits ?? 0)
        : creditType === 'image'
        ? (row.ai_image_credits ?? 0)
        : (row.ai_video_credits ?? 0);

    if (currentBalance < amount) {
      return {
        success: false,
        remaining: currentBalance,
        deducted: 0,
        error: 'INSUFFICIENT_CREDITS',
      };
    }

    const newBalance = currentBalance - amount;
    const updatePayload =
      creditType === 'content'
        ? {
            ai_content_credits: newBalance,
            total_used_content: (row.total_used_content ?? 0) + amount,
          }
        : creditType === 'image'
        ? {
            ai_image_credits: newBalance,
            total_used_image: (row.total_used_image ?? 0) + amount,
          }
        : {
            ai_video_credits: newBalance,
            total_used_video: (row.total_used_video ?? 0) + amount,
          };

    await supabase
      .from('billing_credits')
      .update(updatePayload)
      .eq('organization_id', organizationId);

    // Record transaction
    await supabase.from('billing_credit_transactions').insert({
      organization_id: organizationId,
      type: 'usage',
      credit_type: creditType,
      amount: -amount,
      balance_after: newBalance,
      description,
      reference_id: referenceId ?? null,
    });

    return {
      success: true,
      remaining: newBalance,
      deducted: amount,
    };
  } catch (error: any) {
    console.error('Error deducting credits:', error);
    return {
      success: false,
      remaining: 0,
      deducted: 0,
      error: error?.message || 'Failed to deduct credits',
    };
  }
}

/**
 * Grants/refreshes quota when a plan is switched or seeded.
 */
export async function grantPlanCredits(
  supabase: SupabaseClient,
  organizationId: string,
  plan: BillingPlan
) {
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('grant_plan_credits', {
      p_org_id: organizationId,
      p_plan: plan,
    });

    if (!rpcError && rpcData?.success) {
      return rpcData;
    }

    // Direct fallback
    const credits = PLAN_DEFAULT_CREDITS[plan] ?? PLAN_DEFAULT_CREDITS.free;

    await supabase
      .from('billing_credits')
      .upsert(
        {
          organization_id: organizationId,
          ai_content_credits: credits.content,
          ai_image_credits: credits.image,
          ai_video_credits: credits.video,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id' }
      );

    await supabase.from('billing_credit_transactions').insert([
      {
        organization_id: organizationId,
        type: 'grant',
        credit_type: 'content',
        amount: credits.content,
        balance_after: credits.content,
        description: `${plan.toUpperCase()} plan quota grant (Content)`,
      },
      {
        organization_id: organizationId,
        type: 'grant',
        credit_type: 'image',
        amount: credits.image,
        balance_after: credits.image,
        description: `${plan.toUpperCase()} plan quota grant (Image)`,
      },
      {
        organization_id: organizationId,
        type: 'grant',
        credit_type: 'video',
        amount: credits.video,
        balance_after: credits.video,
        description: `${plan.toUpperCase()} plan quota grant (Video)`,
      },
    ]);

    return { success: true, plan, credits };
  } catch (error: any) {
    console.error('Error granting plan credits:', error);
    throw error;
  }
}
