import React, { useState, useEffect } from 'react';
import { useGridContext } from './GridContext';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

interface POI {
  name: string;
  lat: number;
  lng: number;
  divisionIndex: number;
}

interface NearbyPlace {
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
}

interface GroupedPOI {
  divisionIndex: number;
  center: { lat: number; lng: number };
  centerAddress: string;
  pois: {
    poi: POI;
    nearbyPlaces: NearbyPlace[];
    hereNearbyPlaces: HereNearbyPlace[];
  }[];
}

interface LocationState {
  divisionIndex: number;
  centers: { index: number; center: { lat: number; lng: number } }[];
  searchRadius: number;
  resultLimit: number;
}

interface HereNearbyPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const NearbySearchPage: React.FC = () => {
  const { divisionData, poiData } = useGridContext();
  const [groupedPOIs, setGroupedPOIs] = useState<GroupedPOI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSaved, setDataSaved] = useState(false);

  const location = useLocation();
  const { divisionIndex: totalDivisions, centers, searchRadius: initialSearchRadius, resultLimit: initialResultLimit } = location.state as LocationState;

  const [searchRadius, setSearchRadius] = useState<number>(initialSearchRadius);
  const [resultLimit, setResultLimit] = useState<number>(initialResultLimit);

  useEffect(() => {
    if (centers.length > 0) {
      searchNearbyPlaces();
    }
  }, [centers, searchRadius, resultLimit]);

  const searchNearbyPlaces = async () => {
    setLoading(true);
    setError(null);
    const groupedResults: GroupedPOI[] = [];
    try {
      const mapElement = document.createElement('div');
      const map = new google.maps.Map(mapElement);
      const service = new google.maps.places.PlacesService(map);
      const geocoder = new google.maps.Geocoder();

      for (const centerInfo of centers) {
        const poisInDivision = poiData.filter(poi => poi.divisionIndex === centerInfo.index);

        // Get the address of the center coordinate
        const centerAddress = await getCenterAddress(geocoder, centerInfo.center);

        const poisWithNearbyPlaces = await Promise.all(poisInDivision.map(async (poi) => {
          try {
            const [nearbyPlaces, hereNearbyPlaces] = await Promise.all([
              searchNearbyPlace(service, poi),
              searchHereNearbyPlace(poi)
            ]);
            return { poi, nearbyPlaces, hereNearbyPlaces };
          } catch (poiError) {
            console.error('Error searching for POI:', poi, poiError);
            return { poi, nearbyPlaces: [], hereNearbyPlaces: [] };
          }
        }));

        groupedResults.push({
          divisionIndex: centerInfo.index,
          center: centerInfo.center,
          centerAddress,
          pois: poisWithNearbyPlaces
        });
      }
      setGroupedPOIs(groupedResults);
    } catch (error: unknown) {
      console.error('Error in searchNearbyPlaces:', error);
      if (error instanceof Error) {
        setError(`Error searching nearby places: ${error.message}`);
      } else {
        setError('An unknown error occurred while searching nearby places');
      }
    } finally {
      setLoading(false);
    }
  };

  const searchHereNearbyPlace = async (poi: POI): Promise<HereNearbyPlace[]> => {
    try {
      const response = await axios.get(`https://browse.search.hereapi.com/v1/browse`, {
        params: {
          apiKey: 'YOUR_HERE_API_KEY',
          at: `${poi.lat},${poi.lng}`,
          limit: resultLimit,
          categories: '100',
          in: `circle:${poi.lat},${poi.lng};r=${searchRadius}`
        }
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items.map((item: any) => ({
          name: item.title,
          address: item.address.label,
          lat: item.position.lat,
          lng: item.position.lng
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching HERE nearby place:', error);
      return [];
    }
  };

  const getCenterAddress = (geocoder: google.maps.Geocoder, center: { lat: number; lng: number }): Promise<string> => {
    return new Promise((resolve, reject) => {
      const latlng = new google.maps.LatLng(center.lat, center.lng);
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          resolve(results[0].formatted_address);
        } else {
          reject(new Error(`Geocode failed for center. Status: ${status}`));
        }
      });
    });
  };

  const searchNearbyPlace = async (service: google.maps.places.PlacesService, poi: POI): Promise<NearbyPlace[]> => {
    try {
      const results: NearbyPlace[] = [];
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(poi.lat, poi.lng),
        radius: searchRadius,
        type: 'point_of_interest',
      };
  
      const fetchResults = async (request: google.maps.places.PlaceSearchRequest) => {
        return new Promise<void>((resolve, reject) => {
          service.nearbySearch(request, (response, status, pagination) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && response) {
              const nearbyPlaces = response.map(place => ({
                name: place.name || 'Unknown',
                formatted_address: place.vicinity || 'Unknown address',
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0
              }));
              results.push(...nearbyPlaces);
  
              // Check if there is another page of results
              if (pagination && pagination.hasNextPage && results.length < resultLimit) {
                pagination.nextPage(); // Fetch next page of results
              } else {
                resolve(); // Resolve promise when all pages are fetched or limit is reached
              }
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              resolve(); // No more results to fetch
            } else {
              reject(new Error(`Place search failed for POI: ${poi.name}. Status: ${status}`));
            }
          });
        });
      };
  
      // Fetch results until resultLimit is reached or no more pages available
      await fetchResults(request);
  
      return results.slice(0, resultLimit); // Ensure we limit to resultLimit
    } catch (error) {
      console.error('Error searching nearby place:', error);
      return [];
    }
  };
  
  

  const handleSaveData = async () => {
    try {
      const response = await axios.post('http://localhost:9000/api/save-nearby-places', { groupedPOIs });
      if (response.status === 200) {
        setDataSaved(true);
        alert('Data saved successfully!');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data. Please try again.');
    }
  };

  return (
    <div>
      <h1>Nearby Search</h1>
      <p>Total Divisions: {totalDivisions}</p>
      {loading && <p>Loading nearby places...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <>
          <h2>Grouped Nearby Places:</h2>
          <button onClick={handleSaveData} disabled={dataSaved}>
            {dataSaved ? 'Data Saved' : 'Save Data'}
          </button>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Sub-Region</th>
                <th style={tableHeaderStyle}>POI LAT-LNG Coordinates</th>
                <th style={tableHeaderStyle}>Google Places API Results</th>
                <th style={tableHeaderStyle}>HERE API Results</th>
              </tr>
            </thead>
            <tbody>
              {groupedPOIs.map((group) => (
                group.pois.map((poiData, poiIndex) => (
                  <React.Fragment key={`${group.divisionIndex}-${poiIndex}`}>
                    <tr>
                      {poiIndex === 0 && (
                        <td style={tableCellStyle} rowSpan={group.pois.length}>
                          {group.divisionIndex}
                        </td>
                      )}
                      <td style={tableCellStyle}>
                        ({poiData.poi.lat.toFixed(6)}, {poiData.poi.lng.toFixed(6)})
                      </td>
                      <td style={tableCellStyle}>
                        <table style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Address</th>
                              <th>Coordinates</th>
                            </tr>
                          </thead>
                          <tbody>
                            {poiData.nearbyPlaces.sort((a, b) => a.name.localeCompare(b.name)).map((place, placeIndex) => (
                              <tr key={`google-${placeIndex}`}>
                                <td>{place.name}</td>
                                <td>{place.formatted_address}</td>
                                <td>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</td>
                              </tr>
                            ))}
                            {poiData.nearbyPlaces.length === 0 && (
                              <tr>
                                <td colSpan={3}>No results found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </td>
                      <td style={tableCellStyle}>
                        <table style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Address</th>
                              <th>Coordinates</th>
                            </tr>
                          </thead>
                          <tbody>
                            {poiData.hereNearbyPlaces.sort((a, b) => a.name.localeCompare(b.name)).map((place, placeIndex) => (
                              <tr key={`here-${placeIndex}`}>
                                <td>{place.name}</td>
                                <td>{place.address}</td>
                                <td>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</td>
                              </tr>
                            ))}
                            {poiData.hereNearbyPlaces.length === 0 && (
                              <tr>
                                <td colSpan={3}>No results found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

const tableHeaderStyle = {
  border: '1px solid black',
  padding: '8px',
  backgroundColor: '#f2f2f2',
  fontWeight: 'bold',
};

const tableCellStyle = {
  border: '1px solid black',
  padding: '8px',
};

export default NearbySearchPage;
