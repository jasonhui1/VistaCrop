import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import module from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.join(__dirname, '..', 'src');
const ENTRYPOINT = path.join(SRC_ROOT, 'index.ts');

const NODE_BUILTINS = new Set(module.builtinModules);

const IMPORT_SPECIFIER_RE = /(?:import|export)(?:[^'"]*from)?\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;

function resolveModuleFile(specifier, fromFile) {
    let basePath;
    if (specifier.startsWith('.')) {
        basePath = path.resolve(path.dirname(fromFile), specifier);
    } else if (specifier.startsWith('@/')) {
        basePath = path.join(SRC_ROOT, specifier.slice(2));
    } else {
        // bare specifier: npm package or Node builtin, not a local file
        return { local: false, specifier };
    }

    const candidates = [
        basePath,
        `${basePath}.ts`,
        `${basePath}.tsx`,
        path.join(basePath, 'index.ts'),
        path.join(basePath, 'index.tsx')
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return { local: true, file: candidate };
        }
    }
    throw new Error(`Could not resolve "${specifier}" imported from ${fromFile}`);
}

function collectModuleGraph(entryFile) {
    const visited = new Set();
    const externalSpecifiers = new Set();
    const stack = [entryFile];

    while (stack.length > 0) {
        const file = stack.pop();
        if (visited.has(file)) continue;
        visited.add(file);

        const source = fs.readFileSync(file, 'utf8');
        for (const match of source.matchAll(IMPORT_SPECIFIER_RE)) {
            const specifier = match[1] ?? match[2];
            if (!specifier) continue;

            const resolved = resolveModuleFile(specifier, file);
            if (resolved.local) {
                if (!visited.has(resolved.file)) stack.push(resolved.file);
            } else {
                externalSpecifiers.add(resolved.specifier);
            }
        }
    }

    return { visited, externalSpecifiers };
}

function assertNoBuiltins(entryFile) {
    const { visited, externalSpecifiers } = collectModuleGraph(entryFile);

    const builtinsPulledIn = [...externalSpecifiers].filter((specifier) => {
        const bare = specifier.startsWith('node:') ? specifier.slice('node:'.length) : specifier;
        return NODE_BUILTINS.has(bare);
    });

    assert.deepEqual(
        builtinsPulledIn,
        [],
        `Expected no Node builtins reachable from ${path.relative(SRC_ROOT, entryFile)}, ` +
        `but found: ${builtinsPulledIn.join(', ')} (module graph: ${[...visited].map((f) => path.relative(SRC_ROOT, f)).join(', ')})`
    );
}

test('public entrypoint module graph contains no Node builtins', () => {
    assertNoBuiltins(ENTRYPOINT);
});

test('public storage barrel module graph contains no Node builtins', () => {
    assertNoBuiltins(path.join(SRC_ROOT, 'lib', 'storage', 'index.ts'));
});

test('server storage entrypoint still exposes the file-backed adapter and db adapters', () => {
    const serverEntry = path.join(SRC_ROOT, 'lib', 'storage', 'server.ts');
    const { visited } = collectModuleGraph(serverEntry);
    const relative = [...visited].map((f) => path.relative(SRC_ROOT, f).split(path.sep).join('/'));

    assert.ok(relative.includes('lib/storage/JsonStorageAdapter.ts'));
    assert.ok(relative.includes('lib/db.ts'));
    assert.ok(relative.includes('lib/imageDb.ts'));
    assert.ok(relative.includes('lib/cropDb.ts'));
});

test('top-level server entrypoint re-exports the file-backed adapter and db adapters', () => {
    const serverEntry = path.join(SRC_ROOT, 'server.ts');
    const { visited } = collectModuleGraph(serverEntry);
    const relative = [...visited].map((f) => path.relative(SRC_ROOT, f).split(path.sep).join('/'));

    assert.ok(relative.includes('lib/storage/JsonStorageAdapter.ts'));
    assert.ok(relative.includes('lib/db.ts'));
    assert.ok(relative.includes('lib/imageDb.ts'));
    assert.ok(relative.includes('lib/cropDb.ts'));
});
