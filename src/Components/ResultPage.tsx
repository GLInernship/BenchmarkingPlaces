import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

interface RanLatLons {
  name: string;
  lat: number;
  lng: number;
  subregion_id: number;
}

interface NearbyPlace {
  types: string[];
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

interface ResultPageProps { }

interface HereAddressSearchResult {
  name: string;
  lat: number;
  lng: number;
}

interface HereAddressSearchState {
  result: HereAddressSearchResult | null;
  loading: boolean;
  error: string | null;
}

interface GooglePlaceResult {
  name: string;
  lat: number;
  lng: number;
}

interface GoogleGeocodingState {
  result: GooglePlaceResult | null;
  loading: boolean;
  error: string | null;
}

const ResultPage: React.FC<ResultPageProps> = () => {
  const location = useLocation();
  const { groupedRLatLons, placeType } = location.state as { groupedRLatLons: GroupedRLatLon[], placeType: PlaceType };
  const [hereAddressResults, setHereAddressResults] = useState<{ [key: string]: HereAddressSearchState }>({});
  const [googleGeocodingResults, setGoogleGeocodingResults] = useState<{ [key: string]: GoogleGeocodingState }>({});

  useEffect(() => {
    const fetchResults = async () => {
      const hereResults: { [key: string]: HereAddressSearchState } = {};
      const googleResults: { [key: string]: GoogleGeocodingState } = {};
  
      for (const group of groupedRLatLons) {
        for (const ranLatLonsData of group.ranLatLonss) {
          // HERE API calls for Google Places results
          for (const place of ranLatLonsData.nearbyPlaces) {
            const searchKey = `${place.name}-${place.formatted_address}`;
            if (place.formatted_address && !hereResults[searchKey]) {
              hereResults[searchKey] = { result: null, loading: true, error: null };
              setHereAddressResults(prevState => ({ ...prevState, [searchKey]: hereResults[searchKey] }));
  
              try {
                const result = await searchHereAddress(place.name, place.formatted_address);
                hereResults[searchKey] = { result, loading: false, error: null };
              } catch (error) {
                const message = error instanceof Error ? error.message : 'An unknown error occurred';
                hereResults[searchKey] = { result: null, loading: false, error: message };
              }
              setHereAddressResults(prevState => ({ ...prevState, [searchKey]: hereResults[searchKey] }));
            }
          }
  
          // Google Geocoding API calls for HERE results
          for (const place of ranLatLonsData.hereNearbyPlaces) {
            const searchKey = `${place.name}-${place.address}`;
            if (place.address && !googleResults[searchKey]) {
              googleResults[searchKey] = { result: null, loading: true, error: null };
              setGoogleGeocodingResults(prevState => ({ ...prevState, [searchKey]: googleResults[searchKey] }));
  
              try {
                const result = await searchGooglePlace(place.name, place.address);
                googleResults[searchKey] = { result, loading: false, error: null };
              } catch (error) {
                const message = error instanceof Error ? error.message : 'An unknown error occurred';
                googleResults[searchKey] = { result: null, loading: false, error: message };
              }
              setGoogleGeocodingResults(prevState => ({ ...prevState, [searchKey]: googleResults[searchKey] }));
            }
          }
        }
      }
    };
  
    fetchResults();
  }, [groupedRLatLons]);

  const searchHereAddress = async (name: string, address: string): Promise<HereAddressSearchResult> => {
    const HERE_API_KEY = 'JPjlc6mdrVXLZ45JQr-55TyaSChZcQL6CuIvU50UJ7Q'; // Replace with your actual HERE API key
    const encodedAddress = encodeURIComponent(address);
    const encodedName = encodeURIComponent(name);
    const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodedName}+${encodedAddress}&apiKey=${HERE_API_KEY}`;

    try {
      const response = await axios.get(url);
      const result = response.data.items[0];
      if (!result) {
        throw new Error('No results found');
      }
      return {
        name: result.title,
        lat: result.position.lat,
        lng: result.position.lng
      };
    } catch (error) {
      console.error('Error fetching HERE address:', error);
      throw error;
    }
  };

  const searchGooglePlace = async (name: string, address: string): Promise<GooglePlaceResult> => {
    const GOOGLE_API_KEY = 'AIzaSyDoLzY6DBVoUPPMoCNewEnnp3inyXvCkNE'; // Replace with your actual Google API key
    const encodedQuery = encodeURIComponent(`${address}`);
    const url = `/maps/api/place/textsearch/json?query=${encodedQuery}&key=${GOOGLE_API_KEY}`;  
    try {
      const response = await axios.get(url);
      const result = response.data.results[0];
      if (!result) {
        throw new Error('No results found');
      }
      return {
        name: result.name, // This will be the specific place name
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      };
    } catch (error) {
      console.error('Error fetching Google place:', error);
      throw error;
    }
  };

  const tableHeaderStyle: React.CSSProperties = {
    border: '1px solid black',
    padding: '8px',
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  };

  const tableCellStyle: React.CSSProperties = {
    border: '1px solid black',
    padding: '8px',
  };

  return (
    <div>
      <h1>Search Results</h1>
      <p>Place Type: {placeType.label}</p>
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
                            <td colSpan={4}>No results found</td>
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
                          <th>Coordinates</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranLatLonsData.nearbyPlaces
                          .map(place => {
                            const searchKey = `${place.name}-${place.formatted_address}`;
                            return { ...place, hereResultState: hereAddressResults[searchKey] };
                          })
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((place, placeIndex) => (
                            <tr key={`here-google-${placeIndex}`}>
                              <td>{place.hereResultState?.result?.name || 'N/A'}</td>
                              <td>
                                {place.hereResultState?.result
                                  ? `(${place.hereResultState.result.lat.toFixed(6)}, ${place.hereResultState.result.lng.toFixed(6)})`
                                  : 'N/A'}
                              </td>
                              <td>
                                {place.hereResultState?.loading ? 'Loading...' :
                                  place.hereResultState?.error ? `Error: ${place.hereResultState.error}` :
                                    'Completed'}
                              </td>
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
                            <td colSpan={4}>No results found</td>
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
            <th>Coordinates</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {ranLatLonsData.hereNearbyPlaces
            .map(place => {
              const searchKey = `${place.name}-${place.address}`;
              return { ...place, googleResultState: googleGeocodingResults[searchKey] };
            })
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((place, placeIndex) => (
              <tr key={`google-here-${placeIndex}`}>
                <td>{place.googleResultState?.result?.name || 'N/A'}</td>
                <td>
                  {place.googleResultState?.result
                    ? `(${place.googleResultState.result.lat.toFixed(6)}, ${place.googleResultState.result.lng.toFixed(6)})`
                    : 'N/A'}
                </td>
                <td>
                  {place.googleResultState?.loading ? 'Loading...' :
                    place.googleResultState?.error ? `Error: ${place.googleResultState.error}` :
                      'Completed'}
                </td>
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
    </div>
  );
};

export default ResultPage;
