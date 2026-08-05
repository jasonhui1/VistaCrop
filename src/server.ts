/**
 * Server-only API surface for VistaCrop.
 *
 * Pulls in Node builtins (fs, path) via the file-backed adapter and db
 * adapters, so this entrypoint must never be imported from browser code.
 */

export {
    getStorageAdapter,
    setStorageAdapter,
    StorageAdapter,
    JsonStorageAdapter,
    DbCanvasStorageAdapter,
    DbImageStorageAdapter,
    DbCropStorageAdapter
} from './lib/storage/server';
