import test from 'node:test';
import assert from 'node:assert/strict';
import { useUndoRedo } from '../src/hooks/useUndoRedo.ts';
import { useKeyboardShortcuts } from '../src/hooks/useKeyboardShortcuts.ts';
import { useCanvasPersistence } from '../src/hooks/useCanvasPersistence.ts';
import { StorageAdapter } from '../src/lib/storage/index.ts';

test('hooks modules export expected functions', () => {
    assert.equal(typeof useUndoRedo, 'function');
    assert.equal(typeof useKeyboardShortcuts, 'function');
    assert.equal(typeof useCanvasPersistence, 'function');
});

test('StorageAdapter works as base class for custom persistence adapters', async () => {
    let saveCalled = false;

    class CustomStorageAdapter extends StorageAdapter {
        async saveCanvas(canvasId, composition, placedItems) {
            saveCalled = true;
            return { success: true };
        }
    }

    const customAdapter = new CustomStorageAdapter();
    const result = await customAdapter.saveCanvas('c1', {}, []);
    assert.equal(saveCalled, true);
    assert.equal(result.success, true);
});
