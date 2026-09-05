import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { uploadBufferToStorage } from '@/lib/storage/media';
import type { MediaCategory } from '@/types/database';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to upload media.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const organizationId = formData.get('organizationId') as string | null;
    const category = (formData.get('category') as MediaCategory) || 'user_upload';
    const productId = (formData.get('productId') as string) || null;
    const platform = (formData.get('platform') as string) || null;

    if (!file) {
      return NextResponse.json({ error: 'No file was provided.' }, { status: 400 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file format (${file.type}). Supported types are JPG, PNG, WebP, GIF, MP4, QuickTime, WebM.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 50 MB limit.' },
        { status: 400 }
      );
    }

    const isVideo = file.type.startsWith('video/');
    const fileExt = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const targetPath = `uploads/${organizationId}/${Date.now()}-${sanitizedName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const uploadResult = await uploadBufferToStorage(supabase, buffer, targetPath, file.type);

    if (!uploadResult.success || !uploadResult.publicUrl) {
      return NextResponse.json(
        {
          error: 'Failed to upload file to Supabase Storage.',
          details: uploadResult.error,
        },
        { status: 500 }
      );
    }

    const finalUrl = uploadResult.publicUrl;

    // Save metadata in media_assets table
    const { data: record, error: dbError } = await supabase
      .from('media_assets')
      .insert({
        organization_id: organizationId,
        product_id: productId && productId !== 'none' ? productId : null,
        type: isVideo ? 'video' : 'image',
        category,
        url: finalUrl,
        thumbnail_url: finalUrl,
        platform: platform && platform !== 'none' ? platform : null,
        format: fileExt,
        file_size_bytes: file.size,
        ai_generated: false,
        created_by: user.id,
        metadata: {
          original_name: file.name,
          mime_type: file.type,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error for media upload:', dbError);
      return NextResponse.json(
        { error: 'Failed to save media metadata to database.', details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: record });
  } catch (error: any) {
    console.error('Media upload endpoint error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload media.' },
      { status: 500 }
    );
  }
}
