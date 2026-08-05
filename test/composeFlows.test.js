import test from 'node:test';
import assert from 'node:assert/strict';
import {
    CROP_ID,
    CROP_IMAGE_DATA,
    PAGE_MARGIN,
    PAGE_WIDTH,
    PAGE_HEIGHT,
    dropCropAt,
    dropCropOnPanel,
    itemBox,
    itemRotation,
    mountComposer,
    selectItem,
    stubPageBox,
    toScreen
} from './helpers/composerHarness.mjs';
import {
    buttonLabelled,
    buttonTitled,
    clickElement,
    dragFrom,
    settle
} from './helpers/domHarness.mjs';
import { callsTo, recordCanvasWork, withImmediateImageLoading } from './helpers/canvasStubs.mjs';

// Where the tests drop the crop, and the box the composer gives it there:
// a quarter of the page wide, at the crop's 2:1 aspect ratio, centred on the
// drop point.
const DROP_POINT = { x: 310, y: 200 };
const PLACED_BOX = { x: 155, y: 122.5, width: 310, height: 155 };
const MOVED_BOX = { ...PLACED_BOX, x: 355 };
const RESIZED_BOX = { ...PLACED_BOX, width: 510, height: 255 };
const DRAG_DISTANCE = 200;

function assertBox(actual, expected, flow) {
    for (const key of ['x', 'y', 'width', 'height']) {
        assert.ok(
            Math.abs(actual[key] - expected[key]) < 0.01,
            `${flow}: expected item ${key} ${expected[key]}, got ${actual[key]}`
        );
    }
}

/** Compares drawing arguments, which carry floating-point scaling noise. */
function assertNumbersClose(actual, expected, message) {
    assert.equal(actual.length, expected.length, `${message} (expected ${expected.length} arguments)`);
    for (const [index, value] of expected.entries()) {
        assert.ok(
            Math.abs(actual[index] - value) < 0.01,
            `${message} (argument ${index}: expected ${value}, got ${actual[index]})`
        );
    }
}

function placedItem(container) {
    return container.querySelector('.freeform-item');
}

/** Places one crop and gives its element a measurable box, as the browser would. */
async function placeCrop(harness, flow) {
    await dropCropAt(harness.canvas, CROP_ID, DROP_POINT.x, DROP_POINT.y);
    const item = placedItem(harness.container);
    assert.ok(item, `${flow}: expected a freeform item after dropping a crop`);
    stubPageBox(item, PLACED_BOX);
    return item;
}

/** Drags the item's bottom-right handle `DRAG_DISTANCE` page units to the right. */
async function dragResizeHandle(item, flow) {
    const handle = item.querySelector('.resize-br');
    assert.ok(handle, `${flow}: expected a bottom-right resize handle on the selected item`);

    const corner = { x: PLACED_BOX.x + PLACED_BOX.width, y: PLACED_BOX.y + PLACED_BOX.height };
    await dragFrom(handle, toScreen(corner.x, corner.y), toScreen(corner.x + DRAG_DISTANCE, corner.y));
}

/** Drags the frame rotation handle from above the item's centre round to its right. */
async function dragRotationHandle(item, flow) {
    const handle = item.querySelector('.frame-rotation-handle');
    assert.ok(handle, `${flow}: expected a frame rotation handle on the selected item`);

    await dragFrom(
        handle,
        toScreen(DROP_POINT.x, DROP_POINT.y - PLACED_BOX.height),
        toScreen(DROP_POINT.x + PLACED_BOX.width, DROP_POINT.y)
    );
}

test('placing: dropping a crop puts a correctly sized item at the drop point', async () => {
    const harness = await mountComposer();

    assert.ok(
        harness.canvas.textContent.includes('Drag crops here'),
        'placing: expected the empty-canvas hint before anything is placed'
    );

    const item = await placeCrop(harness, 'placing');

    assertBox(itemBox(item), PLACED_BOX, 'placing');
    assert.ok(
        item.querySelector(`img[src="${CROP_IMAGE_DATA}"]`),
        'placing: expected the placed item to render the dropped crop'
    );

    harness.cleanup();
});

test('selecting: pressing an item reveals its transform handles, clicking the canvas clears them', async () => {
    const harness = await mountComposer();
    const item = await placeCrop(harness, 'selecting');

    await clickElement(harness.canvas);
    assert.equal(
        harness.container.querySelectorAll('.resize-handle').length,
        0,
        'selecting: expected no handles while nothing is selected'
    );

    await selectItem(item, DROP_POINT.x, DROP_POINT.y);

    assert.ok(item.classList.contains('selected'), 'selecting: expected the pressed item to be marked selected');
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
    const item = await placeCrop(harness, 'moving');

    await dragFrom(
        item,
        toScreen(DROP_POINT.x, DROP_POINT.y),
        toScreen(DROP_POINT.x + DRAG_DISTANCE, DROP_POINT.y)
    );

    assertBox(itemBox(item), MOVED_BOX, 'moving');

    harness.cleanup();
});

test('resizing: dragging the bottom-right handle resizes the item at the crop aspect ratio', async () => {
    const harness = await mountComposer();
    const item = await placeCrop(harness, 'resizing');

    await selectItem(item, DROP_POINT.x, DROP_POINT.y);
    await dragResizeHandle(item, 'resizing');

    // 200 page units wider, and half that taller to hold the crop's 2:1 ratio.
    assertBox(itemBox(item), RESIZED_BOX, 'resizing');

    harness.cleanup();
});

test('rotating: dragging the frame rotation handle turns the item', async () => {
    const harness = await mountComposer();
    const item = await placeCrop(harness, 'rotating');

    await selectItem(item, DROP_POINT.x, DROP_POINT.y);
    await dragRotationHandle(item, 'rotating');

    assert.ok(
        Math.abs(itemRotation(item) - 90) < 0.01,
        `rotating: expected a quarter turn, got ${itemRotation(item)}deg from "${item.style.transform}"`
    );

    harness.cleanup();
});

test('undo/redo: steps back and forward through placing and moving', async () => {
    const harness = await mountComposer();
    const item = await placeCrop(harness, 'undo/redo');

    await dragFrom(
        item,
        toScreen(DROP_POINT.x, DROP_POINT.y),
        toScreen(DROP_POINT.x + DRAG_DISTANCE, DROP_POINT.y)
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
    assertBox(itemBox(placedItem(harness.container)), MOVED_BOX, 'undo/redo (redo move)');
    assert.equal(redo.disabled, true, 'undo/redo: expected redo to be exhausted at the end of history');

    harness.cleanup();
});

test('undo/redo: steps back and forward through resizing and rotating', async () => {
    const harness = await mountComposer();
    const item = await placeCrop(harness, 'undo/redo');
    const undo = buttonTitled(harness.container, 'Undo');
    const redo = buttonTitled(harness.container, 'Redo');

    await selectItem(item, DROP_POINT.x, DROP_POINT.y);
    await dragResizeHandle(item, 'undo/redo');
    await settle();

    await clickElement(undo);
    await settle();
    assertBox(itemBox(item), PLACED_BOX, 'undo/redo (undo resize)');

    await clickElement(redo);
    await settle();
    assertBox(itemBox(item), RESIZED_BOX, 'undo/redo (redo resize)');

    await dragRotationHandle(item, 'undo/redo');
    await settle();
    assert.ok(
        Math.abs(itemRotation(item) - 90) < 0.01,
        `undo/redo: expected the rotation to apply before undoing it, got ${itemRotation(item)}deg`
    );

    await clickElement(undo);
    await settle();
    assert.equal(itemRotation(item), 0, 'undo/redo: expected undo to take the rotation back to square');

    await clickElement(redo);
    await settle();
    assert.ok(
        Math.abs(itemRotation(item) - 90) < 0.01,
        `undo/redo: expected redo to restore the rotation, got ${itemRotation(item)}deg`
    );

    harness.cleanup();
});

// The default 'single' layout is one panel filling the page inside its margin.
const SINGLE_PANEL_BOX = {
    x: PAGE_MARGIN,
    y: PAGE_MARGIN,
    width: PAGE_WIDTH - PAGE_MARGIN * 2,
    height: PAGE_HEIGHT - PAGE_MARGIN * 2
};

/** Switches the composer to panel mode and returns its one empty panel. */
async function switchToPanels(harness, flow) {
    await clickElement(buttonLabelled(harness.container, 'Panels'));

    const panels = [...harness.container.querySelectorAll('.composer-panel')];
    assert.equal(panels.length, 1, `${flow}: expected the single layout to render one panel`);
    assert.ok(
        panels[0].classList.contains('panel-slot-empty'),
        `${flow}: expected the panel to start empty`
    );
    return panels[0];
}

test('panels: dropping a crop into a panel fills that slot', async () => {
    const harness = await mountComposer();
    const panel = await switchToPanels(harness, 'panels');

    await dropCropOnPanel(panel, CROP_ID);

    const filled = harness.container.querySelector('.composer-panel');
    assert.ok(
        filled.classList.contains('panel-slot-filled'),
        'panels: expected the panel to be marked filled after the drop'
    );
    assert.ok(
        filled.querySelector(`img[src="${CROP_IMAGE_DATA}"]`),
        'panels: expected the dropped crop to render inside the panel'
    );

    harness.cleanup();
});

test('panels: exporting draws the assigned crop across its panel', async () => {
    const harness = await mountComposer();
    const panel = await switchToPanels(harness, 'panels');
    await dropCropOnPanel(panel, CROP_ID);

    const { contexts, downloads } = await recordCanvasWork(() =>
        withImmediateImageLoading(async () => {
            await clickElement(buttonLabelled(harness.container, 'Export'));
            await settle();
        })
    );

    assert.deepEqual(
        callsTo(contexts, 'rect').map((call) => call.args),
        [[SINGLE_PANEL_BOX.x, SINGLE_PANEL_BOX.y, SINGLE_PANEL_BOX.width, SINGLE_PANEL_BOX.height]],
        'panels: expected the draw to be clipped to the panel'
    );

    const drawImageCalls = callsTo(contexts, 'drawImage');
    assert.equal(drawImageCalls.length, 1, `panels: expected one image draw, got ${drawImageCalls.length}`);
    // The square stub image is scaled to cover the panel and drawn from its centre.
    assertNumbersClose(
        drawImageCalls[0].args.slice(1),
        [-837, -837, 1674, 1674],
        'panels: expected the crop scaled to cover the panel'
    );

    assert.equal(downloads.length, 1, `panels: expected one download, got ${downloads.length}`);

    harness.cleanup();
});

test('export: draws the placed item onto a page-sized canvas and downloads a PNG', async () => {
    const harness = await mountComposer();
    await placeCrop(harness, 'export');

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
    assertNumbersClose(
        drawImageCalls[0].args.slice(1),
        [232.5, 122.5, 155, 155],
        'export: expected the crop drawn centred inside the placed item box'
    );

    assert.equal(downloads.length, 1, `export: expected one download, got ${downloads.length}`);
    assert.match(downloads[0].download, /\.png$/, 'export: expected a .png filename');
    assert.match(downloads[0].href, /^data:image\/png/, 'export: expected a PNG data URL');

    harness.cleanup();
});
