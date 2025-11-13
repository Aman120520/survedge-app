package expo.modules.optimisedmaprenderer

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.view.View
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import kotlin.math.max

/**
 * Custom native map view that handles rendering of 10,000+ points efficiently on the native UI thread.
 * 
 * This implementation uses efficient Canvas-based rendering with viewport culling and clustering
 * to handle large point datasets (10,000+) with optimal performance.
 */
class ExpoOptimisedMapRendererView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  private var currentPoints: List<Map<String, Any>> = emptyList()
  private var currentRegion: Map<String, Double>? = null
  
  // Rendering configuration
  private val pointPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    color = 0xFF000000.toInt() // Black stroke
    style = Paint.Style.STROKE
    strokeWidth = 4f
  }
  
  private val pointFillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    color = 0xFFFFFFFF.toInt() // White fill
    style = Paint.Style.FILL
  }
  
  // Viewport culling: only render points visible in current viewport
  private var viewportMinLat = Double.NEGATIVE_INFINITY
  private var viewportMaxLat = Double.POSITIVE_INFINITY
  private var viewportMinLon = Double.NEGATIVE_INFINITY
  private var viewportMaxLon = Double.POSITIVE_INFINITY
  
  // Clustering configuration
  private val clusterThreshold = 50.0 // pixels
  private var currentZoom = 1.0
  
  // Custom view for efficient point rendering
  private val pointRenderView = object : View(context) {
    override fun onDraw(canvas: Canvas) {
      super.onDraw(canvas)
      renderPoints(canvas)
    }
  }

  init {
    // Add the rendering view
    addView(pointRenderView)
    
    // Make view transparent to allow underlying MapLibre to show through
    setBackgroundColor(0x00000000) // Transparent
    pointRenderView.setBackgroundColor(0x00000000)
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    pointRenderView.layout(0, 0, right - left, bottom - top)
  }

  /**
   * Efficient point rendering with viewport culling and clustering
   */
  private fun renderPoints(canvas: Canvas) {
    if (currentPoints.isEmpty() || currentRegion == null) return
    
    val width = canvas.width.toFloat()
    val height = canvas.height.toFloat()
    
    // Calculate viewport bounds for culling
    val region = currentRegion!!
    val centerLat = region["latitude"] ?: 0.0
    val centerLon = region["longitude"] ?: 0.0
    val latDelta = region["latitudeDelta"] ?: 0.1
    val lonDelta = region["longitudeDelta"] ?: 0.1
    
    viewportMinLat = centerLat - latDelta / 2
    viewportMaxLat = centerLat + latDelta / 2
    viewportMinLon = centerLon - lonDelta / 2
    viewportMaxLon = centerLon + lonDelta / 2
    
    // Convert zoom level (approximate from delta)
    currentZoom = max(1.0, 18.0 - (max(latDelta, lonDelta) * 100))
    
    // Filter points within viewport (viewport culling)
    val visiblePoints = currentPoints.filter { point ->
      val lat = (point["latitude"] as? Number)?.toDouble() ?: return@filter false
      val lon = (point["longitude"] as? Number)?.toDouble() ?: return@filter false
      
      lat >= viewportMinLat && lat <= viewportMaxLat &&
      lon >= viewportMinLon && lon <= viewportMaxLon
    }
    
    if (visiblePoints.isEmpty()) return
    
    // For very large datasets, use clustering
    val shouldCluster = visiblePoints.size > 1000 && currentZoom < 15
    
    if (shouldCluster) {
      renderClusteredPoints(canvas, visiblePoints, width, height, centerLat, centerLon, latDelta, lonDelta)
    } else {
      renderAllPoints(canvas, visiblePoints, width, height, centerLat, centerLon, latDelta, lonDelta)
    }
  }
  
  /**
   * Render all points directly (for smaller datasets or high zoom)
   */
  private fun renderAllPoints(
    canvas: Canvas,
    points: List<Map<String, Any>>,
    width: Float,
    height: Float,
    centerLat: Double,
    centerLon: Double,
    latDelta: Double,
    lonDelta: Double
  ) {
    val pointRadius = 3f
    val strokeWidth = 4f
    
    points.forEach { point ->
      val lat = (point["latitude"] as? Number)?.toDouble() ?: return@forEach
      val lon = (point["longitude"] as? Number)?.toDouble() ?: return@forEach
      
      // Convert lat/lon to screen coordinates
      val x = ((lon - centerLon) / lonDelta + 0.5) * width
      val y = (0.5 - (lat - centerLat) / latDelta) * height
      
      // Only render if within bounds
      if (x >= -pointRadius && x <= width + pointRadius &&
          y >= -pointRadius && y <= height + pointRadius) {
        // Draw point (circle with stroke)
        canvas.drawCircle(x, y, pointRadius, pointFillPaint)
        canvas.drawCircle(x, y, pointRadius, pointPaint.apply { strokeWidth = strokeWidth })
      }
    }
  }
  
  /**
   * Render points with clustering (for large datasets)
   */
  private fun renderClusteredPoints(
    canvas: Canvas,
    points: List<Map<String, Any>>,
    width: Float,
    height: Float,
    centerLat: Double,
    centerLon: Double,
    latDelta: Double,
    lonDelta: Double
  ) {
    val clusters = mutableListOf<Cluster>()
    val clusterRadius = clusterThreshold / currentZoom.coerceAtLeast(1.0)
    
    points.forEach { point ->
      val lat = (point["latitude"] as? Number)?.toDouble() ?: return@forEach
      val lon = (point["longitude"] as? Number)?.toDouble() ?: return@forEach
      
      val x = ((lon - centerLon) / lonDelta + 0.5) * width
      val y = (0.5 - (lat - centerLat) / latDelta) * height
      
      // Find nearest cluster
      var nearestCluster: Cluster? = null
      var minDistance = clusterRadius
      
      clusters.forEach { cluster ->
        val dx = cluster.x - x
        val dy = cluster.y - y
        val distance = kotlin.math.sqrt(dx * dx + dy * dy)
        if (distance < minDistance) {
          minDistance = distance
          nearestCluster = cluster
        }
      }
      
      if (nearestCluster != null) {
        // Add to existing cluster
        nearestCluster.points.add(point)
        // Update cluster center (weighted average)
        val totalPoints = nearestCluster.points.size
        nearestCluster.x = (nearestCluster.x * (totalPoints - 1) + x) / totalPoints
        nearestCluster.y = (nearestCluster.y * (totalPoints - 1) + y) / totalPoints
      } else {
        // Create new cluster
        clusters.add(Cluster(x, y, mutableListOf(point)))
      }
    }
    
    // Render clusters
    clusters.forEach { cluster ->
      val pointRadius = if (cluster.points.size > 1) 6f else 3f
      val strokeWidth = if (cluster.points.size > 1) 5f else 4f
      
      canvas.drawCircle(cluster.x, cluster.y, pointRadius, pointFillPaint)
      canvas.drawCircle(cluster.x, cluster.y, pointRadius, pointPaint.apply { strokeWidth = strokeWidth })
      
      // Draw cluster count for large clusters
      if (cluster.points.size > 10) {
        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
          color = 0xFF000000.toInt()
          textSize = 10f
          textAlign = Paint.Align.CENTER
        }
        canvas.drawText(
          cluster.points.size.toString(),
          cluster.x,
          cluster.y + 4f,
          textPaint
        )
      }
    }
  }

  /**
   * Method to receive and render points from JavaScript.
   * This efficiently handles 10,000+ points using viewport culling and clustering.
   * 
   * @param points List of point objects with id, latitude, longitude
   */
  fun setPoints(points: List<Map<String, Any>>) {
    currentPoints = points
    
    android.util.Log.d("OptimizedMapRenderer", 
      "Android: Received ${points.size} points for native rendering.")
    
    // Trigger redraw on UI thread
    post {
      pointRenderView.invalidate()
    }
  }

  /**
   * Method to set the initial map region.
   * 
   * @param region Map containing latitude, longitude, latitudeDelta, longitudeDelta
   */
  fun setInitialRegion(region: Map<String, Double>) {
    currentRegion = region
    
    android.util.Log.d("OptimizedMapRenderer", 
      "Android: Setting initial region - lat: ${region["latitude"]}, lon: ${region["longitude"]}")
    
    // Trigger redraw with new region
    post {
      pointRenderView.invalidate()
    }
  }
  
  /**
   * Data class for clustering
   */
  private data class Cluster(
    var x: Float,
    var y: Float,
    val points: MutableList<Map<String, Any>>
  )
}
