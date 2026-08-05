import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../src/index.ts';
import * as api from '../src/utils/api.ts';

test('the API module exports createApiClient and no module-level convenience wrappers', () => {
    assert.deepEqual(Object.keys(api), ['createApiClient']);
});

test('createApiClient defaults basePath to /api', async () => {
    let requestedUrl = null;
    global.fetch = async (url) => {
        requestedUrl = url;
        return {
            ok: true,
            json: async () => ({ crops: [{ id: 'crop1' }] })
        };
    };

    const client = createApiClient();
    const result = await client.loadAllCrops();
    assert.equal(requestedUrl, '/api/crops');
    assert.equal(result.length, 1);
});

test('createApiClient accepts custom basePath', async () => {
    let requestedUrl = null;
    let requestOptions = null;
    global.fetch = async (url, options) => {
        requestedUrl = url;
        requestOptions = options;
        return {
            ok: true,
            json: async () => ({ id: 'canvas123', updated: true })
        };
    };

    const customClient = createApiClient('/custom/v2/api');
    await customClient.saveCanvas('canvas123', { bg: 'white' }, []);

    assert.equal(requestedUrl, '/custom/v2/api/canvas/canvas123');
    assert.equal(requestOptions.method, 'PUT');
});

test('createApiClient strips trailing slashes from basePath', async () => {
    let requestedUrl = null;
    global.fetch = async (url) => {
        requestedUrl = url;
        return {
            ok: true,
            json: async () => ({ crops: [] })
        };
    };

    await createApiClient('/v1/app-api//').loadAllCrops();
    assert.equal(requestedUrl, '/v1/app-api/crops');
});
