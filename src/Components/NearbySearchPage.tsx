import React, { useState, useEffect } from 'react';
import { useGridContext } from './GridContext';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface RanLatLons {
  name: string;
  lat: number;
  lng: number;
  subregion_id: number;
}

interface NearbyPlace {
  types: any;
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
}

interface HereNearbyPlace {
  categoryType: string;
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

const NearbySearchPage: React.FC = () => {
  const { divisionData, poiData } = useGridContext();
  const [groupedRLatLons, setGroupedRLatLons] = useState<GroupedRLatLon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSaved, setDataSaved] = useState(false);

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

  const navigate = useNavigate();

  const handleNextPage = () => {
    navigate('/result-page', { state: { groupedRLatLons, placeType } });
  };


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
        apiKey: '',
        at: `${poi.lat},${poi.lng}`,
        limit: resultLimit,
        in: `circle:${poi.lat},${poi.lng};r=${searchRadius}`
      };

      if (placeType.hereValue !== "") {
        params.categories = placeType.hereValue;
      }

      const response = await axios.get(`https://browse.search.hereapi.com/v1/browse`, {
        params: params
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items.map((item: any) => ({
          name: item.title,
          address: item.address.label,
          lat: item.position.lat,
          lng: item.position.lng,
          categoryType: item.categories ? item.categories[0].name : 'N/A' // Add this line
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
                lng: place.geometry?.location?.lng() || 0,
                types: place.types // Add this line
              }));
              results.push(...nearbyPlaces);

              console.log('Google Response-',response);

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
          <button onClick={handleNextPage}>
            Compare Data Between HERE and GOOGLE
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
                    <th>Type</th>
                    <th>Address</th>
                    <th>Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {ranLatLonsData.nearbyPlaces.sort((a, b) => a.name.localeCompare(b.name)).map((place, placeIndex) => (
                    <tr key={`google-${placeIndex}`}>
                      <td>{place.name}</td>
                      <td>{place.types ? place.types[0] : 'N/A'}</td>
                      <td>{place.formatted_address}</td>
                      <td>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</td>
                    </tr>
                  ))}
                  {ranLatLonsData.nearbyPlaces.length === 0 && (
                    <tr>
                      <td colSpan={4}>No API key found or error in API or No results found</td>
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
                    <th>Type</th>
                    <th>Address</th>
                    <th>Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {ranLatLonsData.hereNearbyPlaces.sort((a, b) => a.name.localeCompare(b.name)).map((place, placeIndex) => (
                    <tr key={`here-${placeIndex}`}>
                      <td>{place.name}</td>
                      <td>{place.categoryType || 'N/A'}</td>
                      <td>{place.address}</td>
                      <td>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</td>
                    </tr>
                  ))}
                  {ranLatLonsData.hereNearbyPlaces.length === 0 && (
                    <tr>
                      <td colSpan={4}>No API key found or error in API or No results found</td>
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
