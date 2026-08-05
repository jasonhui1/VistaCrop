import { StorageAdapter } from './StorageAdapter.ts';
import { JsonStorageAdapter } from './JsonStorageAdapter.ts';
import { createApiClient } from '../../utils/api.ts';

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
