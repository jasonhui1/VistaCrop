import fs from 'fs';
import path from 'path';

// Store image mapping in a separate file
const DB_DIR = path.join(process.cwd(), 'data');
const IMAGE_DB_FILE = path.join(DB_DIR, 'imageDb.json');
const IMAGES_DIR = path.join(DB_DIR, 'images');

function ensureImageDb() {
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
 * @returns {{ images: Record<string, { path: string, width?: number, height?: number, createdAt: number, updatedAt: number }> }}
 */
export function readImageDb() {
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
export function writeImageDb(data) {
    ensureImageDb();
    fs.writeFileSync(IMAGE_DB_FILE, JSON.stringify(data, null, 2));
}

/**
 * Get image metadata by ID
 * @param {string} imageId 
 * @returns {{ path: string, width?: number, height?: number, createdAt: number, updatedAt: number } | null}
 */
export function getImageMeta(imageId) {
    const db = readImageDb();
    return db.images[imageId] || null;
}

/**
 * Get the full file path for an image
 * @param {string} imageId 
 * @returns {string | null}
 */
export function getImageFilePath(imageId) {
    const meta = getImageMeta(imageId);
    if (!meta) return null;
    return path.join(IMAGES_DIR, meta.path);
}

/**
 * Save an image file and create mapping
 * @param {string} imageId 
 * @param {string} base64Data - Base64 data URL (e.g., "data:image/png;base64,...")
 * @param {{ width?: number, height?: number }} metadata
 * @returns {{ path: string }}
 */
export function saveImage(imageId, base64Data, metadata = {}) {
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

/**
 * Load an image as base64 data URL
 * @param {string} imageId 
 * @returns {string | null} Base64 data URL or null if not found
 */
export function loadImageAsDataUrl(imageId) {
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
 * @param {string} imageId 
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteImage(imageId) {
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

/**
 * List all images (metadata only)
 * @returns {Array<{ id: string, width?: number, height?: number, createdAt: number, updatedAt: number }>}
 */
export function listImages() {
    const db = readImageDb();
    return Object.entries(db.images).map(([id, meta]) => ({
        id,
        width: meta.width,
        height: meta.height,
        createdAt: meta.createdAt,
        updatedAt: meta.updatedAt
    }));
}
