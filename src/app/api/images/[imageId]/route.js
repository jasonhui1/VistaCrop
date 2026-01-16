import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { getImageMeta, saveImage, loadImageAsDataUrl, deleteImage } from '@/lib/imageDb';

/**
 * GET /api/images/{imageId}
 * Retrieve a stored image by ID (returns base64 data URL)
 */
export async function GET(request, { params }) {
    const { imageId } = await params;

    const meta = getImageMeta(imageId);
    if (!meta) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const dataUrl = loadImageAsDataUrl(imageId);
    if (!dataUrl) {
        return NextResponse.json({ error: 'Image file not found' }, { status: 404 });
    }

    return NextResponse.json({
        id: imageId,
        data: dataUrl,
        width: meta.width,
        height: meta.height,
        createdAt: meta.createdAt,
        updatedAt: meta.updatedAt
    });
}

/**
 * POST /api/images/{imageId}
 * Upload/save an image
 */
export async function POST(request, { params }) {
    const { imageId } = await params;
    const body = await request.json();
    const { data, width, height } = body;

    if (!data) {
        return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    try {
        const result = saveImage(imageId, data, { width, height });
        return NextResponse.json({
            success: true,
            imageId,
            path: result.path
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

/**
 * DELETE /api/images/{imageId}
 * Delete an image and optionally its associated crops
 */
export async function DELETE(request, { params }) {
    const { imageId } = await params;
    const { searchParams } = new URL(request.url);
    const deleteCrops = searchParams.get('deleteCrops') === 'true';

    // Delete image file
    const deleted = deleteImage(imageId);
    if (!deleted) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Optionally delete associated crops from main db
    let cropsDeleted = 0;
    if (deleteCrops) {
        const db = readDb();
        if (db.crops) {
            const initialCropsLength = db.crops.length;
            db.crops = db.crops.filter(c => c.imageId !== imageId);
            cropsDeleted = initialCropsLength - db.crops.length;
            writeDb(db);
        }
    }

    return NextResponse.json({ success: true, cropsDeleted });
}
