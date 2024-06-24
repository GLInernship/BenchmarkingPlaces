// GridContext.tsx
import React, { createContext, useState, useContext } from 'react';

interface GridContextType {
  divisionData: any[];
  poiData: any[];
  setDivisionData: (data: any[]) => void;
  setPoiData: (data: any[]) => void;
}

const GridContext = createContext<GridContextType | undefined>(undefined);

export const GridProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [divisionData, setDivisionData] = useState<any[]>([]);
  const [poiData, setPoiData] = useState<any[]>([]);

  return (
    <GridContext.Provider value={{ divisionData, poiData, setDivisionData, setPoiData }}>
      {children}
    </GridContext.Provider>
  );
};

export const useGridContext = () => {
  const context = useContext(GridContext);
  if (context === undefined) {
    throw new Error('useGridContext must be used within a GridProvider');
  }
  return context;
};