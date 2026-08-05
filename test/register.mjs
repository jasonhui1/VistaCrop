import { register } from 'node:module';

register('./hooks/ts-loader.mjs', import.meta.url);
await import('./hooks/dom-setup.mjs');
