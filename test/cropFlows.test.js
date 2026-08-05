import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { CanvasView } from '../src/index.ts';
import {
    buttonLabelled,
    dragOn,
    clickElement,
    mountComponent,
    settle,
    stubBoundingRect,
    withElementClientSize
} from './helpers/domHarness.mjs';
import { withImmediateImageLoading } from './helpers/canvasStubs.mjs';

const ARTWORK = 'data:image/png;base64,artwork';
const ARTWORK_SIZE = { width: 400, height: 300 };

// The view lays its image out inside the container minus a 24px inset on each
// side, so a 848x648 container leaves 800x600 and the 400x300 artwork is shown
// unscaled, centred: 24 + (800 - 400) / 2 across, 24 + (600 - 300) / 2 down.
const CONTAINER_SIZE = { width: 848, height: 648 };
const IMAGE_ORIGIN = { x: 224, y: 174 };

/** Container coordinates for a point given in artwork pixels. */
function onArtwork(x, y) {
    return { clientX: IMAGE_ORIGIN.x + x, clientY: IMAGE_ORIGIN.y + y };
}

/**
 * Mounts the cropping view over the stub artwork and hands back its container
 * element along with the crops it emits.
 */
async function mountCanvasView(run) {
    const addedCrops = [];

    await withImmediateImageLoading(async () => {
        await withElementClientSize(CONTAINER_SIZE, async () => {
            const harness = await mountComponent(
                React.createElement(CanvasView, {
                    image: ARTWORK,
                    onAddCrop: (crop) => addedCrops.push(crop),
                    onImageUpload: () => {}
                })
            );
            await settle();

            const view = harness.container.firstElementChild;
            stubBoundingRect(view, { left: 0, top: 0, ...CONTAINER_SIZE });

            try {
                await run({ view, container: harness.container, addedCrops });
            } finally {
                harness.cleanup();
            }
        });
    }, ARTWORK_SIZE);

    return addedCrops;
}

/** Drags out a 200x150 selection from the artwork's top-left corner. */
async function dragOutSelection(view) {
    await dragOn(view, onArtwork(0, 0), onArtwork(200, 150));
}

test('cropping: the view sizes the artwork to its container before any selection', async () => {
    await mountCanvasView(async ({ container }) => {
        const artwork = container.querySelector(`img[src="${ARTWORK}"]`);
        assert.ok(artwork, 'cropping: expected the artwork to be rendered');
        assert.equal(artwork.style.width, '400px', 'cropping: expected the artwork laid out at its own width');
        assert.equal(artwork.style.height, '300px', 'cropping: expected the artwork laid out at its own height');
        assert.equal(artwork.style.left, `${IMAGE_ORIGIN.x}px`, 'cropping: expected the artwork centred across');
        assert.equal(artwork.style.top, `${IMAGE_ORIGIN.y}px`, 'cropping: expected the artwork centred down');

        assert.equal(
            buttonLabelled(container, 'Create Crop'),
            undefined,
            'cropping: expected no crop control before an area is selected'
        );
    });
});

test('cropping: dragging out a selection offers a crop of the selected area', async () => {
    const addedCrops = await mountCanvasView(async ({ view, container, addedCrops: crops }) => {
        await dragOutSelection(view);

        const createCrop = buttonLabelled(container, 'Create Crop');
        assert.ok(createCrop, 'cropping: expected a Create Crop control once an area is selected');

        await clickElement(createCrop);
        await settle();

        assert.equal(crops.length, 1, `cropping: expected one crop, got ${crops.length}`);
    });

    const [crop] = addedCrops;
    assert.deepEqual(
        { x: crop.x, y: crop.y, width: crop.width, height: crop.height },
        { x: 0, y: 0, width: 200, height: 150 },
        'cropping: expected the crop to cover the dragged area in artwork pixels'
    );
    assert.equal(crop.sourceRotation, 0, 'cropping: expected an unrotated crop');
    assert.deepEqual(
        { width: crop.originalImageWidth, height: crop.originalImageHeight },
        ARTWORK_SIZE,
        'cropping: expected the crop to record the artwork it came from'
    );
    assert.equal(crop.filter, 'none', 'cropping: expected the default filter on the crop');
});

test('cropping: dragging outside the selection rotates it into the crop', async () => {
    const addedCrops = await mountCanvasView(async ({ view, container, addedCrops: crops }) => {
        await dragOutSelection(view);

        // From level with the selection's centre round to straight above it.
        await dragOn(view, onArtwork(300, 75), onArtwork(100, -125));

        assert.ok(
            container.textContent.includes('-90°'),
            'cropping: expected the rotation readout to show a quarter turn'
        );

        await clickElement(buttonLabelled(container, 'Create Crop'));
        await settle();

        assert.equal(crops.length, 1, `cropping: expected one crop, got ${crops.length}`);
    });

    assert.equal(
        addedCrops[0].sourceRotation,
        -90,
        'cropping: expected the rotation to be carried into the crop'
    );
});

test('cropping: choosing a filter applies it to the artwork and the crop', async () => {
    const addedCrops = await mountCanvasView(async ({ view, container, addedCrops: crops }) => {
        const noir = container.querySelector('button[title="Noir"]');
        assert.ok(noir, 'cropping: expected a Noir filter control');

        await clickElement(noir);

        const artwork = container.querySelector(`img[src="${ARTWORK}"]`);
        assert.match(
            artwork.style.filter,
            /grayscale/,
            'cropping: expected the chosen filter on the displayed artwork'
        );

        await dragOutSelection(view);
        await clickElement(buttonLabelled(container, 'Create Crop'));
        await settle();

        assert.equal(crops.length, 1, `cropping: expected one crop, got ${crops.length}`);
    });

    assert.match(
        addedCrops[0].filter,
        /grayscale/,
        'cropping: expected the chosen filter to be recorded on the crop'
    );
});
