import React from 'react';
import { ComposerView, StorageAdapterProvider } from '../../src/index.ts';
import { cropDropEvent, dispatchDrop, dragFrom, mountComponent, stubBoundingRect } from './domHarness.mjs';

/**
 * The composer's default page is A4 portrait; the harness renders it at half
 * scale so screen pixels convert to page units by doubling. Tests state the
 * page-unit numbers they expect, so the scale has to be known and fixed.
 */
export const PAGE_WIDTH = 1240;
export const PAGE_HEIGHT = 1754;
export const PAGE_MARGIN = 40;
const PAGE_SCALE = 0.5;

/** A crop twice as wide as it is tall, so aspect-ratio slips are visible. */
const CROP = {
    id: 'crop-1',
    imageId: 'image-1',
    imageData: 'data:image/png;base64,cropped',
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    rotation: 0
};

export const CROP_ID = CROP.id;
export const CROP_IMAGE_DATA = CROP.imageData;

const ADAPTER = {
    async getImage(imageId) {
        return { id: imageId, data: 'data:image/png;base64,original' };
    },
    async listCanvases() {
        return [];
    },
    async createCanvas() {
        return { canvasId: 'canvas-1' };
    },
    async saveCanvas() {
        return { success: true };
    }
};

/** Screen coordinates for a point given in page units. */
export function toScreen(pageX, pageY) {
    return { clientX: pageX * PAGE_SCALE, clientY: pageY * PAGE_SCALE };
}

/** Gives an element the screen rectangle its page-unit box occupies. */
export function stubPageBox(element, { x, y, width, height }) {
    stubBoundingRect(element, {
        left: x * PAGE_SCALE,
        top: y * PAGE_SCALE,
        width: width * PAGE_SCALE,
        height: height * PAGE_SCALE
    });
}

export async function mountComposer() {
    const harness = await mountComponent(
        React.createElement(
            StorageAdapterProvider,
            { adapter: ADAPTER },
            React.createElement(ComposerView, { crops: [CROP] })
        )
    );

    const canvas = harness.container.querySelector('.freeform-canvas');
    if (!canvas) throw new Error('ComposerView did not render a freeform canvas');
    stubPageBox(canvas, { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT });

    return { ...harness, canvas };
}

/** The item's page-unit box, read back from the percentages it renders with. */
export function itemBox(itemElement) {
    const percent = (value) => parseFloat(value) / 100;
    return {
        x: percent(itemElement.style.left) * PAGE_WIDTH,
        y: percent(itemElement.style.top) * PAGE_HEIGHT,
        width: percent(itemElement.style.width) * PAGE_WIDTH,
        height: percent(itemElement.style.height) * PAGE_HEIGHT
    };
}

/** The item's rendered frame rotation in degrees. */
export function itemRotation(itemElement) {
    const match = /rotate\((-?[\d.]+)deg\)/.exec(itemElement.style.transform);
    return match ? parseFloat(match[1]) : 0;
}

/** Drops a crop onto the freeform canvas at a point given in page units. */
export async function dropCropAt(canvas, cropId, pageX, pageY) {
    await dispatchDrop(canvas, cropDropEvent(cropId, toScreen(pageX, pageY)));
}

/** Drops a crop onto a panel, which places by slot rather than by position. */
export async function dropCropOnPanel(panel, cropId) {
    await dispatchDrop(panel, cropDropEvent(cropId, { clientX: 0, clientY: 0 }));
}

/** The canvas selects on press, so a pointer press anywhere on the item selects it. */
export async function selectItem(itemElement, pageX, pageY) {
    await dragFrom(itemElement, toScreen(pageX, pageY));
}
