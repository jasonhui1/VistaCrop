import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { ComposerView, StorageAdapterProvider } from '../../src/index.ts';

// React only lets `act` drive its scheduler when the environment opts in.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * The composer's default page is A4 portrait; the harness renders it at half
 * scale so screen pixels convert to page units by doubling. Tests state the
 * page-unit numbers they expect, so the scale has to be known and fixed.
 */
export const PAGE_WIDTH = 1240;
export const PAGE_HEIGHT = 1754;
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

/** The screen rectangle a page-unit box occupies at the harness's scale. */
function toScreenRect({ x, y, width, height }) {
    return {
        left: x * PAGE_SCALE,
        top: y * PAGE_SCALE,
        width: width * PAGE_SCALE,
        height: height * PAGE_SCALE
    };
}

/** jsdom has no layout engine, so every measured element needs its box supplied. */
export function stubBoundingRect(element, pageBox) {
    const { left, top, width, height } = toScreenRect(pageBox);
    element.getBoundingClientRect = () => ({
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON() {}
    });
}

/** Lets queued promises and the hook's deferred flag updates settle. */
export async function settle() {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
}

export async function mountComposer() {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(
            React.createElement(
                StorageAdapterProvider,
                { adapter: ADAPTER },
                React.createElement(ComposerView, { crops: [CROP] })
            )
        );
    });

    const canvas = container.querySelector('.freeform-canvas');
    if (!canvas) throw new Error('ComposerView did not render a freeform canvas');
    stubBoundingRect(canvas, { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT });

    return {
        container,
        canvas,
        cleanup() {
            act(() => root.unmount());
            container.remove();
        }
    };
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

/** Drops a crop onto the canvas at a point given in page units. */
export async function dropCropAt(canvas, cropId, pageX, pageY) {
    const event = new window.MouseEvent('drop', {
        bubbles: true,
        cancelable: true,
        ...toScreen(pageX, pageY)
    });
    Object.defineProperty(event, 'dataTransfer', {
        value: {
            dropEffect: 'none',
            getData: (type) => (type === 'application/crop-id' ? String(cropId) : '')
        }
    });

    await act(async () => {
        canvas.dispatchEvent(event);
    });
}

export async function clickElement(element) {
    await act(async () => {
        element.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    });
}

/**
 * Presses on `element`, moves the pointer to each waypoint and releases —
 * the shape every canvas transform (move, resize, rotate) is driven by.
 */
export async function dragFrom(element, start, ...waypoints) {
    await act(async () => {
        element.dispatchEvent(new window.MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            ...start
        }));
    });

    for (const point of waypoints) {
        await act(async () => {
            window.dispatchEvent(new window.MouseEvent('mousemove', { bubbles: true, ...point }));
        });
    }

    await act(async () => {
        window.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true }));
    });
}

/** The canvas selects on press, so a pointer press anywhere on the item selects it. */
export async function selectItem(itemElement, pageX, pageY) {
    await dragFrom(itemElement, toScreen(pageX, pageY));
}

export function buttonTitled(container, title) {
    return container.querySelector(`button[title^="${title}"]`);
}

export function buttonLabelled(container, label) {
    return [...container.querySelectorAll('button')]
        .find((button) => button.textContent.trim().startsWith(label));
}
