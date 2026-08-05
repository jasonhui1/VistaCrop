import { StorageAdapter } from './StorageAdapter';
import { createApiClient } from '../../utils/api';
import { createAdapterRegistry } from './adapterRegistry';

const { getStorageAdapter, setStorageAdapter } = createAdapterRegistry(() => createApiClient());

export { StorageAdapter, getStorageAdapter, setStorageAdapter };
