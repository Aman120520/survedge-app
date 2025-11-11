/**
 * Generate Test Data Script
 * Creates a large test file with 20,000+ features for performance testing
 * 
 * Usage: node scripts/generate-test-data.js
 */

const fs = require('fs');
const path = require('path');
const { generateTestData } = require('./generate-test-data-helper');

// Configuration
const NUM_POINTS = 10000;
const NUM_LINES = 10000;
const OUTPUT_DIR = path.join(__dirname, '..', 'test-data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'test_survey_20000_features.json');

console.log('🚀 Generating test data with 20,000+ features...\n');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate test data
const { points, lines, codes } = generateTestData(NUM_POINTS, NUM_LINES);

console.log(`✓ Generated ${codes.length} codes`);
console.log(`✓ Generated ${points.length} points`);
console.log(`✓ Generated ${lines.length} lines`);

// Create survey data object
const surveyData = {
  points,
  lines,
  codes,
  metadata: {
    generatedAt: new Date().toISOString(),
    totalPoints: points.length,
    totalLines: lines.length,
    totalFeatures: points.length + lines.length,
    totalCodes: codes.length,
    center: [centerLon, centerLat],
    spread: spread
  }
};

// Write to file
console.log('\n💾 Writing to file...');
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(surveyData, null, 2), 'utf8');

// Get file size
const stats = fs.statSync(OUTPUT_FILE);
const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log('\n✅ Test data generated successfully!');
console.log(`\n📊 Statistics:`);
console.log(`   - Points: ${points.length.toLocaleString()}`);
console.log(`   - Lines: ${lines.length.toLocaleString()}`);
console.log(`   - Total Features: ${(points.length + lines.length).toLocaleString()}`);
console.log(`   - Codes: ${codes.length}`);
console.log(`   - File Size: ${fileSizeMB} MB`);
console.log(`\n📁 File Location:`);
console.log(`   ${OUTPUT_FILE}`);
console.log(`\n💡 To use this file:`);
console.log(`   1. Copy the file to your device/emulator`);
console.log(`   2. Open the app and go to Survey tab`);
console.log(`   3. Tap "Import JSON" button`);
console.log(`   4. Select the generated file`);
console.log(`   5. Watch the progress indicator!`);
console.log(`\n🎯 This will test:`);
console.log(`   - Import of 20,000+ features`);
console.log(`   - Batch processing performance`);
console.log(`   - Progress tracking`);
console.log(`   - Memory management`);
console.log(`   - Rendering of large datasets`);
console.log(`   - Clustering at different zoom levels`);

