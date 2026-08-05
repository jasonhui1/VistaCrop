/**
 * Static import analysis shared by the entrypoint-boundary tests: resolves
 * TypeScript/TSX specifiers the way the bundler does, without executing them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SRC_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

const IMPORT_SPECIFIER_RE = /(?:import|export)(?:[^'"]*from)?\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;

/** Every module specifier a source file imports or re-exports, in source order. */
export function importSpecifiers(source) {
    const specifiers = [];
    for (const match of source.matchAll(IMPORT_SPECIFIER_RE)) {
        const specifier = match[1] ?? match[2];
        if (specifier) specifiers.push(specifier);
    }
    return specifiers;
}

/**
 * Absolute path of a local specifier, or null for bare specifiers (npm
 * packages and Node builtins, which resolve to no file in this repo).
 */
export function resolveLocalImport(specifier, fromFile) {
    let basePath;
    if (specifier.startsWith('.')) {
        basePath = path.resolve(path.dirname(fromFile), specifier);
    } else if (specifier.startsWith('@/')) {
        basePath = path.join(SRC_ROOT, specifier.slice(2));
    } else {
        return null;
    }

    const candidates = [
        basePath,
        `${basePath}.ts`,
        `${basePath}.tsx`,
        path.join(basePath, 'index.ts'),
        path.join(basePath, 'index.tsx')
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
    throw new Error(`Could not resolve "${specifier}" imported from ${fromFile}`);
}

/** Every local file reachable from an entrypoint, plus the bare specifiers it pulls in. */
export function collectModuleGraph(entryFile) {
    const visited = new Set();
    const externalSpecifiers = new Set();
    const stack = [entryFile];

    while (stack.length > 0) {
        const file = stack.pop();
        if (visited.has(file)) continue;
        visited.add(file);

        for (const specifier of importSpecifiers(fs.readFileSync(file, 'utf8'))) {
            const resolved = resolveLocalImport(specifier, file);
            if (resolved === null) externalSpecifiers.add(specifier);
            else if (!visited.has(resolved)) stack.push(resolved);
        }
    }

    return { visited, externalSpecifiers };
}

export function relativeToSrc(file) {
    return path.relative(SRC_ROOT, file).split(path.sep).join('/');
}
