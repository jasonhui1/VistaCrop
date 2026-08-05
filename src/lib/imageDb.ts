import fs from 'fs';
import path from 'path';
import type { ImageStorageAdapter, StoredImage, OperationSuccessResponse } from '../types.ts';

export interface ImageMeta {
    path: string;
    width?: number | null;
    height?: number | null;
    createdAt: number;
    updatedAt: number;
}

export interface ImageDbData {
    images: Record<string, ImageMeta>;
}

// Store image mapping in a separate file
const DB_DIR = path.join(process.cwd(), 'data');
const IMAGE_DB_FILE = path.join(DB_DIR, 'imageDb.json');
const IMAGES_DIR = path.join(DB_DIR, 'images');

function ensureImageDb(): void {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(IMAGES_DIR)) {
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }
    if (!fs.existsSync(IMAGE_DB_FILE)) {
        fs.writeFileSync(IMAGE_DB_FILE, JSON.stringify({ images: {} }, null, 2));
    }
}

/**
 * Read the image database
 */
export function readImageDb(): ImageDbData {
    ensureImageDb();
    try {
        const content = fs.readFileSync(IMAGE_DB_FILE, 'utf-8');
        return JSON.parse(content);
    } catch {
        return { images: {} };
    }
}

/**
 * Write to the image database
 */
export function writeImageDb(data: ImageDbData): void {
    ensureImageDb();
    fs.writeFileSync(IMAGE_DB_FILE, JSON.stringify(data, null, 2));
}

/**
 * Get image metadata by ID
 */
export function getImageMeta(imageId: string): ImageMeta | null {
    const db = readImageDb();
    return db.images[imageId] || null;
}

/**
 * Get the full file path for an image
 */
export function getImageFilePath(imageId: string): string | null {
    const meta = getImageMeta(imageId);
    if (!meta) return null;
    return path.join(IMAGES_DIR, meta.path);
}

/**
 * Save an image file and create mapping
 */
export function saveImageFile(
    imageId: string,
    base64Data: string,
    metadata: { width?: number; height?: number } = {}
): { path: string } {
    ensureImageDb();

    // Extract the base64 content and mime type
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
        throw new Error('Invalid base64 image data');
    }

    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Content = matches[2];
    const fileName = `${imageId}.${extension}`;
    const filePath = path.join(IMAGES_DIR, fileName);

    // Write image file
    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(filePath, buffer);

    // Update database
    const db = readImageDb();
    db.images[imageId] = {
        path: fileName,
        width: metadata.width || null,
        height: metadata.height || null,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    writeImageDb(db);

    return { path: fileName };
}

export { saveImageFile as saveImage };

/**
 * Load an image as base64 data URL
 */
export function loadImageAsDataUrl(imageId: string): string | null {
    const meta = getImageMeta(imageId);
    if (!meta) return null;

    const filePath = path.join(IMAGES_DIR, meta.path);
    if (!fs.existsSync(filePath)) return null;

    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');

    // Determine mime type from extension
    const ext = path.extname(meta.path).slice(1).toLowerCase();
    const mimeType = ext === 'jpg' ? 'jpeg' : ext;

    return `data:image/${mimeType};base64,${base64}`;
}

/**
 * Delete an image file and its mapping
 */
export function deleteImageFile(imageId: string): boolean {
    const db = readImageDb();
    const meta = db.images[imageId];

    if (!meta) return false;

    // Delete file
    const filePath = path.join(IMAGES_DIR, meta.path);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    // Remove from database
    delete db.images[imageId];
    writeImageDb(db);

    return true;
}

export { deleteImageFile as deleteImage };

/**
 * List all images (metadata only)
 */
export function listImagesMeta(): Array<{ id: string; width?: number | null; height?: number | null; createdAt: number; updatedAt: number }> {
    const db = readImageDb();
    return Object.entries(db.images).map(([id, meta]) => ({
        id,
        width: meta.width,
        height: meta.height,
        createdAt: meta.createdAt,
        updatedAt: meta.updatedAt
    }));
}

export { listImagesMeta as listImages };

/**
 * Image Storage Adapter class implementing ImageStorageAdapter for image operations
 */
export class DbImageStorageAdapter implements ImageStorageAdapter {
    async listImages(): Promise<StoredImage[]> {
        const images = listImagesMeta();
        return images.map(img => ({
            id: img.id,
            width: img.width || undefined,
            height: img.height || undefined,
            createdAt: img.createdAt,
            updatedAt: img.updatedAt
        }));
    }

    async getImage(imageId: string): Promise<StoredImage | null> {
        const meta = getImageMeta(imageId);
        if (!meta) return null;

        const dataUrl = loadImageAsDataUrl(imageId);
        if (!dataUrl) return null;

        return {
            id: imageId,
            data: dataUrl,
            width: meta.width || undefined,
            height: meta.height || undefined,
            createdAt: meta.createdAt,
            updatedAt: meta.updatedAt
        };
    }

    async uploadImage(imageId: string, base64Data: string, metadata: { width?: number; height?: number } = {}): Promise<StoredImage> {
        const result = saveImageFile(imageId, base64Data, metadata);
        return {
            id: imageId,
            data: base64Data,
            width: metadata.width,
            height: metadata.height,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    async saveImage(imageId: string, base64Data: string, metadata: { width?: number; height?: number } = {}): Promise<StoredImage & { success: boolean; path: string }> {
        const result = saveImageFile(imageId, base64Data, metadata);
        return {
            success: true,
            id: imageId,
            path: result.path
        };
    }

    async deleteImage(imageId: string, deleteCrops: boolean = false): Promise<OperationSuccessResponse & { cropsDeleted?: number }> {
        const deleted = deleteImageFile(imageId);
        if (!deleted) {
            return { success: false, cropsDeleted: 0 };
        }
        return { success: true };
    }
}
