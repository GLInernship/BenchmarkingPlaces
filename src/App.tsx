import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { GridProvider } from './Components/GridContext';
import Map from './Components/Map';
import NearbySearchPage from './Components/NearbySearchPage';

const App: React.FC = () => {
  return (
    <GridProvider>
      <Router>
        <div className="App" style={{margin: '0 5%'}}>
          <h1>Benchmarking Places</h1>
          <Routes>
            <Route path="/BenchmarkingPlaces" element={<Map />} />
            <Route path="/nearby-search" element={<NearbySearchPage />} />
          </Routes>
        </div>
      </Router>
    </GridProvider>
  );
};

export default App;