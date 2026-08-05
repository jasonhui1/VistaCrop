import test from 'node:test';
import assert from 'node:assert/strict';
import { StorageAdapter, JsonStorageAdapter, getStorageAdapter, setStorageAdapter } from '../src/lib/storage/index.js';

test('StorageAdapter base class throws on unimplemeted methods', async () => {
    class UnimplementedAdapter extends StorageAdapter {}
    const adapter = new UnimplementedAdapter();

    await assert.rejects(() => adapter.listCanvases(), /must be implemented/);
    await assert.rejects(() => adapter.getCanvas('1'), /must be implemented/);
    await assert.rejects(() => adapter.createCanvas(), /must be implemented/);
    await assert.rejects(() => adapter.saveCanvas('1', {}, []), /must be implemented/);
    await assert.rejects(() => adapter.deleteCanvas('1'), /must be implemented/);

    await assert.rejects(() => adapter.loadAllCrops(), /must be implemented/);
    await assert.rejects(() => adapter.loadCrops('img1'), /must be implemented/);
    await assert.rejects(() => adapter.getCrop('c1'), /must be implemented/);
    await assert.rejects(() => adapter.saveCrops('img1', []), /must be implemented/);
    await assert.rejects(() => adapter.updateCrop('img1', 'c1', {}), /must be implemented/);
    await assert.rejects(() => adapter.deleteCrop('img1', 'c1'), /must be implemented/);

    await assert.rejects(() => adapter.listImages(), /must be implemented/);
    await assert.rejects(() => adapter.getImage('img1'), /must be implemented/);
    await assert.rejects(() => adapter.saveImage('img1', 'data:image/png;base64,123'), /must be implemented/);
    await assert.rejects(() => adapter.deleteImage('img1'), /must be implemented/);
});

test('getStorageAdapter returns JsonStorageAdapter by default', () => {
    const adapter = getStorageAdapter();
    assert.ok(adapter instanceof JsonStorageAdapter);
    assert.ok(adapter instanceof StorageAdapter);
});

test('setStorageAdapter allows custom adapter injection', async () => {
    class CustomMemoryAdapter extends StorageAdapter {
        constructor() {
            super();
            this.canvases = [];
        }
        async listCanvases() {
            return this.canvases;
        }
        async createCanvas(options = {}) {
            const canvas = { id: 'custom-1', ...options };
            this.canvases.push(canvas);
            return canvas;
        }
    }

    const customAdapter = new CustomMemoryAdapter();
    setStorageAdapter(customAdapter);

    assert.equal(getStorageAdapter(), customAdapter);
    const canvas = await getStorageAdapter().createCanvas({ name: 'Memory Canvas' });
    assert.equal(canvas.name, 'Memory Canvas');

    const canvases = await getStorageAdapter().listCanvases();
    assert.equal(canvases.length, 1);
    assert.equal(canvases[0].id, 'custom-1');

    // Reset back to JsonStorageAdapter
    setStorageAdapter(new JsonStorageAdapter());
    assert.ok(getStorageAdapter() instanceof JsonStorageAdapter);
});
