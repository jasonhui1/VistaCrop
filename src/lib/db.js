import fs from 'fs';
import path from 'path';

// Store data in the project root under /data
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

function ensureDb() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ crops: [], canvases: [], images: [] }, null, 2));
    }
}

export function readDb() {
    ensureDb();
    const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
    try {
        return JSON.parse(fileContent);
    } catch (error) {
        // If JSON is corrupt, return empty structure
        return { crops: [], canvases: [], images: [] };
    }
}

export function writeDb(data) {
    ensureDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}
