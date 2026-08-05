import { StorageAdapter } from './StorageAdapter';
import { JsonStorageAdapter } from './JsonStorageAdapter';
import { createApiClient } from '../../utils/api';

let activeAdapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
    if (activeAdapter) return activeAdapter;
    if (typeof window !== 'undefined') {
        return createApiClient();
    }
    return new JsonStorageAdapter();
}

export function setStorageAdapter(adapter: StorageAdapter): void {
    if (!adapter) {
        throw new Error('Adapter cannot be null or undefined');
    }
    activeAdapter = adapter;
}

export { StorageAdapter, JsonStorageAdapter };
