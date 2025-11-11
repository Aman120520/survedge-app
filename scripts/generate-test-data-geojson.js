/**
 * Generate Test Data Script - GeoJSON Format
 * Creates a large GeoJSON test file with 20,000+ features
 * 
 * Usage: node scripts/generate-test-data-geojson.js
 */

const fs = require('fs');
const path = require('path');
const { generateTestData } = require('./generate-test-data-helper');

const OUTPUT_DIR = path.join(__dirname, '..', 'test-data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'test_survey_20000_features.geojson');

console.log('🚀 Generating GeoJSON test data with 20,000+ features...\n');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const { points, lines, codes } = generateTestData(10000, 10000);

// Convert to GeoJSON
const features = [];

// Add points
points.forEach((point) => {
  const code = codes.find((c) => c.id === point.codeId);
  features.push({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: point.coords,
    },
    properties: {
      id: point.id,
      code: code?.name || 'NO CODE',
      elevation: point.elevation,
      timestamp: point.ts,
    },
  });
});

// Add lines
const pointsMap = new Map(points.map((p) => [p.id, p]));
lines.forEach((line) => {
  const coords = line.pointIds
    .map((pid) => pointsMap.get(pid))
    .filter(Boolean)
    .map((p) => p.coords);

  if (coords.length >= 2) {
    const finalCoords =
      line.closed && coords.length >= 3 ? [...coords, coords[0]] : coords;

    const code = codes.find((c) => c.id === line.codeId);
    features.push({
      type: 'Feature',
      geometry: {
        type: line.closed && coords.length >= 3 ? 'Polygon' : 'LineString',
        coordinates:
          line.closed && coords.length >= 3 ? [finalCoords] : finalCoords,
      },
      properties: {
        id: line.id,
        code: code?.name || 'NO CODE',
        timestamp: line.ts,
      },
    });
  }
});

const geoJSON = {
  type: 'FeatureCollection',
  features,
};

// Write to file
console.log('💾 Writing to file...');
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geoJSON, null, 2), 'utf8');

// Get file size
const stats = fs.statSync(OUTPUT_FILE);
const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log('\n✅ GeoJSON test data generated successfully!');
console.log(`\n📊 Statistics:`);
console.log(`   - Features: ${features.length.toLocaleString()}`);
console.log(`   - Points: ${points.length.toLocaleString()}`);
console.log(`   - Lines: ${lines.length.toLocaleString()}`);
console.log(`   - File Size: ${fileSizeMB} MB`);
console.log(`\n📁 File Location:`);
console.log(`   ${OUTPUT_FILE}`);

