import fs from 'fs';
import path from 'path';
import type { Composition, PlacedItem, SavedCanvas, Crop, StoredImage, CanvasStorageAdapter, CreateCanvasResponse, OperationSuccessResponse } from '../types.ts';

export interface DbData {
    crops: Crop[];
    canvases: SavedCanvas[];
    images: StoredImage[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

function ensureDb(): void {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ crops: [], canvases: [], images: [] }, null, 2));
    }
}

export function readDb(): DbData {
    ensureDb();
    const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
    try {
        return JSON.parse(fileContent);
    } catch {
        return { crops: [], canvases: [], images: [] };
    }
}

export function writeDb(data: DbData): void {
    ensureDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}


export class DbCanvasStorageAdapter implements CanvasStorageAdapter {
    async listCanvases(): Promise<SavedCanvas[]> {
        const db = readDb();
        return db.canvases || [];
    }

    async getCanvas(canvasId: string): Promise<SavedCanvas | null> {
        const db = readDb();
        const canvas = (db.canvases || []).find(c => String(c.id) === String(canvasId));
        return canvas || null;
    }

    async loadCanvas(canvasId: string): Promise<SavedCanvas | null> {
        return this.getCanvas(canvasId);
    }

    async createCanvas(options: { name?: string; mode?: string; composition?: Composition; placedItems?: PlacedItem[]; [key: string]: unknown } = {}): Promise<CreateCanvasResponse & SavedCanvas> {
        const db = readDb();
        const defaultComposition: Composition = {
            id: Date.now().toString(),
            name: options.name || 'Untitled Canvas',
            layoutId: 'single',
            pagePreset: 'custom',
            pageWidth: 800,
            pageHeight: 600,
            margin: 0,
            backgroundColor: '#ffffff',
            assignments: []
        };

        const newCanvas: SavedCanvas = {
            id: Date.now().toString(),
            name: options.name,
            mode: options.mode,
            composition: options.composition || defaultComposition,
            placedItems: options.placedItems || [],
            ...options,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        if (!db.canvases) db.canvases = [];
        db.canvases.push(newCanvas);
        writeDb(db);

        return { canvasId: String(newCanvas.id), ...newCanvas };
    }

    async saveCanvas(canvasId: string, composition: Composition, placedItems: PlacedItem[] = []): Promise<OperationSuccessResponse & SavedCanvas> {
        const db = readDb();
        if (!db.canvases) db.canvases = [];

        const index = db.canvases.findIndex(c => String(c.id) === String(canvasId));

        if (index === -1) {
            throw new Error(`Canvas not found: ${canvasId}`);
        }

        const updates = { composition, placedItems, updatedAt: Date.now() };
        db.canvases[index] = { ...db.canvases[index], ...updates };
        writeDb(db);

        return { success: true, ...db.canvases[index] };
    }

    async deleteCanvas(canvasId: string): Promise<OperationSuccessResponse> {
        const db = readDb();
        if (!db.canvases) return { success: true };

        db.canvases = db.canvases.filter(c => String(c.id) !== String(canvasId));
        writeDb(db);
        return { success: true };
    }
}
