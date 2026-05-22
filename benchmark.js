const { performance } = require('perf_hooks');

const crops = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Crop ${i}` }));
const items = Array.from({ length: 1000 }, (_, i) => ({ cropId: Math.floor(Math.random() * 1000) }));

function testArrayFind() {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
        for (const item of items) {
            const crop = crops.find(c => c.id === item.cropId);
        }
    }
    const end = performance.now();
    return end - start;
}

function testMapLookup() {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
        const cropsMap = new Map(crops.map(c => [c.id, c]));
        for (const item of items) {
            const crop = cropsMap.get(item.cropId);
        }
    }
    const end = performance.now();
    return end - start;
}

const timeFind = testArrayFind();
const timeMap = testMapLookup();
console.log(`Array.find: ${timeFind}ms`);
console.log(`Map lookup: ${timeMap}ms`);
console.log(`Improvement: ${(timeFind / timeMap).toFixed(2)}x`);
