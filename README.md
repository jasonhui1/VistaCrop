# VistaCrop

Image cropping and composition views for Next.js apps, plus the demo app in
`src/app` that exercises them.

## Installing into a Next.js app

VistaCrop ships raw TypeScript source — no build step, no emitted declarations.
The consuming app transpiles it, so both ends must be Next.js + TypeScript.

```bash
npm install github:jasonhui1/VistaCrop#v0.1.0
```

```js
// next.config.mjs
export default { transpilePackages: ['vistacrop'] };
```

For local iteration, `npm link` from a checkout of this repo instead of
installing the git ref.

React and React DOM are peer dependencies: the consumer's copy is the only one.

## Entrypoints

| Import | Contents |
| --- | --- |
| `vistacrop` | The views (`CanvasView`, `ComposerView`, `GalleryView`, `ImageUploader`), `StorageAdapterProvider`, `createApiClient`, and the shared types |
| `vistacrop/server` | The storage adapters that touch the filesystem and the db |

`vistacrop` declares `'use client'` at the entrypoint, so a server component can
import the views without adding the directive itself. `vistacrop/server` pulls in
Node builtins and is unreachable from the client entrypoint.

## Working on this repo

```bash
npm run dev    # the demo app
npm test       # node:test suite
npm run build  # production build of the demo app
```
