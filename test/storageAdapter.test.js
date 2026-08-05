import test from 'node:test';
import assert from 'node:assert/strict';
import { StorageAdapter, JsonStorageAdapter, getStorageAdapter, setStorageAdapter } from '../src/lib/storage/server.ts';

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

test('JsonStorageAdapter deleteImage with deleteCrops deletes associated crops', async () => {
    const adapter = new JsonStorageAdapter();
    const testImageId = 'test_delete_crops_img_' + Date.now();
    const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    // 1. Upload test image
    await adapter.saveImage(testImageId, sampleBase64, { width: 10, height: 10 });
    const img = await adapter.getImage(testImageId);
    assert.ok(img);

    // 2. Save crop for test image
    const cropId = 'crop_' + Date.now();
    await adapter.saveCrops(testImageId, [{ id: cropId, x: 0, y: 0, width: 5, height: 5, imageData: sampleBase64 }]);
    const cropsBefore = await adapter.loadCrops(testImageId);
    assert.equal(cropsBefore.length, 1);

    // 3. Delete image with deleteCrops = true
    const result = await adapter.deleteImage(testImageId, true);
    assert.equal(result.success, true);
    assert.equal(result.cropsDeleted, 1);

    // 4. Verify image and crops are deleted
    const imgAfter = await adapter.getImage(testImageId);
    assert.equal(imgAfter, null);
    const cropsAfter = await adapter.loadCrops(testImageId);
    assert.equal(cropsAfter.length, 0);
});

