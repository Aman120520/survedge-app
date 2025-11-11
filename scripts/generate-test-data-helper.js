/**
 * Helper functions for generating test data
 */

// Generate random code names
const codeNames = [
    'Boundary', 'Tree', 'Building', 'Road', 'Fence', 'Pole', 'Manhole',
    'Hydrant', 'Sign', 'Bench', 'Light', 'Gate', 'Wall', 'Corner',
    'Marker', 'Stake', 'Pillar', 'Monument', 'Control Point', 'Reference'
];

// Generate random coordinates around a center point
const centerLat = 40.7128; // New York City (adjust to your location)
const centerLon = -74.0060;
const spread = 0.1; // ~11km spread

function randomCoordinate() {
    return [
        centerLon + (Math.random() - 0.5) * spread,
        centerLat + (Math.random() - 0.5) * spread
    ];
}

function randomElevation() {
    return Math.round((Math.random() * 100 + 10) * 100) / 100; // 10-110m
}

function randomCode() {
    return codeNames[Math.floor(Math.random() * codeNames.length)];
}

function generatePoint(id, codeId) {
    return {
        id: `P${id}`,
        codeId: codeId,
        coords: randomCoordinate(),
        elevation: Math.random() > 0.3 ? randomElevation() : null,
        ts: new Date(Date.now() - Math.random() * 86400000).toISOString()
    };
}

function generateLine(id, codeId, pointIds) {
    return {
        id: `L${id}`,
        codeId: codeId,
        pointIds: pointIds,
        closed: Math.random() > 0.7,
        ts: new Date(Date.now() - Math.random() * 86400000).toISOString()
    };
}

function generateTestData(numPoints, numLines) {
    // Generate codes
    const codes = [
        { id: 'NO-CODE', name: 'NO CODE', type: 'point' }
    ];

    const usedCodes = new Set(['NO CODE']);
    for (let i = 0; i < 15; i++) {
        let codeName = randomCode();
        while (usedCodes.has(codeName)) {
            codeName = randomCode();
        }
        usedCodes.add(codeName);
        codes.push({
            id: `C-${i + 1}`,
            name: codeName,
            type: Math.random() > 0.5 ? 'point' : 'line'
        });
    }

    // Generate points
    const points = [];
    const pointCodeIds = codes.filter(c => c.type === 'point').map(c => c.id);
    const noCodeId = 'NO-CODE';

    for (let i = 1; i <= numPoints; i++) {
        const codeId = Math.random() > 0.2
            ? pointCodeIds[Math.floor(Math.random() * pointCodeIds.length)]
            : noCodeId;
        points.push(generatePoint(i, codeId));
    }

    // Generate lines
    const lines = [];
    const lineCodeIds = codes.filter(c => c.type === 'line').map(c => c.id);
    const availablePointIds = points.map(p => p.id);

    for (let i = 1; i <= numLines; i++) {
        const numLinePoints = 2 + Math.floor(Math.random() * 7);
        const linePointIds = [];
        const usedPointIndices = new Set();

        for (let j = 0; j < numLinePoints; j++) {
            let pointIndex;
            do {
                pointIndex = Math.floor(Math.random() * availablePointIds.length);
            } while (usedPointIndices.has(pointIndex));

            usedPointIndices.add(pointIndex);
            linePointIds.push(availablePointIds[pointIndex]);
        }

        const codeId = lineCodeIds.length > 0 && Math.random() > 0.3
            ? lineCodeIds[Math.floor(Math.random() * lineCodeIds.length)]
            : noCodeId;

        lines.push(generateLine(i, codeId, linePointIds));
    }

    return { points, lines, codes };
}

module.exports = { generateTestData };

