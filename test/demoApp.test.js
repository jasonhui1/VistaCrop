import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import App from '../src/App.tsx';

// React only lets `act` drive its scheduler when the environment opts in.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/** Answers the demo app's start-up calls (`/api/crops`) with an empty gallery. */
function stubEmptyBackend() {
    const requestedUrls = [];
    global.fetch = async (url) => {
        requestedUrls.push(String(url));
        return { ok: true, status: 200, json: async () => ({ crops: [] }) };
    };
    return requestedUrls;
}

async function mountApp() {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
        root.render(React.createElement(App));
    });
    return {
        container,
        cleanup: () => {
            act(() => root.unmount());
            container.remove();
        }
    };
}

function buttonLabelled(container, label) {
    return [...container.querySelectorAll('button')]
        .find((button) => button.textContent.trim().startsWith(label));
}

test('the demo app mounts against the public entrypoint and loads through its adapter', async () => {
    const requestedUrls = stubEmptyBackend();
    const { container, cleanup } = await mountApp();

    assert.ok(
        requestedUrls.includes('/api/crops'),
        `expected start-up load through createApiClient, saw: ${requestedUrls.join(', ')}`
    );
    assert.ok(container.querySelector('button[aria-label="Upload artwork image"]'), 'expected the uploader');

    cleanup();
});

test('the demo app can reach each of its three views', async () => {
    stubEmptyBackend();
    const { container, cleanup } = await mountApp();

    for (const label of ['Gallery', 'Composer', 'Canvas']) {
        const toggle = buttonLabelled(container, label);
        assert.ok(toggle, `expected a ${label} view toggle`);
        await act(async () => {
            toggle.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        });
    }

    cleanup();
});
