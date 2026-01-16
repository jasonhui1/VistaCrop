import { NextResponse } from 'next/server';
import { listImages } from '@/lib/imageDb';

/**
 * GET /api/images
 * List all stored images (returns metadata only)
 */
export async function GET() {
    const images = listImages();
    return NextResponse.json({ images });
}
