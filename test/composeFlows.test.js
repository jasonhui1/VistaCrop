import test from 'node:test';
import assert from 'node:assert/strict';
import {
    PAGE_WIDTH,
    PAGE_HEIGHT,
    buttonLabelled,
    buttonTitled,
    callsTo,
    clickElement,
    dragFrom,
    dropCropAt,
    itemBox,
    makeCrop,
    mountComposer,
    recordCanvasWork,
    settle,
    stubBoundingRect,
    toScreen,
    withImmediateImageLoading
} from './helpers/composerHarness.mjs';

// Where the tests drop the crop, and the box the composer gives it there:
// a quarter of the page wide, at the crop's 2:1 aspect ratio, centred on the
// drop point.
const DROP_POINT = { x: 310, y: 200 };
const PLACED_BOX = { x: 155, y: 122.5, width: 310, height: 155 };

function assertBox(actual, expected, flow) {
    for (const key of ['x', 'y', 'width', 'height']) {
        assert.ok(
            Math.abs(actual[key] - expected[key]) < 0.01,
            `${flow}: expected item ${key} ${expected[key]}, got ${actual[key]}`
        );
    }
}

function placedItem(container) {
    return container.querySelector('.freeform-item');
}

/** Places one crop and gives its element a measurable box, as the browser would. */
async function placeCrop(harness) {
    await dropCropAt(harness.canvas, 'crop-1', DROP_POINT.x, DROP_POINT.y);
    const item = placedItem(harness.container);
    assert.ok(item, 'placing: expected a freeform item after dropping a crop');
    stubBoundingRect(item, {
        left: PLACED_BOX.x / 2,
        top: PLACED_BOX.y / 2,
        width: PLACED_BOX.width / 2,
        height: PLACED_BOX.height / 2
    });
    return item;
}

test('placing: dropping a crop puts a correctly sized item at the drop point', async () => {
    const harness = await mountComposer();

    assert.ok(
        harness.canvas.textContent.includes('Drag crops here'),
        'placing: expected the empty-canvas hint before anything is placed'
    );

    const item = await placeCrop(harness);

    assertBox(itemBox(item), PLACED_BOX, 'placing');
    assert.ok(
        item.querySelector('img[src="data:image/png;base64,cropped"]'),
        'placing: expected the placed item to render the dropped crop'
    );

    harness.cleanup();
});

test('selecting: clicking an item reveals its transform handles, clicking the canvas clears them', async () => {
    const harness = await mountComposer();
    const item = await placeCrop(harness);

    await clickElement(harness.canvas);
    assert.equal(
        harness.container.querySelectorAll('.resize-handle').length,
        0,
        'selecting: expected no handles while nothing is selected'
    );

    await dragFrom(item, toScreen(DROP_POINT.x, DROP_POINT.y));

    assert.ok(item.classList.contains('selected'), 'selecting: expected the clicked item to be marked selected');
    assert.equal(
        harness.container.querySelectorAll('.resize-handle').length,
        4,
        'selecting: expected four resize handles on the selected item'
    );
    assert.ok(
        item.querySelector('.frame-rotation-handle'),
        'selecting: expected the frame rotation handle on the selected item'
    );

    await clickElement(harness.canvas);

    assert.equal(item.classList.contains('selected'), false, 'selecting: expected the canvas click to deselect');
    assert.equal(
        harness.container.querySelectorAll('.resize-handle').length,
        0,
        'selecting: expected the handles to disappear on deselect'
    );

    harness.cleanup();
});

test('moving: dragging an item moves it by the dragged distance', async () => {
    const harness = await mountComposer();
    const item = await placeCrop(harness);

    await dragFrom(
        item,
        toScreen(DROP_POINT.x, DROP_POINT.y),
        toScreen(DROP_POINT.x + 200, DROP_POINT.y)
    );

    assertBox(itemBox(item), { ...PLACED_BOX, x: PLACED_BOX.x + 200 }, 'moving');

    harness.cleanup();
});

test('resizing: dragging the bottom-right handle resizes the item at the crop aspect ratio', async () => {
    const harness = await mountComposer();
    const item = await placeCrop(harness);

    await dragFrom(item, toScreen(DROP_POINT.x, DROP_POINT.y));
    const handle = item.querySelector('.resize-br');
    assert.ok(handle, 'resizing: expected a bottom-right resize handle on the selected item');

    const corner = { x: PLACED_BOX.x + PLACED_BOX.width, y: PLACED_BOX.y + PLACED_BOX.height };
    await dragFrom(handle, toScreen(corner.x, corner.y), toScreen(corner.x + 200, corner.y));

    // 200 page units wider, and half that taller to hold the crop's 2:1 ratio.
    assertBox(itemBox(item), { ...PLACED_BOX, width: 510, height: 255 }, 'resizing');

    harness.cleanup();
});

test('rotating: dragging the frame rotation handle turns the item', async () => {
    const harness = await mountComposer();
    const item = await placeCrop(harness);

    await dragFrom(item, toScreen(DROP_POINT.x, DROP_POINT.y));
    const handle = item.querySelector('.frame-rotation-handle');
    assert.ok(handle, 'rotating: expected a frame rotation handle on the selected item');

    // From straight above the item's centre round to its right: a quarter turn.
    await dragFrom(
        handle,
        toScreen(DROP_POINT.x, DROP_POINT.y - PLACED_BOX.height),
        toScreen(DROP_POINT.x + PLACED_BOX.width, DROP_POINT.y)
    );

    const rotation = /rotate\((-?[\d.]+)deg\)/.exec(item.style.transform);
    assert.ok(rotation, `rotating: expected a rotation transform, got "${item.style.transform}"`);
    assert.ok(
        Math.abs(parseFloat(rotation[1]) - 90) < 0.01,
        `rotating: expected a 90deg turn, got ${rotation[1]}deg`
    );

    harness.cleanup();
});

test('undo/redo: steps back and forward through placing and moving', async () => {
    const harness = await mountComposer();
    const item = await placeCrop(harness);

    await dragFrom(
        item,
        toScreen(DROP_POINT.x, DROP_POINT.y),
        toScreen(DROP_POINT.x + 200, DROP_POINT.y)
    );
    await settle();

    const undo = buttonTitled(harness.container, 'Undo');
    const redo = buttonTitled(harness.container, 'Redo');
    assert.ok(undo && redo, 'undo/redo: expected undo and redo controls in the toolbar');
    assert.equal(undo.disabled, false, 'undo/redo: expected undo to be available after a move');

    await clickElement(undo);
    await settle();
    assertBox(itemBox(placedItem(harness.container)), PLACED_BOX, 'undo/redo (undo move)');

    await clickElement(undo);
    await settle();
    assert.equal(
        placedItem(harness.container),
        null,
        'undo/redo: expected undoing the placement to remove the item'
    );
    assert.equal(undo.disabled, true, 'undo/redo: expected undo to be exhausted at the start of history');

    await clickElement(redo);
    await settle();
    assertBox(itemBox(placedItem(harness.container)), PLACED_BOX, 'undo/redo (redo placement)');

    await clickElement(redo);
    await settle();
    assertBox(
        itemBox(placedItem(harness.container)),
        { ...PLACED_BOX, x: PLACED_BOX.x + 200 },
        'undo/redo (redo move)'
    );
    assert.equal(redo.disabled, true, 'undo/redo: expected redo to be exhausted at the end of history');

    harness.cleanup();
});

test('export: draws the placed item onto a page-sized canvas and downloads a PNG', async () => {
    const harness = await mountComposer();
    await placeCrop(harness);

    const exportButton = buttonLabelled(harness.container, 'Export');
    assert.ok(exportButton, 'export: expected an Export control in the toolbar');

    const { contexts, downloads } = await recordCanvasWork(() =>
        withImmediateImageLoading(async () => {
            await clickElement(exportButton);
            await settle();
        })
    );

    assert.equal(contexts.length, 1, `export: expected one export canvas, got ${contexts.length}`);
    const { canvas } = contexts[0];
    assert.equal(canvas.width, PAGE_WIDTH, 'export: expected the export canvas to be page width');
    assert.equal(canvas.height, PAGE_HEIGHT, 'export: expected the export canvas to be page height');

    assert.deepEqual(
        callsTo(contexts, 'fillRect').map((call) => call.args),
        [[0, 0, PAGE_WIDTH, PAGE_HEIGHT]],
        'export: expected the page background to be filled once, edge to edge'
    );

    const drawImageCalls = callsTo(contexts, 'drawImage');
    assert.equal(drawImageCalls.length, 1, `export: expected one image draw, got ${drawImageCalls.length}`);
    // The 100x100 stub image is letterboxed into the item's 2:1 box.
    assert.deepEqual(
        drawImageCalls[0].args.slice(1),
        [232.5, 122.5, 155, 155],
        'export: expected the crop drawn centred inside the placed item box'
    );

    assert.equal(downloads.length, 1, `export: expected one download, got ${downloads.length}`);
    assert.match(downloads[0].download, /\.png$/, 'export: expected a .png filename');
    assert.match(downloads[0].href, /^data:image\/png/, 'export: expected a PNG data URL');

    harness.cleanup();
});
