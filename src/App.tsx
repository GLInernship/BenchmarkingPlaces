import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { GridProvider } from './Components/GridContext';
import Map from './Components/Map';
import NearbySearchPage from './Components/NearbySearchPage';
import ResultPage from './Components/ResultPage';
import ReportGenerationPage from './Components/ReportGenerationPage';

const App: React.FC = () => {
  return (
    <GridProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/BenchmarkingPlaces" element={<Map />} />
            <Route path="/nearby-search" element={<NearbySearchPage />} />
            <Route path="/result-page" element={<ResultPage />} />
            <Route path="/report-generation" element={<ReportGenerationPage />} />
          </Routes>
        </div>
      </Router>
    </GridProvider>
  );
};

export default App;