import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
    SRC_ROOT,
    importSpecifiers,
    relativeToSrc,
    resolveLocalImport
} from './helpers/moduleGraph.mjs';

const CLIENT_ENTRYPOINT = path.join(SRC_ROOT, 'index.ts');
const SERVER_ENTRYPOINT = path.join(SRC_ROOT, 'server.ts');

/** Every file the bundled demo app is made of: the React host plus the Next routes. */
function demoAppFiles() {
    const files = [path.join(SRC_ROOT, 'App.tsx')];
    const stack = [path.join(SRC_ROOT, 'app')];

    while (stack.length > 0) {
        const dir = stack.pop();
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) stack.push(full);
            else if (/\.tsx?$/.test(entry.name)) files.push(full);
        }
    }

    return files;
}

test('the demo app reaches the library only through its public entrypoints', () => {
    const demoFiles = new Set(demoAppFiles());
    const allowed = new Set([CLIENT_ENTRYPOINT, SERVER_ENTRYPOINT, ...demoFiles]);
    const violations = [];

    for (const file of demoFiles) {
        for (const specifier of importSpecifiers(fs.readFileSync(file, 'utf8'))) {
            if (specifier.endsWith('.css')) continue;

            const resolved = resolveLocalImport(specifier, file);
            if (resolved !== null && !allowed.has(resolved)) {
                violations.push(`${relativeToSrc(file)} -> ${specifier}`);
            }
        }
    }

    assert.deepEqual(
        violations,
        [],
        `Demo app must import only from index.ts / server.ts, but found deep imports: ${violations.join(', ')}`
    );
});
