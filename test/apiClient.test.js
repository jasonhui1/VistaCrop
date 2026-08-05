import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient, loadAllCrops, saveCanvas } from '../src/utils/api.ts';

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

test('standalone API functions support custom basePath parameter', async () => {
    let requestedUrl = null;
    global.fetch = async (url) => {
        requestedUrl = url;
        return {
            ok: true,
            json: async () => ({ crops: [] })
        };
    };

    await loadAllCrops('/v1/app-api');
    assert.equal(requestedUrl, '/v1/app-api/crops');
});
