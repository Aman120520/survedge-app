import ExpoModulesCore
import UIKit
import MapKit

/**
 * Custom annotation class for efficient point rendering
 */
class PointAnnotation: NSObject, MKAnnotation {
  let id: String
  let coordinate: CLLocationCoordinate2D
  
  init(id: String, latitude: Double, longitude: Double) {
    self.id = id
    self.coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    super.init()
  }
}


/**
 * Custom native map view that handles rendering of 10,000+ points efficiently on the native UI thread.
 * 
 * This implementation uses MapKit with annotation clustering to handle large point datasets (10,000+)
 * with optimal performance. MapKit's built-in clustering automatically handles efficient rendering.
 */
class ExpoOptimisedMapRendererView: ExpoView, MKMapViewDelegate {
  
  private var currentPoints: [[String: Any]] = []
  private var currentRegion: [String: Double]?
  private var annotations: [PointAnnotation] = []
  
  // MapKit map view with clustering enabled
  private lazy var mapView: MKMapView = {
    let map = MKMapView()
    map.delegate = self
    map.translatesAutoresizingMaskIntoConstraints = false
    map.isUserInteractionEnabled = false // Allow touches to pass through to underlying MapLibre
    map.backgroundColor = .clear
    
    // Enable clustering for efficient rendering of large datasets
    // MapKit automatically clusters annotations when zoomed out
    return map
  }()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = .clear
    
    // Add map view
    addSubview(mapView)
    
    NSLayoutConstraint.activate([
      mapView.topAnchor.constraint(equalTo: topAnchor),
      mapView.leadingAnchor.constraint(equalTo: leadingAnchor),
      mapView.trailingAnchor.constraint(equalTo: trailingAnchor),
      mapView.bottomAnchor.constraint(equalTo: bottomAnchor)
    ])
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    mapView.frame = bounds
  }

  /**
   * Method to receive and render points from JavaScript.
   * This efficiently handles 10,000+ points using MapKit's built-in clustering.
   * 
   * - Parameter points: Array of point dictionaries with id, latitude, longitude
   */
  func setPoints(_ points: [[String: Any]]) {
    currentPoints = points
    
    NSLog("iOS: Received %d points for native rendering.", points.count)
    
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      
      // Remove existing annotations
      self.mapView.removeAnnotations(self.annotations)
      self.annotations.removeAll()
      
      // Create annotations from points
      var newAnnotations: [PointAnnotation] = []
      
      for point in points {
        guard let id = point["id"] as? String,
              let lat = point["latitude"] as? Double,
              let lon = point["longitude"] as? Double else {
          continue
        }
        
        let annotation = PointAnnotation(id: id, latitude: lat, longitude: lon)
        newAnnotations.append(annotation)
      }
      
      self.annotations = newAnnotations
      
      // Add annotations to map (MapKit will automatically cluster them)
      if !newAnnotations.isEmpty {
        self.mapView.addAnnotations(newAnnotations)
      }
    }
  }

  /**
   * Method to set the initial map region.
   * 
   * - Parameter region: Dictionary containing latitude, longitude, latitudeDelta, longitudeDelta
   */
  func setInitialRegion(_ region: [String: Double]) {
    currentRegion = region
    
    guard let lat = region["latitude"],
          let lon = region["longitude"],
          let latDelta = region["latitudeDelta"],
          let lonDelta = region["longitudeDelta"] else {
      return
    }
    
    NSLog("iOS: Setting initial region - lat: %f, lon: %f", lat, lon)
    
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      
      let coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lon)
      let span = MKCoordinateSpan(latitudeDelta: latDelta, longitudeDelta: lonDelta)
      let mapRegion = MKCoordinateRegion(center: coordinate, span: span)
      
      // Update map region to match underlying MapLibre view
      self.mapView.setRegion(mapRegion, animated: false)
    }
  }
  
  // MARK: - MKMapViewDelegate
  
  /**
   * Custom annotation view for points
   */
  func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
    // Handle cluster annotations (automatically created by MapKit)
    if let clusterAnnotation = annotation as? MKClusterAnnotation {
      let clusterView = mapView.dequeueReusableAnnotationView(withIdentifier: "cluster") as? MKMarkerAnnotationView
        ?? MKMarkerAnnotationView(annotation: annotation, reuseIdentifier: "cluster")
      
      clusterView.markerTintColor = .systemBlue
      clusterView.glyphText = "\(clusterAnnotation.memberAnnotations.count)"
      clusterView.displayPriority = .required
      
      return clusterView
    }
    
    // Handle individual point annotations
    if annotation is PointAnnotation {
      let pointView = mapView.dequeueReusableAnnotationView(withIdentifier: "point") as? MKAnnotationView
        ?? MKAnnotationView(annotation: annotation, reuseIdentifier: "point")
      
      // Create a simple circle view for the point
      let size: CGFloat = 6
      pointView.frame = CGRect(x: 0, y: 0, width: size, height: size)
      pointView.backgroundColor = .clear
      
      // Draw circle
      let circleLayer = CAShapeLayer()
      circleLayer.path = UIBezierPath(ovalIn: CGRect(x: 0, y: 0, width: size, height: size)).cgPath
      circleLayer.fillColor = UIColor.white.cgColor
      circleLayer.strokeColor = UIColor.black.cgColor
      circleLayer.lineWidth = 2
      
      // Remove old layers
      pointView.layer.sublayers?.forEach { $0.removeFromSuperlayer() }
      pointView.layer.addSublayer(circleLayer)
      
      // Enable clustering
      pointView.clusteringIdentifier = "pointCluster"
      pointView.displayPriority = .defaultLow
      
      return pointView
    }
    
    return nil
  }
  
  /**
   * Update region when map view region changes (to sync with underlying MapLibre)
   */
  func mapView(_ mapView: MKMapView, regionDidChangeAnimated animated: Bool) {
    // This allows the overlay to stay in sync with the underlying map
    // The region is controlled by the underlying MapLibre map
  }
}
