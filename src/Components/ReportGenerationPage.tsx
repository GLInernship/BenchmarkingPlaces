import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

const ReportGenerationPage = () => {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<{ id: number; title: string; generatedAt: string; placeName: string; gridDivisions: string; poiCount: number; } | null>(null);

  // Dummy data for reports
  const dummyReports = [
    { id: 1, title: "New York City Analysis", generatedAt: "2024-06-25T14:30:00Z", placeName: "New York City", gridDivisions: "5x5", poiCount: 50 },
    { id: 2, title: "London Downtown Survey", generatedAt: "2024-06-24T09:15:00Z", placeName: "London", gridDivisions: "4x4", poiCount: 40 },
    { id: 3, title: "Tokyo Metropolitan Report", generatedAt: "2024-06-23T18:45:00Z", placeName: "Tokyo", gridDivisions: "6x6", poiCount: 60 },
    { id: 4, title: "Paris Tourist Hotspots", generatedAt: "2024-06-22T11:00:00Z", placeName: "Paris", gridDivisions: "3x3", poiCount: 30 },
  ];

  const handleReportSelect = (report: React.SetStateAction<{ id: number; title: string; generatedAt: string; placeName: string; gridDivisions: string; poiCount: number; } | null>) => {
    setSelectedReport(report);
  };

  const handleGenerateNewReport = () => {
    alert("Generating new report... This would typically open a modal or navigate to a new page.");
  };

  const handleBackToMap = () => {
    navigate('/');
  };

  return (
    <div style={styles.page}>
      <Header ref={undefined} isInput={false} ></Header>
      <h1 style={styles.title}>Recent Reports</h1>
      <div style={styles.buttonContainer}>
        <button style={styles.button} onClick={handleBackToMap}>Back to Map</button>
        <button style={styles.button} onClick={handleGenerateNewReport}>Generate New Report</button>
      </div>
      <div style={styles.content}>
        <div style={styles.reportList}>
          {dummyReports.map((report) => (
            <div 
              key={report.id} 
              style={{
                ...styles.reportItem,
                ...(selectedReport === report ? styles.selectedReport : {})
              }}
              onClick={() => handleReportSelect(report)}
            >
              <h3 style={styles.reportTitle}>{report.title}</h3>
              <p style={styles.reportDate}>Generated on: {new Date(report.generatedAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
        {selectedReport && (
          <div style={styles.reportDetails}>
            <h2 style={styles.detailsTitle}>{selectedReport.title}</h2>
            <p><strong>Generated on:</strong> {new Date(selectedReport.generatedAt).toLocaleString()}</p>
            <p><strong>Place Name:</strong> {selectedReport.placeName}</p>
            <p><strong>Grid Divisions:</strong> {selectedReport.gridDivisions}</p>
            <p><strong>POI Count:</strong> {selectedReport.poiCount}</p>
            <div style={styles.chart}>
              {/* Placeholder for a chart or graph */}
              <div style={styles.chartPlaceholder}>
                POI Distribution Chart
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  title: {
    color: '#333',
    borderBottom: '2px solid #007bff',
    paddingBottom: '10px',
  },
  buttonContainer: {
    marginBottom: '20px',
  },
  button: {
    marginRight: '10px',
    padding: '10px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  content: {
    display: 'flex',
    gap: '20px',
  },
  reportList: {
    flex: '1',
    maxWidth: '300px',
  },
  reportItem: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  selectedReport: {
    backgroundColor: '#e6f2ff',
    borderLeft: '4px solid #007bff',
  },
  reportTitle: {
    margin: '0 0 10px 0',
    color: '#007bff',
  },
  reportDate: {
    margin: '0',
    fontSize: '14px',
    color: '#666',
  },
  reportDetails: {
    flex: '2',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  detailsTitle: {
    color: '#007bff',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
  },
  chart: {
    marginTop: '20px',
  },
  chartPlaceholder: {
    height: '300px',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '8px',
    color: '#666',
    fontSize: '18px',
  },
};

export default ReportGenerationPage;