import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import Header from '../Header';
import axios from 'axios';

interface PlaceDetails {
  placeName: string;
  results: Array<{
    latLng: { lat: number; lng: number };
    subRegion: number;
    googlePlaces: Array<{
      types: string[];
      name: string;
      formatted_address: string;
      lat: number;
      lng: number;
    }>;
    hereBasedOnGoogle: Array<{
      name: string;
      lat: number;
      lng: number;
      matchesGoogle: boolean;
      neededStreetSimilary: boolean;
      neededDistanceMatch: boolean;
      neededNameSimilarity: boolean;
      address: string;
      categoryHereType : string;
    }>;
    herePlaces: Array<{
      categoryType: string;
      name: string;
      address: string;
      lat: number;
      lng: number;
    }>;
    googleBasedOnHere: Array<{
      name: string;
      lat: number;
      lng: number;
    } | null>;
  }>;
}

const PlaceDetailsPage: React.FC = () => {
  const location = useLocation();
  const { placeName } = useParams<{ placeName: string }>();
  const passedPlaceName = location.state?.placeName || placeName;
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [matchingData, setMatchingData] = useState<{ matches: number, nonMatches: number }>({ matches: 0, nonMatches: 0 });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        const response = await axios.get(`https://j5s9dm7w-9000.inc1.devtunnels.ms/api/place/${passedPlaceName}`);
        setPlaceDetails(response.data.placeDetails);
        const matchingData = calculateMatchingData(response.data.placeDetails);
        setMatchingData(matchingData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching place details:', error);
        setIsLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [passedPlaceName]);

  const calculateMatchingData = (details: PlaceDetails) => {
    let matches = 0;
    let nonMatches = 0;

    details.results.forEach(result => {
      result.hereBasedOnGoogle.forEach(place => {
        if (place.matchesGoogle) {
          matches++;
        } else {
          nonMatches++;
        }
      });
    });

    return { matches, nonMatches };
  };

  const navigateToVisualization = () => {
    navigate('/visualization', { state: { matchingData } });
  };

  const tableHeaderStyle = { border: '1px solid black', padding: '8px', backgroundColor: '#f2f2f2' };
  const tableCellStyle = { border: '1px solid black', padding: '8px' };
  const innerTableHeaderStyle = { border: '1px solid black', padding: '4px', backgroundColor: '#e6e6e6' };
  const innerTableCellStyle = { border: '1px solid black', padding: '4px' };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!placeDetails) {
    return <div>No details found for this place.</div>;
  }

  return (
    <div>
      <Header isMapPage={true} />
      <h1>Search Results</h1>
      <p>Place Name: {placeDetails.placeName || 'N/A'}</p>
      <button onClick={navigateToVisualization} style={{ marginTop: '20px', padding: '10px 20px', marginBottom: '5px' }}>
        View Matching Data Visualization
      </button>

      {placeDetails.results && placeDetails.results.length > 0 ? (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Sub-Region</th>
              <th style={tableHeaderStyle}>LAT-LNG Coordinates</th>
              <th style={tableHeaderStyle}>Google Places API Results</th>
              <th style={tableHeaderStyle}>HERE API Results Based on Google Results</th>
              <th style={tableHeaderStyle}>HERE API Results</th>
              <th style={tableHeaderStyle}>Google API Results Based on HERE Results</th>
            </tr>
          </thead>
          <tbody>
            {placeDetails.results.map((result, index) => (
              <tr key={index}>
                <td style={tableCellStyle}>{result.subRegion}</td>
                <td style={tableCellStyle}>
                  ({result.latLng.lat.toFixed(6)}, {result.latLng.lng.toFixed(6)})
                </td>
                <td style={tableCellStyle}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={innerTableHeaderStyle}>Name</th>
                        <th style={innerTableHeaderStyle}>Type</th>
                        <th style={innerTableHeaderStyle}>Address</th>
                        <th style={innerTableHeaderStyle}>Coordinates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.googlePlaces.map((place, placeIndex) => (
                        <tr key={placeIndex}>
                          <td style={innerTableCellStyle}>{place.name}</td>
                          <td style={innerTableCellStyle}>{place.types.join(', ')}</td>
                          <td style={innerTableCellStyle}>{place.formatted_address}</td>
                          <td style={innerTableCellStyle}>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
                <td style={tableCellStyle}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={innerTableHeaderStyle}>Name</th>
                        <th style={innerTableHeaderStyle}>Type</th>
                        <th style={innerTableHeaderStyle}>Address</th>
                        <th style={innerTableHeaderStyle}>Coordinates</th>
                        <th style={innerTableHeaderStyle}>Matches Google</th>
                        <th style={innerTableHeaderStyle}>Needed Street Similarity</th>
                        <th style={innerTableHeaderStyle}>Needed Distance Match</th>
                        <th style={innerTableHeaderStyle}>Needed Name Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.hereBasedOnGoogle.map((place, placeIndex) => (
                        <tr key={placeIndex}>
                          <td style={innerTableCellStyle}>{place.name}</td>
                          <td style={innerTableCellStyle}>{place.categoryHereType}</td>
                          <td style={innerTableCellStyle}>{place.address}</td>
                          <td style={innerTableCellStyle}>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</td>
                          <td style={innerTableCellStyle}>{place.matchesGoogle ? 'Yes' : 'No'}</td>
                          <td style={innerTableCellStyle}>{place.neededStreetSimilary ? 'Yes' : 'No'}</td>
                          <td style={innerTableCellStyle}>{place.neededDistanceMatch ? 'Yes' : 'No'}</td>
                        <td style={innerTableCellStyle}>{place.neededNameSimilarity ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
                <td style={tableCellStyle}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={innerTableHeaderStyle}>Name</th>
                        <th style={innerTableHeaderStyle}>Type</th>
                        <th style={innerTableHeaderStyle}>Address</th>
                        <th style={innerTableHeaderStyle}>Coordinates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.herePlaces.map((place, placeIndex) => (
                        <tr key={placeIndex}>
                          <td style={innerTableCellStyle}>{place.name}</td>
                          <td style={innerTableCellStyle}>{place.categoryType}</td>
                          <td style={innerTableCellStyle}>{place.address}</td>
                          <td style={innerTableCellStyle}>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
                <td style={tableCellStyle}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={innerTableHeaderStyle}>Name</th>
                        <th style={innerTableHeaderStyle}>Coordinates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.googleBasedOnHere.map((place, placeIndex) => (
                        <tr key={placeIndex}>
                          <td style={innerTableCellStyle}>{place ? place.name : 'N/A'}</td>
                          <td style={innerTableCellStyle}>
                            {place ? `(${place.lat.toFixed(6)}, ${place.lng.toFixed(6)})` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No results available</p>
      )}
    </div>
  );
};

export default PlaceDetailsPage;