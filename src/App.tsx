import React from 'react';
import Map from './Components/Map'

const App: React.FC = () => {
  return (
    <div className="App" style={{margin: '0 25%'}}>
      <h1>Benchmarking Places</h1>
      <Map />
    </div>
  );
};

export default App;
