import { NextResponse } from 'next/server';
import { getStorageAdapter } from '@/server';

/**
 * GET /api/crops
 * Get all crops from all images (with imageData loaded from storage)
 */
export async function GET() {
    const storage = getStorageAdapter();
    const crops = await storage.loadAllCrops();
    return NextResponse.json({ crops });
}
