import React, { useState, useEffect } from 'react';
import { useGridContext } from './GridContext';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

interface RanLatLons {
  name: string;
  lat: number;
  lng: number;
  subregion_id: number;
}

interface NearbyPlace {
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
}

interface HereNearbyPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface GroupedRLatLon {
  subregion_id: number;
  center: { lat: number; lng: number };
  centerAddress: string;
  ranLatLonss: {
    ranLatLons: RanLatLons;
    nearbyPlaces: NearbyPlace[];
    hereNearbyPlaces: HereNearbyPlace[];
  }[];
}

interface PlaceType {
  label: string;
  googleValue: string;
  hereValue: string;
}

interface LocationState {
  subregion_id: number;
  centers: { index: number; center: { lat: number; lng: number } }[];
  searchRadius: number;
  resultLimit: number;
  placeType: PlaceType;
}

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

const NearbySearchPage: React.FC = () => {
  const { divisionData, poiData } = useGridContext();
  const [groupedRLatLons, setGroupedRLatLons] = useState<GroupedRLatLon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSaved, setDataSaved] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<NearbyPlace[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [hereCheckResults, setHereCheckResults] = useState<Array<{ name: string, address: string, lat: number, lng: number, result: { lat: number, lng: number, name: string, address: string } }>>([]);
  const [showHereCheck, setShowHereCheck] = useState(false);

  const location = useLocation();
  const {
    subregion_id: totalDivisions,
    centers,
    searchRadius: initialSearchRadius,
    resultLimit: initialResultLimit,
    placeType
  } = location.state as LocationState;

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
    const groupedResults: GroupedRLatLon[] = [];
    try {
      const mapElement = document.createElement('div');
      const map = new google.maps.Map(mapElement);
      const service = new google.maps.places.PlacesService(map);
      const geocoder = new google.maps.Geocoder();

      for (const centerInfo of centers) {
        const ranLatLonssInDivision = poiData.filter(poi => poi.subregion_id === centerInfo.index);

        const centerAddress = await getCenterAddress(geocoder, centerInfo.center);

        const ranLatLonssWithNearbyPlaces = await Promise.all(ranLatLonssInDivision.map(async (ranLatLons) => {
          try {
            const [nearbyPlaces, hereNearbyPlaces] = await Promise.all([
              searchNearbyPlace(service, ranLatLons),
              searchHereNearbyPlace(ranLatLons)
            ]);
            return { ranLatLons, nearbyPlaces, hereNearbyPlaces };
          } catch (ranLatLonsError) {
            console.error('Error searching for ranLatLons:', ranLatLons, ranLatLonsError);
            return { ranLatLons, nearbyPlaces: [], hereNearbyPlaces: [] };
          }
        }));

        groupedResults.push({
          subregion_id: centerInfo.index,
          center: centerInfo.center,
          centerAddress,
          ranLatLonss: ranLatLonssWithNearbyPlaces
        });
      }
      setGroupedRLatLons(groupedResults);
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

  const searchHereNearbyPlace = async (poi: RanLatLons): Promise<HereNearbyPlace[]> => {
    try {
      const params: any = {
        apiKey: 'xiNMKXgiyxQg3pzl4vOxd167y8kJEoZ_86SOR1pppSc',
        at: `${poi.lat},${poi.lng}`,
        limit: resultLimit,
        in: `circle:${poi.lat},${poi.lng};r=${searchRadius}`
      };

      if (placeType.hereValue !== "") {
        params.categories = placeType.hereValue;
      }

      const response = await axios.get('https://browse.search.hereapi.com/v1/browse', {
        params: params
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

      if (axios.isAxiosError(error)) {
        console.error('AxiosError Details:', error.toJSON());
      }

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

  const searchNearbyPlace = async (service: google.maps.places.PlacesService, poi: RanLatLons): Promise<NearbyPlace[]> => {
    try {
      const results: NearbyPlace[] = [];
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(poi.lat, poi.lng),
        radius: searchRadius,
        type: placeType.googleValue as string,
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

              if (pagination && pagination.hasNextPage && results.length < resultLimit) {
                pagination.nextPage();
              } else {
                resolve();
              }
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              resolve();
            } else {
              reject(new Error(`Place search failed for POI: ${poi.name}. Status: ${status}`));
            }
          });
        });
      };

      await fetchResults(request);

      return results.slice(0, resultLimit);
    } catch (error) {
      console.error('Error searching nearby place:', error);
      return [];
    }
  };

  const handleSaveData = async () => {
    try {
      const response = await axios.post('https://j5s9dm7w-9000.inc1.devtunnels.ms/api/save-nearby-places', {
        groupedRLatLons,
        placeType: {
          label: placeType.label,
          googleValue: placeType.googleValue,
          hereValue: placeType.hereValue
        }
      });
      if (response.status === 200) {
        setDataSaved(true);
        alert('Data saved successfully!');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data. Please try again.');
    }
  };

  const compareGoogleWithHere = () => {
    const missedLocations: NearbyPlace[] = [];

    groupedRLatLons.forEach(group => {
      group.ranLatLonss.forEach(ranLatLonsData => {
        ranLatLonsData.nearbyPlaces.forEach(googlePlace => {
          const matchingHerePlace = ranLatLonsData.hereNearbyPlaces.find(
            herePlace =>
              herePlace.name.toLowerCase() === googlePlace.name.toLowerCase() &&
              Math.abs(herePlace.lat - googlePlace.lat) < 0.0001 &&
              Math.abs(herePlace.lng - googlePlace.lng) < 0.0001
          );

          if (!matchingHerePlace) {
            missedLocations.push(googlePlace);
          }
        });
      });
    });

    setComparisonResults(missedLocations);
    setShowComparison(true);
  };

  const checkMissedLocationsInHere = async () => {
    setLoading(true);
    const results = await Promise.all(comparisonResults.map(async (place) => {
      const result = await searchInHereData(place);
      return {
        name: place.name,
        address: place.formatted_address,
        lat: place.lat,
        lng: place.lng,
        result: result
      };
    }));
    setHereCheckResults(results);
    setShowHereCheck(true);
    setLoading(false);
  };

  const searchInHereData = async (place: NearbyPlace): Promise<{ lat: number, lng: number, name: string, address: string }> => {
    try {
      const params = {
        apiKey: 'xiNMKXgiyxQg3pzl4vOxd167y8kJEoZ_86SOR1pppSc',
        q: `${place.name} ${place.formatted_address}`,
        limit: 5
      };

      const response = await axios.get('https://geocode.search.hereapi.com/v1/geocode', { params });

      if (response.data.items && response.data.items.length > 0) {
        const bestMatch = findBestMatch(place, response.data.items);
        if (bestMatch) {
          return {
            lat: bestMatch.position.lat,
            lng: bestMatch.position.lng,
            name: bestMatch.title,
            address: bestMatch.address.label
          };
        }
      }

      // If no match found, perform reverse geocoding
      return await reverseGeocode(place.lat, place.lng);
    } catch (error) {
      console.error('Error searching in HERE data:', error);
      // If an error occurs, still perform reverse geocoding
      return await reverseGeocode(place.lat, place.lng);
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<{ lat: number, lng: number, name: string, address: string }> => {
    try {
      const params = {
        apiKey: 'xiNMKXgiyxQg3pzl4vOxd167y8kJEoZ_86SOR1pppSc',
        at: `${lat},${lng}`
      };

      const response = await axios.get('https://revgeocode.search.hereapi.com/v1/revgeocode', { params });

      if (response.data.items && response.data.items.length > 0) {
        const item = response.data.items[0];
        return {
          lat: lat,
          lng: lng,
          name: item.title || 'Unknown',
          address: item.address.label || 'Unknown address'
        };
      } else {
        return {
          lat: lat,
          lng: lng,
          name: 'Unknown',
          address: 'No address found'
        };
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      return {
        lat: lat,
        lng: lng,
        name: 'Error in reverse geocoding',
        address: 'Unable to fetch address'
      };
    }
  };

  const findBestMatch = (googlePlace: NearbyPlace, hereItems: any[]): any | null => {
    const threshold = 0.2; // 70% similarity threshold
    let bestMatch = null;
    let highestScore = 0;

    for (const item of hereItems) {
      const score = calculateSimilarityScore(googlePlace, item);
      if (score > highestScore && score >= threshold) {
        highestScore = score;
        bestMatch = item;
      }
    }

    return bestMatch;
  };

  const calculateSimilarityScore = (googlePlace: NearbyPlace, hereItem: any): number => {
    const nameScore = compareName(googlePlace.name, hereItem.title);
    const addressScore = compareAddress(googlePlace.formatted_address, hereItem.address.label);
    const coordinateScore = compareCoordinates(googlePlace, hereItem.position);

    // Weighted average of scores
    return (nameScore * 0.4 + addressScore * 0.4 + coordinateScore * 0.2);
  };

  const compareName = (name1: string, name2: string): number => {
    const tokens1 = name1.toLowerCase().split(/\s+/);
    const tokens2 = name2.toLowerCase().split(/\s+/);
    const commonTokens = tokens1.filter(token => tokens2.includes(token));
    return commonTokens.length / Math.max(tokens1.length, tokens2.length);
  };

  const compareAddress = (address1: string, address2: string): number => {
    const tokens1 = address1.toLowerCase().split(/\s+/);
    const tokens2 = address2.toLowerCase().split(/\s+/);
    const commonTokens = tokens1.filter(token => tokens2.includes(token));
    return commonTokens.length / Math.max(tokens1.length, tokens2.length);
  };

  const compareCoordinates = (place1: { lat: number, lng: number }, place2: { lat: number, lng: number }): number => {
    const latDiff = Math.abs(place1.lat - place2.lat);
    const lngDiff = Math.abs(place1.lng - place2.lng);
    const maxDiff = 0.01; // Approximately 1km
    return 1 - Math.min(1, (latDiff + lngDiff) / maxDiff);
  };

  return (
    <div>
      <h1>Nearby Search</h1>
      <p>Total Divisions: {totalDivisions}</p>
      <p>Place Type: {placeType.label}</p>
      {loading && <p>Loading nearby places...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <>
          <h2>Grouped Nearby Places:</h2>
          <button onClick={handleSaveData} disabled={dataSaved}>
            {dataSaved ? 'Data Saved' : 'Save Data'}
          </button>
          <button onClick={compareGoogleWithHere} style={{ marginLeft: '10px' }}>
            Compare Google with HERE
          </button>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Sub-Region</th>
                <th style={tableHeaderStyle}>LAT-LNG Coordinates</th>
                <th style={tableHeaderStyle}>Google Places API Results</th>
                <th style={tableHeaderStyle}>HERE API Results</th>
              </tr>
            </thead>
            <tbody>
              {groupedRLatLons.map((group) => (
                group.ranLatLonss.map((ranLatLonsData, ranLatLonsIndex) => (
                  <React.Fragment key={`${group.subregion_id}-${ranLatLonsIndex}`}>
                    <tr>
                      {ranLatLonsIndex === 0 && (
                        <td style={tableCellStyle} rowSpan={group.ranLatLonss.length}>
                          {group.subregion_id}
                        </td>
                      )}
                      <td style={tableCellStyle}>
                        ({ranLatLonsData.ranLatLons.lat.toFixed(6)}, {ranLatLonsData.ranLatLons.lng.toFixed(6)})
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
                            {ranLatLonsData.nearbyPlaces.sort((a, b) => a.name.localeCompare(b.name)).map((place, placeIndex) => (
                              <tr key={`google-${placeIndex}`}>
                                <td>{place.name}</td>
                                <td>{place.formatted_address}</td>
                                <td>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</td>
                              </tr>
                            ))}
                            {ranLatLonsData.nearbyPlaces.length === 0 && (
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
                            {ranLatLonsData.hereNearbyPlaces.sort((a, b) => a.name.localeCompare(b.name)).map((place, placeIndex) => (
                              <tr key={`here-${placeIndex}`}>
                                <td>{place.name}</td>
                                <td>{place.address}</td>
                                <td>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</td>
                              </tr>
                            ))}
                            {ranLatLonsData.hereNearbyPlaces.length === 0 && (
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

          {showComparison && (
            <>
              <h2>Locations found by Google Maps but missed by HERE Maps:</h2>
              <button onClick={checkMissedLocationsInHere} style={{ marginBottom: '10px' }}>
                Check Missed Locations in HERE Data
              </button>
              <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '20px' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>Address</th>
                    <th style={tableHeaderStyle}>Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonResults.map((place, index) => (
                    <tr key={`comparison-${index}`}>
                      <td style={tableCellStyle}>{place.name}</td>
                      <td style={tableCellStyle}>{place.formatted_address}</td>
                      <td style={tableCellStyle}>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</td>
                    </tr>
                  ))}
                  {comparisonResults.length === 0 && (
                    <tr>
                      <td colSpan={3} style={tableCellStyle}>No missed locations found</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {showHereCheck && (
                <>
                  <h3>HERE Data Check Results:</h3>
                  <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '20px' }}>
                    <thead>
                      <tr>
                        <th style={tableHeaderStyle}>Google Name</th>
                        <th style={tableHeaderStyle}>Google Address</th>
                        <th style={tableHeaderStyle}>Google Coordinates</th>
                        <th style={tableHeaderStyle}>HERE Data Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hereCheckResults.map((result, index) => (
                        <tr key={`here-check-${index}`}>
                          <td style={tableCellStyle}>{result.name}</td>
                          <td style={tableCellStyle}>{result.address}</td>
                          <td style={tableCellStyle}>({result.lat.toFixed(6)}, {result.lng.toFixed(6)})</td>
                          <td style={tableCellStyle}>
                            Name: {result.result.name}<br />
                            Address: {result.result.address}<br />
                            Lat: {result.result.lat.toFixed(6)}, Lng: {result.result.lng.toFixed(6)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default NearbySearchPage;