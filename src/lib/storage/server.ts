import { StorageAdapter } from './StorageAdapter';
import { JsonStorageAdapter } from './JsonStorageAdapter';
import { DbCanvasStorageAdapter } from '../db';
import { DbImageStorageAdapter } from '../imageDb';
import { DbCropStorageAdapter } from '../cropDb';
import { createAdapterRegistry } from './adapterRegistry';

const { getStorageAdapter, setStorageAdapter } = createAdapterRegistry(() => new JsonStorageAdapter());

export {
    StorageAdapter,
    JsonStorageAdapter,
    DbCanvasStorageAdapter,
    DbImageStorageAdapter,
    DbCropStorageAdapter,
    getStorageAdapter,
    setStorageAdapter
};
