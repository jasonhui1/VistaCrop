import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function PATCH(request, { params }) {
    const { cropId } = await params;
    const body = await request.json();

    const db = readDb();
    const cropIndex = db.crops.findIndex(c => String(c.id) === String(cropId));

    if (cropIndex === -1) {
        return NextResponse.json({ error: 'Crop not found' }, { status: 404 });
    }

    db.crops[cropIndex] = { ...db.crops[cropIndex], ...body, updatedAt: Date.now() };
    writeDb(db);

    return NextResponse.json(db.crops[cropIndex]);
}

export async function DELETE(request, { params }) {
    const { cropId } = await params;

    const db = readDb();
    const initialLength = db.crops.length;
    db.crops = db.crops.filter(c => String(c.id) !== String(cropId));

    if (db.crops.length === initialLength) {
        return NextResponse.json({ error: 'Crop not found' }, { status: 404 });
    }

    writeDb(db);

    return NextResponse.json({ success: true });
}
