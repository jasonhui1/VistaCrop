import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost/'
});

const { window } = dom;

// Copy the window's globals onto the Node global object so component tests
// can use `document`/`window` the same way a browser-run test would.
const GLOBALS_TO_COPY = [
    'window', 'document', 'navigator', 'Node', 'Element', 'HTMLElement',
    'HTMLCanvasElement', 'HTMLImageElement', 'Image', 'Event', 'MouseEvent',
    'CustomEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame'
];

for (const key of GLOBALS_TO_COPY) {
    if (key in window) {
        // `navigator` (and possibly others) is a getter-only global in
        // modern Node, so replace the property descriptor rather than assign.
        Object.defineProperty(globalThis, key, {
            value: window[key],
            configurable: true,
            writable: true
        });
    }
}

// jsdom has no canvas implementation (see #207): getContext('2d') returns
// null out of the box, which breaks any component that calls it. This stub
// implements just enough of the 2D context surface — drawing calls, pixel
// read/write, and text measurement — for components under test to call
// without throwing and for tests to assert against.
function makeImageData(width, height) {
    return { data: new Uint8ClampedArray(Math.max(0, width * height * 4)), width, height };
}

function createStub2DContext(canvas) {
    return {
        canvas,
        fillStyle: '#000000',
        strokeStyle: '#000000',
        filter: 'none',
        globalAlpha: 1,
        lineWidth: 1,
        save() {},
        restore() {},
        translate() {},
        rotate() {},
        scale() {},
        setTransform() {},
        resetTransform() {},
        beginPath() {},
        closePath() {},
        moveTo() {},
        lineTo() {},
        arc() {},
        rect() {},
        clip() {},
        fill() {},
        stroke() {},
        fillRect() {},
        clearRect() {},
        strokeRect() {},
        drawImage() {},
        measureText(text) {
            return { width: String(text).length * 6 };
        },
        getImageData(_sx, _sy, sw, sh) {
            return makeImageData(sw, sh);
        },
        putImageData() {},
        createImageData(w, h) {
            return makeImageData(w, h);
        }
    };
}

window.HTMLCanvasElement.prototype.getContext = function getContext(contextType) {
    if (contextType !== '2d') return null;
    this.__stub2dContext ??= createStub2DContext(this);
    return this.__stub2dContext;
};

window.HTMLCanvasElement.prototype.toDataURL = function toDataURL() {
    return 'data:image/png;base64,';
};
