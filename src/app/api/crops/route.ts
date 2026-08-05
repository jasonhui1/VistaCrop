import { NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage';


export async function GET() {
    const storage = getStorageAdapter();
    const crops = await storage.loadAllCrops();
    return NextResponse.json({ crops });
}
