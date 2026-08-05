import test from 'node:test';
import assert from 'node:assert/strict';
import { exportCanvas } from '../src/utils/exportCanvas.ts';
import { withImmediateImageLoading } from './helpers/canvasStubs.mjs';

const composition = {
    pageWidth: 200,
    pageHeight: 200,
    backgroundColor: '#ffffff',
    assignments: {}
};

test('exportCanvas resolves original images through the supplied storage adapter', async () => {
    const requestedImageIds = [];
    const storage = {
        async getImage(imageId) {
            requestedImageIds.push(imageId);
            return { id: imageId, data: 'data:image/png;base64,original' };
        }
    };

    const crop = {
        id: 'crop1',
        imageId: 'img1',
        imageData: 'data:image/png;base64,cropped',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        rotation: 30
    };

    await withImmediateImageLoading(() => exportCanvas({
        composition,
        panels: [],
        crops: [crop],
        mode: 'freeform',
        placedItems: [{ id: 'item1', cropId: 'crop1', x: 0, y: 0, width: 50, height: 50, rotation: 30 }],
        storage
    }));

    assert.deepEqual(requestedImageIds, ['img1']);
});

test('exportCanvas leaves the adapter alone when nothing needs the original image', async () => {
    let called = false;
    const storage = {
        async getImage() {
            called = true;
            return null;
        }
    };

    const crop = {
        id: 'crop1',
        imageId: 'img1',
        imageData: 'data:image/png;base64,cropped',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        rotation: 0
    };

    await withImmediateImageLoading(() => exportCanvas({
        composition,
        panels: [],
        crops: [crop],
        mode: 'freeform',
        placedItems: [{ id: 'item1', cropId: 'crop1', x: 0, y: 0, width: 50, height: 50, rotation: 0 }],
        storage
    }));

    assert.equal(called, false);
});
