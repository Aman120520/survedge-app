/**
 * Stakeout Context
 * Manages stakeout state and calculations
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as turf from '@turf/turf';
import { Point, Line } from '../geospatial/GeospatialProcessor';

export interface StakeoutTarget {
  type: 'point' | 'line';
  pointId?: string;
  lineId?: string;
  coordinates?: [number, number]; // For point stakeout
  lineCoordinates?: [number, number][]; // For line stakeout
}

export interface StakeoutGuidance {
  distance: number; // Distance in meters
  azimuth: number; // Azimuth in degrees (0-360)
  deltaE: number; // Easting difference
  deltaN: number; // Northing difference
  deltaU: number; // Elevation difference (cut/fill)
  direction: {
    north: number; // Distance to north
    south: number; // Distance to south
    east: number; // Distance to east
    west: number; // Distance to west
  };
  isClose: boolean; // < 1 meter
  isVeryClose: boolean; // < 10cm
}

interface StakeoutContextType {
  isActive: boolean;
  target: StakeoutTarget | null;
  guidance: StakeoutGuidance | null;
  setStakeoutTarget: (target: StakeoutTarget | null) => void;
  startStakeout: (target: StakeoutTarget) => void;
  stopStakeout: () => void;
  updateGuidance: (roverPosition: { lat: number; lon: number; alt?: number }) => void;
}

const StakeoutContext = createContext<StakeoutContextType | undefined>(undefined);

export const StakeoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [target, setTarget] = useState<StakeoutTarget | null>(null);
  const [guidance, setGuidance] = useState<StakeoutGuidance | null>(null);

  const setStakeoutTarget = (newTarget: StakeoutTarget | null) => {
    setTarget(newTarget);
    setIsActive(newTarget !== null);
    if (!newTarget) {
      setGuidance(null);
    }
  };

  const startStakeout = (newTarget: StakeoutTarget) => {
    setTarget(newTarget);
    setIsActive(true);
  };

  const stopStakeout = () => {
    setIsActive(false);
    setTarget(null);
    setGuidance(null);
  };

  const updateGuidance = (roverPosition: { lat: number; lon: number; alt?: number }) => {
    if (!target || !isActive) {
      setGuidance(null);
      return;
    }

    // Calculate guidance based on target type
    if (target.type === 'point' && target.coordinates) {
      const guidance = calculatePointStakeoutGuidance(
        roverPosition,
        target.coordinates,
        roverPosition.alt
      );
      setGuidance(guidance);
    } else if (target.type === 'line' && target.lineCoordinates) {
      // For line stakeout, find closest point on line
      const closestPoint = findClosestPointOnLine(
        [roverPosition.lon, roverPosition.lat],
        target.lineCoordinates
      );
      const guidance = calculatePointStakeoutGuidance(
        roverPosition,
        closestPoint,
        roverPosition.alt
      );
      setGuidance(guidance);
    }
  };

  return (
    <StakeoutContext.Provider
      value={{
        isActive,
        target,
        guidance,
        setStakeoutTarget,
        startStakeout,
        stopStakeout,
        updateGuidance,
      }}
    >
      {children}
    </StakeoutContext.Provider>
  );
};

export const useStakeout = (): StakeoutContextType => {
  const context = useContext(StakeoutContext);
  if (!context) {
    throw new Error('useStakeout must be used within StakeoutProvider');
  }
  return context;
};

/**
 * Calculate stakeout guidance for a point
 */
function calculatePointStakeoutGuidance(
  rover: { lat: number; lon: number; alt?: number },
  target: [number, number],
  targetElevation?: number
): StakeoutGuidance {
  const roverPoint = turf.point([rover.lon, rover.lat]);
  const targetPoint = turf.point(target);

  // Calculate distance using Turf.js (accurate)
  const distance = turf.distance(roverPoint, targetPoint, { units: 'meters' });

  // Calculate bearing (azimuth)
  const bearing = turf.bearing(roverPoint, targetPoint);
  const azimuth = bearing < 0 ? bearing + 360 : bearing;

  // Calculate delta E and N using local coordinate transformation
  // For small distances, use approximate transformation
  const dLat = target[1] - rover.lat;
  const dLon = target[0] - rover.lon;
  
  // Convert to meters (approximate for small distances)
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLon = 111320 * Math.cos((rover.lat * Math.PI) / 180);
  
  const deltaN = dLat * metersPerDegreeLat;
  const deltaE = dLon * metersPerDegreeLon;

  // Calculate direction components
  const direction = {
    north: deltaN > 0 ? deltaN : 0,
    south: deltaN < 0 ? Math.abs(deltaN) : 0,
    east: deltaE > 0 ? deltaE : 0,
    west: deltaE < 0 ? Math.abs(deltaE) : 0,
  };

  // Calculate elevation difference (cut/fill)
  const deltaU = targetElevation && rover.alt
    ? targetElevation - rover.alt
    : 0;

  return {
    distance,
    azimuth,
    deltaE,
    deltaN,
    deltaU,
    direction,
    isClose: distance < 1.0,
    isVeryClose: distance < 0.1, // 10cm
  };
}

/**
 * Find closest point on a line to a given point
 */
function findClosestPointOnLine(
  point: [number, number],
  line: [number, number][]
): [number, number] {
  if (line.length === 0) return point;
  if (line.length === 1) return line[0];

  let minDistance = Infinity;
  let closestPoint: [number, number] = line[0];

  for (let i = 0; i < line.length - 1; i++) {
    const segmentStart = line[i];
    const segmentEnd = line[i + 1];
    const pointOnSegment = closestPointOnSegment(point, segmentStart, segmentEnd);
    
    const dist = distanceBetweenPoints(point, pointOnSegment);
    if (dist < minDistance) {
      minDistance = dist;
      closestPoint = pointOnSegment;
    }
  }

  return closestPoint;
}

/**
 * Find closest point on a line segment
 */
function closestPointOnSegment(
  point: [number, number],
  segmentStart: [number, number],
  segmentEnd: [number, number]
): [number, number] {
  const [px, py] = point;
  const [x1, y1] = segmentStart;
  const [x2, y2] = segmentEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) return segmentStart;

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  
  return [x1 + t * dx, y1 + t * dy];
}

/**
 * Calculate distance between two points
 */
function distanceBetweenPoints(
  p1: [number, number],
  p2: [number, number]
): number {
  return turf.distance(turf.point(p1), turf.point(p2), { units: 'meters' });
}

