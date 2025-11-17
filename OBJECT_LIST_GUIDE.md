# Object List Feature - Complete Guide

## 📋 What is Object List?

The **Object List** is a comprehensive view of all your survey data (points and lines) in a single scrollable list. It provides:
- **Overview** of all collected features
- **Search functionality** to find specific objects
- **Quick navigation** to any point or line on the map
- **Export functionality** to save your data
- **Calculated measurements** for lines (length/area)

---

## 🚀 How to Access Object List

### Method 1: Top Menu (Recommended)
1. Tap the **three dots (⋮)** icon in the top right of the Survey screen
2. Select **"Object list"** from the dropdown menu
3. Object List bottom sheet opens (90% of screen)

### Method 2: Direct Access
- The Object List can also be opened programmatically from other parts of the app

---

## 📊 What You'll See

### Header Section
- **Title**: "Objects X" (where X is the total count of points + lines)
- **Export Button**: Download icon (top right) to export all data

### Search Bar
- **Search Input**: Type to filter objects by:
  - Point/Line ID
  - Code name
  - Any text in the subtitle

### List Items

#### **Points Display:**
- **Icon**: Small dot (●) indicator
- **Name**: `PointID CodeName` (e.g., "P1 TREE", "P2 POLE")
- **Subtitle**: Date and time when point was created
  - Format: "15 Jan 2024 • 14:30"
- **Example**: 
  ```
  ●  P1 TREE
     15 Jan 2024 • 14:30
  ```

#### **Lines Display:**
- **Icon**: Branch icon (rotated 90°)
- **Name**: Line ID (e.g., "L1", "L2")
- **Subtitle**: Number of points + calculated measurement
  - For open lines: "5 points • 123.456 m" (length)
  - For closed lines/polygons: "6 points • 45.678 m²" (area)
- **Example**:
  ```
  ━  L1
     5 points • 123.456 m
  ```

### Sorting
- Objects are sorted by **timestamp** (newest first)
- Most recently created items appear at the top

---

## 🎯 Features & Functionality

### 1. **Search Functionality**

**How to Use:**
1. Tap the search bar at the top
2. Type any text:
   - Point ID (e.g., "P1", "P2")
   - Code name (e.g., "TREE", "POLE")
   - Line ID (e.g., "L1")
   - Any part of the subtitle

**What it Searches:**
- Point/Line IDs
- Code names
- Subtitle text (dates, measurements, etc.)

**Example Searches:**
- `"P1"` → Shows only point P1
- `"TREE"` → Shows all points with "TREE" code
- `"123"` → Shows lines with length ~123m or points created on dates with "123"
- `"L1"` → Shows only line L1

---

### 2. **Navigate to Object on Map**

**How to Use:**
1. Tap any item in the list
2. Object List closes automatically
3. Map centers on the selected object
4. Object detail sheet opens (if available)

**What Happens:**
- **For Points**: Map zooms to point location, detail sheet shows point info
- **For Lines**: Map zooms to show entire line, detail sheet shows line info

**Use Cases:**
- Find a specific point you created earlier
- Review a line's location on the map
- Verify object placement
- Navigate to objects quickly without panning

---

### 3. **Export Data**

**How to Use:**
1. Tap the **download icon** (⬇) in the top right
2. Export format screen opens
3. Select format (JSON, GeoJSON, CSV)
4. Choose export location
5. Data is exported

**What Gets Exported:**
- All points in the current project
- All lines in the current project
- All codes/attributes
- Complete project data

---

### 4. **View Object Count**

**Header Display:**
- Shows total count: "Objects 15"
- Updates automatically when you add/remove objects
- Includes both points and lines

---

## 📱 User Interface Details

### Visual Indicators

**Point Icon:**
- Small filled circle (●)
- Black color
- Represents a single point location

**Line Icon:**
- Branch/line icon (━)
- Blue color (#3F51B5)
- Rotated 90 degrees
- Represents a line/polygon

**Chevron:**
- Right arrow (→) on each item
- Indicates item is tappable
- Gray color

### Layout
- **Full-screen bottom sheet** (90% height)
- **Scrollable list** for many objects
- **Separators** between items
- **Safe area** padding for notched devices

---

## 🔍 Understanding the Display

### Point Information

**Format:** `PointID CodeName`
- **PointID**: Auto-generated (P1, P2, P3...) or custom ID
- **CodeName**: Code assigned to the point (e.g., "TREE", "POLE", "NO CODE")

**Timestamp:**
- Date: "15 Jan 2024"
- Time: "14:30" (24-hour format)
- Shows when point was created

### Line Information

**Format:** `LineID`
- **LineID**: Auto-generated (L1, L2, L3...) or custom ID

**Subtitle Format:**
- **Open Line**: `"X points • Y.XXX m"`
  - X = number of points in line
  - Y.XXX = length in meters (3 decimal places)
- **Closed Line/Polygon**: `"X points • Y.XXX m²"`
  - X = number of points
  - Y.XXX = area in square meters (3 decimal places)

**Examples:**
- `"5 points • 123.456 m"` → Open line, 5 points, 123.456 meters long
- `"6 points • 45.678 m²"` → Closed polygon, 6 points, 45.678 square meters area

---

## 🧪 Testing Guide

### Test 1: Basic Display
**Steps:**
1. Create 3-5 points using the measurement interface
2. Create 1-2 lines
3. Open Object List
4. **Expected**: All points and lines appear in list

**What to Verify:**
- ✅ All points are listed
- ✅ All lines are listed
- ✅ Count in header is correct
- ✅ Items are sorted (newest first)
- ✅ Icons are correct (● for points, ━ for lines)

---

### Test 2: Search Functionality
**Steps:**
1. Open Object List
2. Type "P1" in search bar
3. **Expected**: Only point P1 appears

**Test Multiple Searches:**
- Search by Point ID: "P1", "P2"
- Search by Code: "TREE", "POLE"
- Search by Line ID: "L1"
- Search partial: "P" (shows all points starting with P)

**What to Verify:**
- ✅ Search filters correctly
- ✅ Results update as you type
- ✅ Case-insensitive search
- ✅ Clears when search text is deleted

---

### Test 3: Navigate to Object
**Steps:**
1. Open Object List
2. Tap on a point (e.g., "P1 TREE")
3. **Expected**: 
   - Object List closes
   - Map centers on point
   - Detail sheet opens (if implemented)

**What to Verify:**
- ✅ Object List closes
- ✅ Map moves to object location
- ✅ Object is visible on map
- ✅ Detail sheet opens (if available)

---

### Test 4: Line Measurements
**Steps:**
1. Create a line with 5 points
2. Open Object List
3. Find the line in the list
4. **Expected**: Shows "5 points • X.XXX m" (with calculated length)

**Test Closed Polygon:**
1. Create a closed line (polygon) with 4+ points
2. Open Object List
3. **Expected**: Shows "4 points • X.XXX m²" (with calculated area)

**What to Verify:**
- ✅ Length is calculated for open lines
- ✅ Area is calculated for closed polygons
- ✅ Measurements are accurate
- ✅ Format is correct (meters or square meters)

---

### Test 5: Export Functionality
**Steps:**
1. Open Object List
2. Tap export button (download icon)
3. **Expected**: Export format screen opens

**What to Verify:**
- ✅ Export button works
- ✅ Export screen opens
- ✅ Can select format
- ✅ Export completes successfully

---

### Test 6: Large Dataset
**Steps:**
1. Create 50+ points (use Random button)
2. Create 10+ lines
3. Open Object List
4. **Expected**: All items load, list is scrollable

**What to Verify:**
- ✅ All items appear
- ✅ List scrolls smoothly
- ✅ Performance is good
- ✅ Search still works with many items

---

### Test 7: Empty State
**Steps:**
1. Start with no points or lines
2. Open Object List
3. **Expected**: Shows "Objects 0", empty list

**What to Verify:**
- ✅ Header shows "Objects 0"
- ✅ List is empty (no errors)
- ✅ Search bar still works
- ✅ Export button still available

---

### Test 8: Real-time Updates
**Steps:**
1. Open Object List
2. Note the count (e.g., "Objects 5")
3. Create a new point (without closing Object List)
4. **Expected**: Count updates to "Objects 6", new point appears

**What to Verify:**
- ✅ Count updates automatically
- ✅ New items appear in list
- ✅ Sorting is maintained (newest first)
- ✅ No need to refresh

---

## 💡 Tips & Best Practices

### 1. **Using Search Effectively**
- Use partial matches: "P" finds all points
- Search by code to group similar objects
- Use line IDs to find specific lines quickly

### 2. **Navigating Large Lists**
- Use search to filter instead of scrolling
- Remember: newest items are at the top
- Tap items to jump to them on the map

### 3. **Understanding Measurements**
- **Length (m)**: Distance along the line
- **Area (m²)**: Area enclosed by closed polygon
- Measurements update automatically when line points change

### 4. **Export Workflow**
- Review objects in list before exporting
- Use search to verify you have all needed objects
- Export regularly to backup your data

---

## 🐛 Common Issues & Solutions

### Issue: Object not appearing in list
**Possible Causes:**
- Object was deleted
- Search filter is active
- Object belongs to different project

**Solution:**
- Clear search bar
- Check if object exists on map
- Verify current project

---

### Issue: Line shows "Invalid geometry"
**Possible Causes:**
- Line has less than 3 points (for area calculation)
- Points are in invalid configuration
- Line is corrupted

**Solution:**
- Check line has enough points
- Verify points are valid
- Recreate line if needed

---

### Issue: Search not working
**Possible Causes:**
- Typo in search term
- Object doesn't match search criteria
- Case sensitivity (shouldn't be an issue)

**Solution:**
- Clear search and try again
- Use partial matches
- Check object ID/code spelling

---

### Issue: Can't tap on items
**Possible Causes:**
- Bottom sheet is closing
- Touch area is too small
- App is frozen

**Solution:**
- Try tapping again
- Ensure Object List is fully open
- Restart app if needed

---

## 📝 Quick Reference

### Keyboard Shortcuts
- None (touch-based interface)

### Gestures
- **Scroll**: Swipe up/down to scroll list
- **Tap**: Select item to navigate
- **Type**: Search for objects

### Icons Legend
- **●** = Point
- **━** = Line/Polygon
- **⬇** = Export
- **🔍** = Search
- **→** = Tappable item

---

## 🎓 Understanding the Data

### What Gets Listed?
- **All points** in current project
- **All lines** in current project
- **Sorted by timestamp** (newest first)

### What Doesn't Get Listed?
- Deleted objects
- Objects from other projects
- Temporary/cluster points

### Data Updates
- Updates in real-time
- No refresh needed
- Automatically syncs with map

---

## ✅ Testing Checklist

After testing, verify:
- [ ] Object List opens from top menu
- [ ] All points are displayed
- [ ] All lines are displayed
- [ ] Count in header is correct
- [ ] Search functionality works
- [ ] Can navigate to objects on map
- [ ] Line measurements are correct
- [ ] Export button works
- [ ] List scrolls smoothly
- [ ] Items are sorted correctly (newest first)
- [ ] Real-time updates work
- [ ] Empty state displays correctly

---

**Happy Surveying! 🗺️**

