import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Node's ESM resolver requires explicit extensions on relative specifiers;
// src/ imports intentionally omit them (see #198), so retry with each
// candidate extension before giving up.
export async function resolve(specifier, context, nextResolve) {
    try {
        return await nextResolve(specifier, context);
    } catch (err) {
        if (err.code !== 'ERR_MODULE_NOT_FOUND' || !specifier.startsWith('.')) {
            throw err;
        }
        for (const ext of RESOLVE_EXTENSIONS) {
            try {
                return await nextResolve(specifier + ext, context);
            } catch {
                // try the next candidate extension
            }
        }
        throw err;
    }
}

// Node's native type-stripping only erases TS type syntax, not JSX, so .tsx
// component sources need an actual transform to run under `node --test`.
export async function load(url, context, nextLoad) {
    if (url.endsWith('.ts') || url.endsWith('.tsx')) {
        const filename = fileURLToPath(url);
        const source = readFileSync(filename, 'utf8');
        const { code } = esbuild.transformSync(source, {
            loader: url.endsWith('.tsx') ? 'tsx' : 'ts',
            format: 'esm',
            sourcefile: filename,
            sourcemap: 'inline',
            jsx: 'automatic'
        });
        return { format: 'module', source: code, shortCircuit: true };
    }
    return nextLoad(url, context);
}
