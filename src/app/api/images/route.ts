import { NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage/server';

/**
 * GET /api/images
 * List all stored images (returns metadata only)
 */
export async function GET() {
    const storage = getStorageAdapter();
    const images = await storage.listImages();
    return NextResponse.json({ images });
}
