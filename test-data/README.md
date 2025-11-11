# Test Data Files

This directory contains test files for performance testing of the survey mapping application.

## Generated Files

### `test_survey_20000_features.json`
- **Format:** JSON (Native Survey Format)
- **Features:** 20,000 total
  - 10,000 points
  - 10,000 lines
- **Size:** ~4.17 MB
- **Codes:** 16 different codes
- **Use Case:** Test import/export performance, rendering of large datasets

## How to Use

### On Android Device/Emulator:

1. **Copy file to device:**
   ```bash
   adb push test-data/test_survey_20000_features.json /sdcard/Download/
   ```

2. **Or use Android Studio:**
   - Open Device File Explorer
   - Navigate to `/sdcard/Download/`
   - Drag and drop the file

### On iOS Simulator:

1. **Copy file to simulator:**
   ```bash
   xcrun simctl addmedia booted test-data/test_survey_20000_features.json
   ```

2. **Or drag and drop:**
   - Open Simulator
   - Drag file from Finder to Simulator window

### In the App:

1. Open the app and navigate to **Survey** tab
2. Tap **"Import JSON"** button (top right)
3. Select the test file from Downloads/Files
4. Watch the progress indicator
5. Wait for import to complete
6. Test the following:
   - ✅ Zoom in/out (should be smooth)
   - ✅ Pan around (should be smooth)
   - ✅ Select features (should be instant)
   - ✅ Check clustering (zoom out to see clusters)
   - ✅ Export data (test export performance)

## Expected Performance

- **Import Time:** 2-5 seconds (depending on device)
- **Rendering:** Smooth 60fps zoom/pan
- **Selection:** Instant (< 100ms)
- **Clustering:** Automatic at zoom ≤ 15
- **Memory:** Efficient, no crashes

## Generate More Test Data

To generate additional test files:

```bash
# Generate JSON format (20,000 features)
node scripts/generate-test-data.js

# Generate GeoJSON format (20,000 features)
node scripts/generate-test-data-geojson.js
```

## Test Scenarios

### Scenario 1: Large Dataset Import
1. Import `test_survey_20000_features.json`
2. Verify progress indicator shows
3. Verify import completes successfully
4. Verify all features appear on map

### Scenario 2: Clustering Test
1. Import the test file
2. Zoom out (zoom level < 15)
3. Verify points cluster together
4. Tap a cluster to zoom in
5. Verify points expand as you zoom

### Scenario 3: Performance Test
1. Import the test file
2. Rapidly zoom in/out
3. Pan around quickly
4. Select multiple features
5. Verify no lag or stuttering

### Scenario 4: Export Test
1. Import the test file
2. Export as JSON
3. Verify export completes
4. Compare file sizes
5. Re-import exported file
6. Verify data integrity

## Troubleshooting

**Issue:** Import is slow
- **Solution:** This is normal for 20,000 features. Progress indicator should show progress.

**Issue:** App crashes during import
- **Solution:** Check device memory. Close other apps. The app uses batch processing to manage memory.

**Issue:** Map is slow after import
- **Solution:** Zoom out to see clustering. Clustering reduces rendered features.

**Issue:** Can't find file to import
- **Solution:** Make sure file is in Downloads folder or accessible via file picker.

## File Structure

The JSON file structure:
```json
{
  "points": [...],      // Array of point features
  "lines": [...],       // Array of line features
  "codes": [...],       // Array of code definitions
  "metadata": {...}      // Generation metadata
}
```

## Notes

- Test files are generated with random coordinates around New York City (40.7128, -74.0060)
- You can modify the center coordinates in the script if needed
- Files are large (~4MB) - ensure sufficient storage space
- Import may take a few seconds - this is expected for 20,000 features

