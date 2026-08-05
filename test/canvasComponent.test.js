import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import PhoneMockup from '../src/components/PhoneMockup.tsx';

test('a React component mounts into the DOM environment', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const root = createRoot(container);
    flushSync(() => {
        root.render(React.createElement(PhoneMockup, { color: '#111111' }));
    });

    const mockup = container.querySelector('.phone-mockup');
    assert.ok(mockup, 'expected PhoneMockup to render its root element');
    assert.equal(mockup.style.backgroundColor, 'rgb(17, 17, 17)');

    root.unmount();
    container.remove();
});

test('canvas elements expose a usable 2d context', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;

    const ctx = canvas.getContext('2d');
    assert.ok(ctx, 'expected getContext("2d") to return a stub context');
    assert.equal(typeof ctx.drawImage, 'function');
    assert.equal(typeof ctx.fillRect, 'function');

    const imageData = ctx.getImageData(0, 0, 2, 2);
    assert.equal(imageData.data.length, 2 * 2 * 4);
});
