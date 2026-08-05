import fs from 'fs';
import path from 'path';

export const DB_DIR = path.join(process.cwd(), 'data');


export function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

export interface ParsedBase64Image {
    extension: string;
    mimeType: string;
    base64Content: string;
}


export function parseBase64Image(base64Data: string): ParsedBase64Image {
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
        throw new Error('Invalid base64 image data');
    }

    const rawExt = matches[1].toLowerCase();
    const extension = rawExt === 'jpeg' ? 'jpg' : rawExt;
    const mimeType = rawExt === 'jpg' ? 'jpeg' : rawExt;
    const base64Content = matches[2];

    return { extension, mimeType, base64Content };
}
