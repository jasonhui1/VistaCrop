import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function GET(request, { params }) {
    const { imageId } = await params;
    const db = readDb();

    // Return crops linked to this imageId (assuming crops have `imageId` or linked via originalImage param handled by client)
    // Based on current App.jsx, crops might not have 'imageId' explicitly, but api.js sends it in URL.
    // We will store them in a way that links them.
    // Strategy: filter db.crops where crop.imageId === imageId

    const crops = db.crops.filter(c => c.imageId === imageId);

    return NextResponse.json({ crops });
}

export async function POST(request, { params }) {
    const { imageId } = await params;
    const body = await request.json();
    const { crops } = body;

    if (!Array.isArray(crops)) {
        return NextResponse.json({ error: 'Invalid crops data' }, { status: 400 });
    }

    const db = readDb();

    // Remove existing crops for this image
    const otherCrops = db.crops.filter(c => c.imageId !== imageId);

    // Add new crops, ensuring they are tagged with imageId
    const newCrops = crops.map(c => ({
        ...c,
        imageId, // Ensure explicit link
        updatedAt: Date.now()
    }));

    db.crops = [...otherCrops, ...newCrops];
    writeDb(db);

    return NextResponse.json({ success: true, count: newCrops.length });
}
