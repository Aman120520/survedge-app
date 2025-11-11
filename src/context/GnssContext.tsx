/**
 * GNSS Context Provider
 * Manages external GNSS device connection status and data
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface GnssStatus {
  connected: boolean;
  fixType: string;
  satellites: number;
  lat?: number;
  lon?: number;
  alt?: number;
}

interface GnssContextType {
  gnssStatus: GnssStatus;
  setGnssStatus: (status: GnssStatus) => void;
}

const GnssContext = createContext<GnssContextType | undefined>(undefined);

export const GnssProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gnssStatus, setGnssStatus] = useState<GnssStatus>({
    connected: false,
    fixType: 'No Fix',
    satellites: 0,
  });

  return (
    <GnssContext.Provider value={{ gnssStatus, setGnssStatus }}>
      {children}
    </GnssContext.Provider>
  );
};

export const useGnss = (): GnssContextType => {
  const context = useContext(GnssContext);
  if (!context) {
    throw new Error('useGnss must be used within GnssProvider');
  }
  return context;
};

