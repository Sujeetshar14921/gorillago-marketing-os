import type { SupabaseClient } from '@supabase/supabase-js';

export interface StorageUploadResult {
  success: boolean;
  publicUrl?: string;
  path?: string;
  fileSizeBytes?: number;
  error?: string;
}

export const MEDIA_BUCKET_NAME = 'media';

/**
 * Upload a binary buffer directly to Supabase Storage and return its public CDN URL.
 */
export async function uploadBufferToStorage(
  supabase: SupabaseClient,
  buffer: Buffer | Uint8Array,
  path: string,
  contentType: string = 'image/jpeg'
): Promise<StorageUploadResult> {
  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET_NAME)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      return {
        success: false,
        error: uploadError.message,
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from(MEDIA_BUCKET_NAME)
      .getPublicUrl(uploadData.path || path);

    if (!publicUrlData?.publicUrl) {
      return {
        success: false,
        error: 'Failed to retrieve public CDN URL from storage.',
      };
    }

    return {
      success: true,
      publicUrl: publicUrlData.publicUrl,
      path: uploadData.path || path,
      fileSizeBytes: buffer.length,
    };
  } catch (err: any) {
    console.error('Storage upload exception:', err);
    return {
      success: false,
      error: err?.message || 'Unexpected storage upload failure.',
    };
  }
}

/**
 * Download an ephemeral remote asset (such as Replicate temporary video output)
 * and persist it permanently in the Supabase Storage media bucket.
 */
export async function uploadRemoteUrlToStorage(
  supabase: SupabaseClient,
  remoteUrl: string,
  targetPath: string,
  contentType: string = 'video/mp4'
): Promise<StorageUploadResult> {
  try {
    const response = await fetch(remoteUrl, {
      signal: AbortSignal.timeout(60000), // 60s timeout for large video downloads
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch remote asset: ${response.status} ${response.statusText}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return await uploadBufferToStorage(supabase, buffer, targetPath, contentType);
  } catch (err: any) {
    console.error('Failed to download & persist remote media asset:', err);
    return {
      success: false,
      error: err?.message || 'Failed to download and persist remote media asset.',
    };
  }
}
