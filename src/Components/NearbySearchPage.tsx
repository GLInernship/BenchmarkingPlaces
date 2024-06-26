import React, { useState, useEffect } from 'react';
import { useGridContext } from './GridContext';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import styled from 'styled-components';
import { PROD_API_URL } from '../constants';

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
  placeName: string; // Add this line
}

const NearbySearchPage: React.FC = () => {
  const { divisionData, poiData } = useGridContext();
  const [groupedRLatLons, setGroupedRLatLons] = useState<GroupedRLatLon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSaved, setDataSaved] = useState(false);
  const [searchCache, setSearchCache] = useState<Map<string, any>>(new Map());

  const location = useLocation();
  const {
    subregion_id: totalDivisions,
    centers,
    searchRadius: initialSearchRadius,
    resultLimit: initialResultLimit,
    placeType,
    placeName // Add this line
  } = location.state as LocationState;

  const [searchRadius, setSearchRadius] = useState<number>(initialSearchRadius);
  const [resultLimit, setResultLimit] = useState<number>(initialResultLimit);

  const navigate = useNavigate();

  const handleNextPage = () => {
    navigate('/result-page', { state: { groupedRLatLons, placeType, placeName } });
  };


  useEffect(() => {
    if (centers.length > 0) {
      searchNearbyPlaces();
    }
  }, [centers, searchRadius, resultLimit]);

  const removeDuplicatesFromTable = (places: (NearbyPlace | HereNearbyPlace)[]) => {
    const uniquePlaces = new Map();
    places.forEach(place => {
      const key = `${place.name}|${place.lat}|${place.lng}`;
      if (!uniquePlaces.has(key)) {
        uniquePlaces.set(key, place);
      }
    });
    return Array.from(uniquePlaces.values());
  };

  const searchNearbyPlaces = async () => {
    setLoading(true);
    setError(null);
    const groupedResults: GroupedRLatLon[] = [];
    const allUniqueResults = new Set<string>();

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

            // Filter out duplicates across all tables
            const uniqueNearbyPlaces = nearbyPlaces.filter(place => {
              const key = `${place.name}|${place.lat}|${place.lng}`;
              if (!allUniqueResults.has(key)) {
                allUniqueResults.add(key);
                return true;
              }
              return false;
            });

            const uniqueHereNearbyPlaces = hereNearbyPlaces.filter(place => {
              const key = `${place.name}|${place.lat}|${place.lng}`;
              if (!allUniqueResults.has(key)) {
                allUniqueResults.add(key);
                return true;
              }
              return false;
            });

            return {
              ranLatLons,
              nearbyPlaces: uniqueNearbyPlaces,
              hereNearbyPlaces: uniqueHereNearbyPlaces
            };
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

              console.log('Google Response-', response);

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
      const response = await axios.post(`${PROD_API_URL}/api/save-nearby-places`, { 
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
    <Container>
      <Header isMapPage={true} />
      <h1>Nearby Search</h1>
      <p>Total Divisions: {totalDivisions}</p>
      <p>Place Type: {placeType.label}</p>
      <p>Place Name: {placeName}</p>
      {loading && <p>Loading nearby places...</p>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!loading && !error && (
        <>
          <h2>Grouped Nearby Places:</h2>
          <Button onClick={handleSaveData} disabled={dataSaved}>
            {dataSaved ? 'Data Saved' : 'Save Data'}
          </Button>
          <Button onClick={handleNextPage}>
            Compare Data Between HERE and GOOGLE
          </Button>
          <Table>
            <thead>
              <tr>
                <TableHeader>Sub-Region</TableHeader>
                <TableHeader>LAT-LNG Coordinates</TableHeader>
                <TableHeader>Google Places API Results</TableHeader>
                {/* <TableHeader>HERE API Results</TableHeader> */}
              </tr>
            </thead>
            <tbody>
              {groupedRLatLons.map((group) =>
                group.ranLatLonss.map((ranLatLonsData, ranLatLonsIndex) => (
                  <React.Fragment key={`${group.subregion_id}-${ranLatLonsIndex}`}>
                    <TableRow>
                      {ranLatLonsIndex === 0 && (
                        <TableCell rowSpan={group.ranLatLonss.length}>
                          {group.subregion_id}
                        </TableCell>
                      )}
                      <TableCell>
                        ({ranLatLonsData.ranLatLons.lat.toFixed(6)}, {ranLatLonsData.ranLatLons.lng.toFixed(6)})
                      </TableCell>
                      <TableCell>
                        <SubTable>
                          <thead>
                            <tr>
                              <SubTableHeader>Name</SubTableHeader>
                              <SubTableHeader>Type</SubTableHeader>
                              <SubTableHeader>Address</SubTableHeader>
                              <SubTableHeader>Coordinates</SubTableHeader>
                            </tr>
                          </thead>
                          <tbody>
                            {ranLatLonsData.nearbyPlaces.sort((a, b) => a.name.localeCompare(b.name)).map((place, placeIndex) => (
                              <tr key={`google-${placeIndex}`}>
                                <SubTableCell>{place.name}</SubTableCell>
                                <SubTableCell>{place.types ? place.types[0] : 'N/A'}</SubTableCell>
                                <SubTableCell>{place.formatted_address}</SubTableCell>
                                <SubTableCell>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</SubTableCell>
                              </tr>
                            ))}
                            {ranLatLonsData.nearbyPlaces.length === 0 && (
                              <tr>
                                <SubTableCell colSpan={4}>No API key found or error in API or No results found</SubTableCell>
                              </tr>
                            )}
                          </tbody>
                        </SubTable>
                      </TableCell>
                      {/* <TableCell>
                        <SubTable>
                          <thead>
                            <tr>
                              <SubTableHeader>Name</SubTableHeader>
                              <SubTableHeader>Type</SubTableHeader>
                              <SubTableHeader>Address</SubTableHeader>
                              <SubTableHeader>Coordinates</SubTableHeader>
                            </tr>
                          </thead>
                          <tbody>
                            {ranLatLonsData.hereNearbyPlaces.sort((a, b) => a.name.localeCompare(b.name)).map((place, placeIndex) => (
                              <tr key={`here-${placeIndex}`}>
                                <SubTableCell>{place.name}</SubTableCell>
                                <SubTableCell>{place.categoryType || 'N/A'}</SubTableCell>
                                <SubTableCell>{place.address}</SubTableCell>
                                <SubTableCell>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</SubTableCell>
                              </tr>
                            ))}
                            {ranLatLonsData.hereNearbyPlaces.length === 0 && (
                              <tr>
                                <SubTableCell colSpan={4}>No API key found or error in API or No results found</SubTableCell>
                              </tr>
                            )}
                          </tbody>
                        </SubTable> 
                      </TableCell> */}
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </Table>
        </>
      )}
    </Container>
  );

};

const Container = styled.div`
  padding: 0px;
  zoom: 0.8;
`;

const ErrorMessage = styled.p`
  color: red;
`;
const Button = styled.button`
  margin-top: 20px;
  width: 10%;
  padding: 0.5rem;
  font-size: 10px;
  background: linear-gradient(to bottom, #A8DEC6 12%, #E0E1A7 100%);
  background-color: ${props => props.disabled ? '#cccccc' : '#4CAF50'};
  color: Black;
  margin-right: 5px;
  margin-bottom: 5px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  outline: 0.5px solid #949292;
  border-radius: 20px;
  border: none;
  box-shadow: 10px 10px 10px rgba(3,3,3,0);
`;

const Table = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

const TableHeader = styled.th`
  border: 5px solid black;
  padding: 8px;
  background-color: #f2f2f2;
  font-weight: bold;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f9f9f9;
  }
`;

const TableCell = styled.td`
  border: 5px solid black;
  padding: 8px;
  vertical-align: top;
`;

const SubTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const SubTableHeader = styled.th`
  border: 5px solid #ddd;
  padding: 4px;
  background-color: #e6e6e6;
  font-weight: bold;
`;

const SubTableCell = styled.td`
  border: 5px solid #ddd;
  padding: 4px;
`;


export default NearbySearchPage;

