import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SRC_ROOT, collectModuleGraph, relativeToSrc } from './helpers/moduleGraph.mjs';

const REPO_ROOT = path.join(SRC_ROOT, '..');
const CLIENT_ENTRYPOINT = path.join(SRC_ROOT, 'index.ts');
const SERVER_ENTRYPOINT = path.join(SRC_ROOT, 'server.ts');

const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));

const clientGraph = collectModuleGraph(CLIENT_ENTRYPOINT);
const serverGraph = collectModuleGraph(SERVER_ENTRYPOINT);

/** The first directive prologue entry of a module, or null when it has none. */
function leadingDirective(file) {
    const source = fs.readFileSync(file, 'utf8');
    const withoutComments = source.replace(/^(?:\s*(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/))*/, '');
    const match = withoutComments.match(/^\s*(['"])([^'"]+)\1\s*;/);
    return match === null ? null : match[2];
}

test('the exports map resolves both entrypoints, types included, from source', () => {
    assert.deepEqual(Object.keys(manifest.exports), ['.', './server']);

    for (const [subpath, entry] of [['.', 'index.ts'], ['./server', 'server.ts']]) {
        const target = `./src/${entry}`;
        assert.deepEqual(
            manifest.exports[subpath],
            { types: target, default: target },
            `Expected "${subpath}" to resolve to ${target} for both types and runtime`
        );
        assert.ok(fs.existsSync(path.join(REPO_ROOT, target)), `${target} must exist`);
    }
});

test('the manifest offers no legacy main/types fallback around the exports map', () => {
    assert.equal(manifest.main, undefined);
    assert.equal(manifest.types, undefined);
});

test('React is a peer dependency so the consumer owns the only copy', () => {
    for (const peer of ['react', 'react-dom']) {
        assert.ok(manifest.peerDependencies?.[peer], `${peer} must be a peerDependency`);
        assert.equal(
            manifest.dependencies?.[peer],
            undefined,
            `${peer} must not also be a runtime dependency`
        );
    }
});

test('an install from a git ref ships every source file the consumer transpiles', () => {
    assert.ok(
        manifest.files?.includes('src'),
        `Expected "src" in the packed files, got: ${JSON.stringify(manifest.files)}`
    );

    // The demo app shares the src tree with the library but is excluded from
    // the tarball, so nothing either entrypoint reaches may live under it.
    const excluded = manifest.files
        .filter((pattern) => pattern.startsWith('!'))
        .map((pattern) => pattern.slice(1).replace(/^src\/?/, ''));

    for (const file of [...clientGraph.visited, ...serverGraph.visited]) {
        const relative = relativeToSrc(file);
        assert.ok(
            relative.length > 0 && !relative.startsWith('..'),
            `${file} is reachable from an entrypoint but lives outside the packed src tree`
        );
        for (const prefix of excluded) {
            assert.ok(
                relative !== prefix && !relative.startsWith(`${prefix}/`),
                `${relative} is reachable from an entrypoint but excluded from the tarball by "!src/${prefix}"`
            );
        }
    }
});

test('the client entrypoint declares the client boundary for its consumers', () => {
    assert.equal(
        leadingDirective(CLIENT_ENTRYPOINT),
        'use client',
        "index.ts must open with 'use client' so a server component can import the views"
    );
});

test('the server entrypoint is not reachable from the client entrypoint', () => {
    const serverModules = [SERVER_ENTRYPOINT, path.join(SRC_ROOT, 'lib', 'storage', 'server.ts')];

    for (const serverModule of serverModules) {
        assert.ok(
            !clientGraph.visited.has(serverModule),
            `${relativeToSrc(serverModule)} must stay out of the client module graph`
        );
    }
});
