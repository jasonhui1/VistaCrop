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
export const PAGE_SCALE = 0.5;

const CANVAS_RECT = {
    left: 0,
    top: 0,
    width: PAGE_WIDTH * PAGE_SCALE,
    height: PAGE_HEIGHT * PAGE_SCALE
};

/** jsdom has no layout engine, so every measured element needs its box supplied. */
export function stubBoundingRect(element, { left, top, width, height }) {
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

/** A crop twice as wide as it is tall, so aspect-ratio slips are visible. */
export function makeCrop(overrides = {}) {
    return {
        id: 'crop-1',
        imageId: 'image-1',
        imageData: 'data:image/png;base64,cropped',
        x: 0,
        y: 0,
        width: 200,
        height: 100,
        rotation: 0,
        ...overrides
    };
}

function makeAdapter(overrides = {}) {
    return {
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
        },
        ...overrides
    };
}

/** Lets queued promises and the hook's deferred flag updates settle. */
export async function settle() {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
}

export async function mountComposer({ crops = [makeCrop()], adapter = makeAdapter() } = {}) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(
            React.createElement(
                StorageAdapterProvider,
                { adapter },
                React.createElement(ComposerView, { crops })
            )
        );
    });

    const canvas = container.querySelector('.freeform-canvas');
    if (!canvas) throw new Error('ComposerView did not render a freeform canvas');
    stubBoundingRect(canvas, CANVAS_RECT);

    return {
        container,
        canvas,
        adapter,
        cleanup() {
            act(() => root.unmount());
            container.remove();
        }
    };
}

/** Screen coordinates for a point given in page units. */
export function toScreen(pageX, pageY) {
    return { clientX: pageX * PAGE_SCALE, clientY: pageY * PAGE_SCALE };
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

/** jsdom never fires load events for `new Image()`, so drive them by hand. */
export async function withImmediateImageLoading(run) {
    const RealImage = globalThis.Image;
    class ImmediateImage {
        constructor() {
            this.width = 100;
            this.height = 100;
            this.onload = null;
            this.onerror = null;
        }
        set src(value) {
            this._src = value;
            queueMicrotask(() => this.onload?.());
        }
        get src() {
            return this._src;
        }
    }
    globalThis.Image = ImmediateImage;
    try {
        return await run();
    } finally {
        globalThis.Image = RealImage;
    }
}

/**
 * Records the 2D context calls and anchor downloads made while `run` executes,
 * which is all an export leaves behind in a DOM without a real canvas.
 */
export async function recordCanvasWork(run) {
    const originalGetContext = window.HTMLCanvasElement.prototype.getContext;
    const originalAnchorClick = window.HTMLAnchorElement.prototype.click;

    const contexts = [];
    const downloads = [];

    window.HTMLCanvasElement.prototype.getContext = function getContext(type) {
        const context = originalGetContext.call(this, type);
        if (!context) return context;

        const calls = [];
        contexts.push({ canvas: this, calls });

        return new Proxy(context, {
            get(target, property, receiver) {
                const value = Reflect.get(target, property, receiver);
                if (typeof value !== 'function') return value;
                return (...args) => {
                    calls.push({ method: property, args });
                    return value.apply(target, args);
                };
            },
            set(target, property, value) {
                calls.push({ method: `set ${String(property)}`, args: [value] });
                return Reflect.set(target, property, value);
            }
        });
    };

    window.HTMLAnchorElement.prototype.click = function recordDownload() {
        downloads.push({ download: this.download, href: this.href });
    };

    try {
        await run();
    } finally {
        window.HTMLCanvasElement.prototype.getContext = originalGetContext;
        window.HTMLAnchorElement.prototype.click = originalAnchorClick;
    }

    return { contexts, downloads };
}

/** All recorded calls to `method` across every context used during a run. */
export function callsTo(contexts, method) {
    return contexts.flatMap(({ calls }) => calls.filter((call) => call.method === method));
}

export function buttonTitled(container, title) {
    return container.querySelector(`button[title^="${title}"]`);
}

export function buttonLabelled(container, label) {
    return [...container.querySelectorAll('button')]
        .find((button) => button.textContent.trim().startsWith(label));
}
