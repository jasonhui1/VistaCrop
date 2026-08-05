import { StorageAdapter } from './StorageAdapter.js';
import { JsonStorageAdapter } from './JsonStorageAdapter.js';

let activeAdapter = new JsonStorageAdapter();

/**
 * Get the current storage adapter instance
 * @returns {StorageAdapter}
 */
export function getStorageAdapter() {
    return activeAdapter;
}

/**
 * Set a custom storage adapter instance
 * @param {StorageAdapter} adapter 
 */
export function setStorageAdapter(adapter) {
    if (!adapter) {
        throw new Error('Adapter cannot be null or undefined');
    }
    activeAdapter = adapter;
}

export { StorageAdapter, JsonStorageAdapter };
