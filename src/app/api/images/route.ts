import { NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage';


export async function GET() {
    const storage = getStorageAdapter();
    const images = await storage.listImages();
    return NextResponse.json({ images });
}
