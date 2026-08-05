import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SRC_ROOT, collectModuleGraph, relativeToSrc } from './helpers/moduleGraph.mjs';

const REPO_ROOT = path.join(SRC_ROOT, '..');
const CLIENT_ENTRYPOINT = path.join(SRC_ROOT, 'index.ts');
const SERVER_ENTRYPOINT = path.join(SRC_ROOT, 'server.ts');

const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));

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

test('the package deep-imports nothing beyond the two entrypoints', () => {
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

test('an install from a git ref ships the source files the consumer transpiles', () => {
    assert.ok(
        manifest.files?.includes('src'),
        `Expected "src" in the packed files, got: ${JSON.stringify(manifest.files)}`
    );

    const { visited } = collectModuleGraph(CLIENT_ENTRYPOINT);
    for (const file of visited) {
        assert.ok(
            relativeToSrc(file).length > 0 && !relativeToSrc(file).startsWith('..'),
            `${file} is reachable from the entrypoint but lives outside the packed src tree`
        );
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
    const { visited } = collectModuleGraph(CLIENT_ENTRYPOINT);
    const serverModules = [SERVER_ENTRYPOINT, path.join(SRC_ROOT, 'lib', 'storage', 'server.ts')];

    for (const serverModule of serverModules) {
        assert.ok(
            !visited.has(serverModule),
            `${relativeToSrc(serverModule)} must stay out of the client module graph`
        );
    }
});
