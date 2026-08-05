/**
 * Public API surface for VistaCrop.
 *
 * The directive declares the client boundary here rather than in each view, so
 * a consumer can import from a server component without knowing which
 * internals are stateful (#204).
 */
'use client';

export { default as ComposerView } from './components/ComposerView';
export type { ComposerViewProps } from './components/ComposerView';

export { default as CanvasView } from './components/CanvasView';
export type { CanvasViewProps, CropData } from './components/CanvasView';

export { default as GalleryView } from './components/GalleryView';
export type { GalleryViewProps } from './components/GalleryView';

export { default as ImageUploader } from './components/ImageUploader';
export type { ImageUploaderProps } from './components/ImageUploader';

export * from './types';

export { StorageAdapterProvider, useStorageAdapter } from './lib/storage';
export type { StorageAdapterProviderProps } from './lib/storage';

export { createApiClient } from './utils/api';
