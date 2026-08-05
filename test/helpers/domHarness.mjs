import { createRoot } from 'react-dom/client';
import { act } from 'react';

// React only lets `act` drive its scheduler when the environment opts in.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/** Mounts an element into a detached container and hands back its cleanup. */
export async function mountComponent(element) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(element);
    });

    return {
        container,
        cleanup() {
            act(() => root.unmount());
            container.remove();
        }
    };
}

/** Lets queued promises and deferred state updates settle. */
export async function settle() {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
}

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

/**
 * jsdom reports every element as 0x0, so components that size themselves from
 * `clientWidth`/`clientHeight` need one supplied for the length of a test.
 */
export async function withElementClientSize({ width, height }, run) {
    // jsdom defines these further up the chain, on Element.prototype, so the
    // overrides are added here as own properties and removed again after.
    const prototype = window.HTMLElement.prototype;
    const overrides = { clientWidth: width, clientHeight: height };

    for (const [property, value] of Object.entries(overrides)) {
        Object.defineProperty(prototype, property, { configurable: true, get: () => value });
    }

    try {
        return await run();
    } finally {
        for (const property of Object.keys(overrides)) {
            delete prototype[property];
        }
    }
}

export async function clickElement(element) {
    await act(async () => {
        element.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    });
}

async function dispatchMouse(target, type, point) {
    await act(async () => {
        target.dispatchEvent(new window.MouseEvent(type, { bubbles: true, cancelable: true, ...point }));
    });
}

/**
 * Presses on `element`, moves the pointer to each waypoint and releases, with
 * the moves going to `window` — the shape used by the composer canvas, which
 * follows the pointer beyond the element it started on.
 */
export async function dragFrom(element, start, ...waypoints) {
    await dispatchMouse(element, 'mousedown', start);
    for (const point of waypoints) {
        await dispatchMouse(window, 'mousemove', point);
    }
    await dispatchMouse(window, 'mouseup', {});
}

/**
 * The same drag with every event on `element` itself — the shape used by the
 * cropping view, which handles the whole gesture through React props.
 */
export async function dragOn(element, start, ...waypoints) {
    await dispatchMouse(element, 'mousedown', start);
    for (const point of waypoints) {
        await dispatchMouse(element, 'mousemove', point);
    }
    await dispatchMouse(element, 'mouseup', {});
}

/** Builds a drop event carrying a crop id, the payload the sidebar drags. */
export function cropDropEvent(cropId, point) {
    const event = new window.MouseEvent('drop', { bubbles: true, cancelable: true, ...point });
    Object.defineProperty(event, 'dataTransfer', {
        value: {
            dropEffect: 'none',
            getData: (type) => (type === 'application/crop-id' ? String(cropId) : '')
        }
    });
    return event;
}

export async function dispatchDrop(target, event) {
    await act(async () => {
        target.dispatchEvent(event);
    });
}

export function buttonTitled(container, title) {
    return container.querySelector(`button[title^="${title}"]`);
}

export function buttonLabelled(container, label) {
    return [...container.querySelectorAll('button')]
        .find((button) => button.textContent.trim().startsWith(label));
}
