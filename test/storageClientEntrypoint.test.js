import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import module from 'node:module';
import { SRC_ROOT, collectModuleGraph, relativeToSrc } from './helpers/moduleGraph.mjs';

const ENTRYPOINT = path.join(SRC_ROOT, 'index.ts');

const NODE_BUILTINS = new Set(module.builtinModules);

function assertNoBuiltins(entryFile) {
    const { visited, externalSpecifiers } = collectModuleGraph(entryFile);

    const builtinsPulledIn = [...externalSpecifiers].filter((specifier) => {
        const bare = specifier.startsWith('node:') ? specifier.slice('node:'.length) : specifier;
        return NODE_BUILTINS.has(bare);
    });

    assert.deepEqual(
        builtinsPulledIn,
        [],
        `Expected no Node builtins reachable from ${relativeToSrc(entryFile)}, ` +
        `but found: ${builtinsPulledIn.join(', ')} (module graph: ${[...visited].map(relativeToSrc).join(', ')})`
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
    const relative = [...visited].map(relativeToSrc);

    assert.ok(relative.includes('lib/storage/JsonStorageAdapter.ts'));
    assert.ok(relative.includes('lib/db.ts'));
    assert.ok(relative.includes('lib/imageDb.ts'));
    assert.ok(relative.includes('lib/cropDb.ts'));
});

test('top-level server entrypoint re-exports the file-backed adapter and db adapters', () => {
    const serverEntry = path.join(SRC_ROOT, 'server.ts');
    const { visited } = collectModuleGraph(serverEntry);
    const relative = [...visited].map(relativeToSrc);

    assert.ok(relative.includes('lib/storage/JsonStorageAdapter.ts'));
    assert.ok(relative.includes('lib/db.ts'));
    assert.ok(relative.includes('lib/imageDb.ts'));
    assert.ok(relative.includes('lib/cropDb.ts'));
});
