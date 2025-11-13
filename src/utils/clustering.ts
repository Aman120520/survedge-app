/**
 * Feature Clustering Utilities
 * Cluster nearby points when zoomed out for better performance
 */

import * as turf from '@turf/turf';

export interface ClusterPoint {
  id: string;
  coords: [number, number];
  properties: any;
}

/**
 * Create clusters from points based on zoom level
 */
export const clusterPoints = (
  points: ClusterPoint[],
  zoom: number,
  clusterRadius: number = 50
): {
  clusters: Array<{
    coords: [number, number];
    count: number;
    pointIds: string[];
  }>;
  unclustered: ClusterPoint[];
} => {
  // Don't cluster at high zoom levels (zoom > 15)
  if (zoom > 15) {
    return {
      clusters: [],
      unclustered: points,
    };
  }

  // Calculate cluster distance based on zoom (meters)
  const clusterDistance = clusterRadius / Math.pow(2, zoom - 10);
  
  const clustered: Set<string> = new Set();
  const clusters: Array<{
    coords: [number, number];
    count: number;
    pointIds: string[];
  }> = [];
  const unclustered: ClusterPoint[] = [];

  for (let i = 0; i < points.length; i++) {
    if (clustered.has(points[i].id)) continue;

    const cluster: ClusterPoint[] = [points[i]];
    clustered.add(points[i].id);

    // Find nearby points
    for (let j = i + 1; j < points.length; j++) {
      if (clustered.has(points[j].id)) continue;

      const distance = turf.distance(
        turf.point(points[i].coords),
        turf.point(points[j].coords),
        { units: 'meters' }
      );

      if (distance < clusterDistance) {
        cluster.push(points[j]);
        clustered.add(points[j].id);
      }
    }

    if (cluster.length > 1) {
      // Create cluster
      const center = turf.centroid(
        turf.featureCollection(cluster.map((p) => turf.point(p.coords)))
      );
      clusters.push({
        coords: center.geometry.coordinates as [number, number],
        count: cluster.length,
        pointIds: cluster.map((p) => p.id),
      });
    } else {
      unclustered.push(cluster[0]);
    }
  }

  return { clusters, unclustered };
};

/**
 * Get optimal cluster radius based on zoom level
 */
export const getClusterRadius = (zoom: number): number => {
  // Smaller radius at higher zoom levels
  if (zoom > 15) return 0; // No clustering
  if (zoom > 12) return 30;
  if (zoom > 10) return 50;
  if (zoom > 8) return 100;
  return 200; // Very zoomed out
};

