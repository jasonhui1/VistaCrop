import fs from 'fs';
import path from 'path';

// Store crop preview images in a separate folder
const DB_DIR = path.join(process.cwd(), 'data');
const CROPS_DIR = path.join(DB_DIR, 'crops');

function ensureCropsDir() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(CROPS_DIR)) {
        fs.mkdirSync(CROPS_DIR, { recursive: true });
    }
}

/**
 * Save a crop preview image to file
 * @param {string|number} cropId - The crop ID
 * @param {string} base64Data - Base64 data URL (e.g., "data:image/png;base64,...")
 * @returns {string} The relative path to the saved file
 */
export function saveCropPreview(cropId, base64Data) {
    ensureCropsDir();

    // Extract the base64 content and mime type
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
        throw new Error('Invalid base64 image data');
    }

    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Content = matches[2];
    const fileName = `${cropId}.${extension}`;
    const filePath = path.join(CROPS_DIR, fileName);

    // Write image file
    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(filePath, buffer);

    return fileName;
}

/**
 * Load a crop preview image as base64 data URL
 * @param {string} fileName - The file name of the crop preview
 * @returns {string | null} Base64 data URL or null if not found
 */
export function loadCropPreview(fileName) {
    ensureCropsDir();

    const filePath = path.join(CROPS_DIR, fileName);
    if (!fs.existsSync(filePath)) return null;

    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');

    // Determine mime type from extension
    const ext = path.extname(fileName).slice(1).toLowerCase();
    const mimeType = ext === 'jpg' ? 'jpeg' : ext;

    return `data:image/${mimeType};base64,${base64}`;
}

/**
 * Delete a crop preview file
 * @param {string} fileName - The file name of the crop preview
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteCropPreview(fileName) {
    if (!fileName) return false;

    const filePath = path.join(CROPS_DIR, fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
}

/**
 * Check if a crop preview file exists
 * @param {string} fileName - The file name
 * @returns {boolean}
 */
export function cropPreviewExists(fileName) {
    if (!fileName) return false;
    const filePath = path.join(CROPS_DIR, fileName);
    return fs.existsSync(filePath);
}
