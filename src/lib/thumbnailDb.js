import fs from 'fs';
import path from 'path';

// Store canvas thumbnail images in a separate folder
const DB_DIR = path.join(process.cwd(), 'data');
const THUMBNAILS_DIR = path.join(DB_DIR, 'thumbnails');

function ensureThumbnailsDir() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(THUMBNAILS_DIR)) {
        fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
    }
}

/**
 * Save a canvas thumbnail image to file
 * @param {string} canvasId - The canvas ID
 * @param {string} base64Data - Base64 data URL (e.g., "data:image/jpeg;base64,...")
 * @returns {string} The relative path to the saved file
 */
export function saveThumbnail(canvasId, base64Data) {
    ensureThumbnailsDir();

    // Extract the base64 content and mime type
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
        throw new Error('Invalid base64 image data');
    }

    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Content = matches[2];
    const fileName = `${canvasId}.${extension}`;
    const filePath = path.join(THUMBNAILS_DIR, fileName);

    // Write image file
    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(filePath, buffer);

    return fileName;
}

/**
 * Load a canvas thumbnail as base64 data URL
 * @param {string} fileName - The file name of the thumbnail
 * @returns {string | null} Base64 data URL or null if not found
 */
export function loadThumbnail(fileName) {
    if (!fileName) return null;
    ensureThumbnailsDir();

    const filePath = path.join(THUMBNAILS_DIR, fileName);
    if (!fs.existsSync(filePath)) return null;

    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');

    // Determine mime type from extension
    const ext = path.extname(fileName).slice(1).toLowerCase();
    const mimeType = ext === 'jpg' ? 'jpeg' : ext;

    return `data:image/${mimeType};base64,${base64}`;
}

/**
 * Delete a canvas thumbnail file
 * @param {string} fileName - The file name of the thumbnail
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteThumbnail(fileName) {
    if (!fileName) return false;

    const filePath = path.join(THUMBNAILS_DIR, fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
}

/**
 * Check if a thumbnail file exists
 * @param {string} fileName - The file name
 * @returns {boolean}
 */
export function thumbnailExists(fileName) {
    if (!fileName) return false;
    const filePath = path.join(THUMBNAILS_DIR, fileName);
    return fs.existsSync(filePath);
}
