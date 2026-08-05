import { NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage/server';

/**
 * GET /api/images/{imageId}
 * Retrieve a stored image by ID (returns base64 data URL)
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ imageId: string }> }
) {
    const { imageId } = await params;
    const storage = getStorageAdapter();
    const image = await storage.getImage(imageId);

    if (!image) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json(image);
}

/**
 * POST /api/images/{imageId}
 * Upload/save an image
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ imageId: string }> }
) {
    const { imageId } = await params;
    const body = await request.json();
    const { data, width, height } = body;

    if (!data) {
        return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    try {
        const storage = getStorageAdapter();
        const result = await storage.saveImage(imageId, data, { width, height });
        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

/**
 * DELETE /api/images/{imageId}
 * Delete an image and optionally its associated crops
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ imageId: string }> }
) {
    const { imageId } = await params;
    const { searchParams } = new URL(request.url);
    const deleteCrops = searchParams.get('deleteCrops') === 'true';

    const storage = getStorageAdapter();
    const result = await storage.deleteImage(imageId, deleteCrops);

    if (!result.success) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json(result);
}
