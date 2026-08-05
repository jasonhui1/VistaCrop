import { StorageAdapter } from './StorageAdapter.ts';
import { JsonStorageAdapter } from './JsonStorageAdapter.ts';

let activeAdapter: StorageAdapter = new JsonStorageAdapter();

/**
 * Get the current storage adapter instance
 */
export function getStorageAdapter(): StorageAdapter {
    return activeAdapter;
}

/**
 * Set a custom storage adapter instance
 */
export function setStorageAdapter(adapter: StorageAdapter): void {
    if (!adapter) {
        throw new Error('Adapter cannot be null or undefined');
    }
    activeAdapter = adapter;
}

export { StorageAdapter, JsonStorageAdapter };
