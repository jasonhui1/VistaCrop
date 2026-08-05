import { StorageAdapter } from './StorageAdapter';

export function createAdapterRegistry(createDefault: () => StorageAdapter) {
    let activeAdapter: StorageAdapter | null = null;

    function getStorageAdapter(): StorageAdapter {
        if (activeAdapter) return activeAdapter;
        return createDefault();
    }

    function setStorageAdapter(adapter: StorageAdapter): void {
        if (!adapter) {
            throw new Error('Adapter cannot be null or undefined');
        }
        activeAdapter = adapter;
    }

    return { getStorageAdapter, setStorageAdapter };
}
