import { NextRequest, NextResponse } from 'next/server';
import { uploadVideoMaterial, uploadBrandAsset } from '@/lib/r2-storage';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const type = formData.get('type') as string;
    const materialName = formData.get('name') as string || file.name;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upload to R2
    const uploadResult = await uploadVideoMaterial(
      file,
      projectId,
      type as 'video' | 'image' | 'audio' | 'overlay'
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 500 }
      );
    }

    // Save metadata to Supabase
    const { data: material, error: dbError } = await supabase
      .from('project_materials')
      .insert({
        project_id: projectId,
        name: materialName,
        type: type,
        file_url: uploadResult.url,
        file_key: uploadResult.key,
        file_size_bytes: file.size,
        mime_type: file.type,
        status: 'ready',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save file metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      material: {
        id: material.id,
        url: uploadResult.url,
        key: uploadResult.key,
        name: materialName,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

// Handle presigned URL generation for direct browser uploads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type') || 'video';

    if (!fileName || !projectId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Import dynamically to avoid module issues
    const { getPresignedUploadUrl } = await import('@/lib/r2-storage');
    
    const folder = `projects/${projectId}/${type}s`;
    const { url, key, publicUrl } = await getPresignedUploadUrl(fileName, {
      folder,
    });

    return NextResponse.json({
      uploadUrl: url,
      key,
      publicUrl,
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}