/**
 * jsdom never fires load events for `new Image()`, so drive them by hand.
 * Every image loaded during `run` reports `size`, which callers that measure
 * the loaded image need to be able to state.
 */
export async function withImmediateImageLoading(run, size = { width: 100, height: 100 }) {
    const RealImage = globalThis.Image;
    class ImmediateImage {
        constructor() {
            this.width = size.width;
            this.height = size.height;
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
