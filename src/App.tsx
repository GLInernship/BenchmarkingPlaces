import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { GridProvider } from './Components/GridContext';
import Map from './Components/Map';
import NearbySearchPage from './Components/NearbySearchPage';
import ResultPage from './Components/ResultPage';
import {VisualizationPage} from './Components/VisualizationPage';
import Reportgenerationpage from './Components/ReportGeneration/Reportgenerationpage';
import PlaceDetailsPage from './Components/ReportGeneration/PlaceDetailsPage';
import { VisualizationPageMatchesGoogle } from './Components/ReportGeneration/VisualizationPageMatchesGoogle';
import { VisualizationPageStreet } from './Components/ReportGeneration/VisualizationPageStreet';
import { VisualizationPageDistance } from './Components/ReportGeneration/VisualizationPageDistance';
import { VisualizationPageName } from './Components/ReportGeneration/VisualizationPageName';

const App: React.FC = () => {
  return (
    <GridProvider>
      <Router>
        <div className="App pg-bg">
          <Routes>
            <Route path="/BenchmarkingPlaces" element={<Map />} />
            <Route path="/nearby-search" element={<NearbySearchPage />} />
            <Route path="/result-page" element={<ResultPage />} />
            <Route path="/visualization" element={<VisualizationPage />} />
            <Route path="/report-generation" element={<Reportgenerationpage/>} />
            <Route path="/place/:placeName" element={<PlaceDetailsPage/>} />
            <Route path="/visualizationmatchesgoogle" element={<VisualizationPageMatchesGoogle/>} />
            <Route path="/visualizationstreet" element={<VisualizationPageStreet/>} />
            <Route path="/visualizationdistance" element={<VisualizationPageDistance/>} />
            <Route path="/visualizationname" element={<VisualizationPageName/>} />
          </Routes>
        </div>
      </Router>
    </GridProvider>
  );
};

export default App;