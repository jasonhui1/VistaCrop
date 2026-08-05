import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { StorageAdapterProvider, useStorageAdapter } from '../src/lib/storage/index.ts';
import RotatableImage from '../src/components/RotatableImage.tsx';
import { useCanvasPersistence } from '../src/hooks/useCanvasPersistence.ts';

// React reports render errors to the console before rethrowing them; silence
// that so an expected-throw test does not look like a failure.
function renderQuietly(element) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container, {
        onUncaughtError: () => {},
        onCaughtError: () => {}
    });

    const consoleError = console.error;
    console.error = () => {};
    try {
        flushSync(() => root.render(element));
    } finally {
        console.error = consoleError;
    }

    return {
        container,
        cleanup() {
            flushSync(() => root.unmount());
            container.remove();
        }
    };
}

// Captures the error a child throws during render, since React rethrows
// asynchronously rather than out of `root.render`.
function renderCapturingError(element) {
    let caught = null;

    class Boundary extends React.Component {
        constructor(props) {
            super(props);
            this.state = { failed: false };
        }
        static getDerivedStateFromError() {
            return { failed: true };
        }
        componentDidCatch(error) {
            caught = error;
        }
        render() {
            return this.state.failed ? null : this.props.children;
        }
    }

    const { cleanup } = renderQuietly(React.createElement(Boundary, null, element));
    cleanup();
    return caught;
}

function ReadsAdapter({ onAdapter }) {
    onAdapter(useStorageAdapter());
    return null;
}

function UsesPersistence() {
    useCanvasPersistence({ composition: {}, placedItems: [] });
    return null;
}

test('useStorageAdapter returns the adapter supplied by the provider', () => {
    const adapter = { listCanvases: async () => [] };
    let received = null;

    const { cleanup } = renderQuietly(
        React.createElement(
            StorageAdapterProvider,
            { adapter },
            React.createElement(ReadsAdapter, { onAdapter: (a) => { received = a; } })
        )
    );
    cleanup();

    assert.equal(received, adapter);
});

test('useStorageAdapter throws a provider-naming error when no provider wraps the tree', () => {
    const error = renderCapturingError(
        React.createElement(ReadsAdapter, { onAdapter: () => {} })
    );

    assert.ok(error, 'expected a render error');
    assert.match(error.message, /StorageAdapterProvider/);
});

test('StorageAdapterProvider rejects a missing adapter', () => {
    const error = renderCapturingError(
        React.createElement(StorageAdapterProvider, { adapter: null }, null)
    );

    assert.ok(error, 'expected a render error');
    assert.match(error.message, /adapter/i);
});

test('RotatableImage loads the original image through the context adapter', async () => {
    const requestedImageIds = [];
    const adapter = {
        async getImage(imageId) {
            requestedImageIds.push(imageId);
            return { id: imageId, data: 'data:image/png;base64,abc' };
        }
    };

    const crop = {
        id: 1,
        imageId: 'img-1',
        imageData: 'data:image/png;base64,zzz',
        x: 0,
        y: 0,
        width: 100,
        height: 100
    };

    const { container, cleanup } = renderQuietly(
        React.createElement(
            StorageAdapterProvider,
            { adapter },
            React.createElement(RotatableImage, {
                crop,
                currentRotation: 45,
                isRotating: false
            })
        )
    );

    // Let the lazy-load effect's promise settle before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.deepEqual(requestedImageIds, ['img-1']);
    const images = [...container.querySelectorAll('img')];
    assert.ok(
        images.some((img) => img.getAttribute('src') === 'data:image/png;base64,abc'),
        'expected the adapter-supplied original image to be rendered'
    );

    cleanup();
});

test('RotatableImage without a provider throws a provider-naming error', () => {
    const error = renderCapturingError(
        React.createElement(RotatableImage, {
            crop: { id: 1, imageId: 'img-1', imageData: 'x', x: 0, y: 0, width: 10, height: 10 },
            currentRotation: 0,
            isRotating: false
        })
    );

    assert.ok(error, 'expected a render error');
    assert.match(error.message, /StorageAdapterProvider/);
});

test('useCanvasPersistence without a provider throws a provider-naming error', () => {
    const error = renderCapturingError(React.createElement(UsesPersistence, null));

    assert.ok(error, 'expected a render error');
    assert.match(error.message, /StorageAdapterProvider/);
});

test('useCanvasPersistence saves through the context adapter', async () => {
    const saved = [];
    const adapter = {
        async createCanvas() {
            return { canvasId: 'canvas-1' };
        },
        async saveCanvas(canvasId, composition, placedItems) {
            saved.push({ canvasId, composition, placedItems });
            return { success: true };
        }
    };

    let persistence = null;
    function Harness() {
        persistence = useCanvasPersistence({ composition: { id: 'comp' }, placedItems: [] });
        return null;
    }

    const { cleanup } = renderQuietly(
        React.createElement(StorageAdapterProvider, { adapter }, React.createElement(Harness, null))
    );

    await persistence.handleSave();

    assert.equal(saved.length, 1);
    assert.equal(saved[0].canvasId, 'canvas-1');
    assert.deepEqual(saved[0].composition, { id: 'comp' });

    cleanup();
});

test('no module-global storage adapter registry is exported to clients', async () => {
    const storageBarrel = await import('../src/lib/storage/index.ts');
    const publicEntrypoint = await import('../src/index.ts');

    for (const moduleExports of [storageBarrel, publicEntrypoint]) {
        assert.equal(moduleExports.setStorageAdapter, undefined);
        assert.equal(moduleExports.getStorageAdapter, undefined);
    }
});
