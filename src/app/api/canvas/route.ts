import { NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage/server';

export async function GET() {
    const storage = getStorageAdapter();
    const canvases = await storage.listCanvases();
    return NextResponse.json(canvases);
}

export async function POST(request: Request) {
    const body = await request.json();
    const storage = getStorageAdapter();
    const result = await storage.createCanvas(body);
    return NextResponse.json(result);
}
