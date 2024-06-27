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
  matchesGoogle: (googleAddress: string, googleName: string) => boolean;
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

      await Promise.all(
        groupedRLatLons.flatMap((group) =>
          group.ranLatLonss.flatMap(async (ranLatLonsData) => {
            const hereResults: { [key: string]: HereAddressSearchState } = {};
            const googleResults: { [key: string]: GoogleGeocodingState } = {};

            // HERE API calls for Google Places results
            await Promise.all(
              ranLatLonsData.nearbyPlaces.map(async (place) => {
                const searchKey = `${place.name}-${place.formatted_address}`;
                if (place.formatted_address && !hereResults[searchKey]) {
                  hereResults[searchKey] = { result: null, loading: true, error: null };
                  setHereAddressResults((prevState) => ({ ...prevState, [searchKey]: hereResults[searchKey] }));

                  try {
                    const result = await searchHereAddress(place.name, place.formatted_address, place.lat, place.lng);
                    hereResults[searchKey] = { result, loading: false, error: null };
                  } catch (error) {
                    const message = error instanceof Error ? error.message : 'An unknown error occurred';
                    hereResults[searchKey] = { result: null, loading: false, error: message };
                  }
                  setHereAddressResults((prevState) => ({ ...prevState, [searchKey]: hereResults[searchKey] }));
                }
              })
            );

            // Google Geocoding API calls for HERE results
            await Promise.all(
              ranLatLonsData.hereNearbyPlaces.map(async (place) => {
                const searchKey = `${place.name}-${place.address}`;
                if (place.address && !googleResults[searchKey]) {
                  googleResults[searchKey] = { result: null, loading: true, error: null };
                  setGoogleGeocodingResults((prevState) => ({ ...prevState, [searchKey]: googleResults[searchKey] }));

                  try {
                    const result = await searchGooglePlace(place.name, place.address, place.lat, place.lng);
                    googleResults[searchKey] = { result, loading: false, error: null };
                  } catch (error) {
                    const message = error instanceof Error ? error.message : 'An unknown error occurred';
                    googleResults[searchKey] = { result: null, loading: false, error: message };
                  }
                  setGoogleGeocodingResults((prevState) => ({ ...prevState, [searchKey]: googleResults[searchKey] }));
                }
              })
            );
          })
        )
      );
    };

    fetchResults();
  }, [groupedRLatLons]);

  const searchHereAddress = async (name: string, address: string, lat: number, lng: number): Promise<HereAddressSearchResult> => {
    console.log('1. Entering searchHereAddress function');
    console.log('2. Input parameters:', { name, address, lat, lng });

    const HERE_API_KEY = 'JPjlc6mdrVXLZ45JQr-55TyaSChZcQL6CuIvU50UJ7Q';
    console.log('3. HERE API Key:', HERE_API_KEY);

    const encodedQuery = encodeURIComponent(`${name}, ${address}`);
    console.log('4. Encoded query:', encodedQuery);

    const url = `https://discover.search.hereapi.com/v1/discover?q=${encodedQuery}&at=${lat},${lng}&apiKey=${HERE_API_KEY}`;
    console.log('5. Request URL:', url);

    try {
      console.log('6. Sending request to HERE API');
      const response = await axios.get(url);
      console.log('7. Received response from HERE API');
      console.log('8. Response status:', response.status);
      console.log('9. Response data:', response.data);

      const result = response.data.items[0];
      console.log('10. First result item:', result);

      if (!result) {
        console.log('11. No results found');
        throw new Error('No results found');
      }

      console.log('12. Processing result data');
      const street = result.address?.street?.toLowerCase().replace(/[^\w\s]/g, ' ') || '';
      console.log('13. Processed street:', street);

      const houseNumber = result.address?.houseNumber?.toLowerCase().replace(/[^\w\s]/g, ' ') || '';
      console.log('14. Processed house number:', houseNumber);

      let title = result.title.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/ß/g, 'ss');
      console.log('15. Processed title:', title);

      const titleTokens = title.split(' ').filter((token: string | any[]) => token.length > 0);
      console.log('16. Title tokens:', titleTokens);

      const matchesGoogle = (formatted_address: string, googleName: string): boolean => {
        console.log('17. Checking if HERE result matches Google data');
        console.log('18. Google formatted address:', formatted_address);
        console.log('19. Google name:', googleName);

        const lowerGoogleAddress = formatted_address.toLowerCase();
        const lowerGoogleName = googleName.toLowerCase();

        const addressMatches = street && houseNumber &&
          lowerGoogleAddress.includes(street) &&
          lowerGoogleAddress.includes(houseNumber);
        console.log('20. Address matches:', addressMatches);

        const nameMatches = titleTokens.some((token: string) => lowerGoogleName.includes(token));
        console.log('21. Name matches:', nameMatches);

        const finalMatch = addressMatches && nameMatches;
        console.log('22. Final match result:', finalMatch);

        return finalMatch;
      };

      const result_obj = {
        name: result.title,
        lat: result.position.lat,
        lng: result.position.lng,
        matchesGoogle: matchesGoogle
      };
      console.log('23. Returning result object:', result_obj);

      return result_obj;
    } catch (error) {
      console.log('24. Error in searchHereAddress function');
      if (axios.isAxiosError(error) && error.response) {
        console.log('25. Axios error response:', error.response.status, error.response.data);
      } else {
        console.log('26. Non-Axios error:', error);
      }
      throw error;
    } finally {
      console.log('27. Exiting searchHereAddress function');
    }
  };

  const searchGooglePlace = async (name: string, address: string, lat: number, lng: number): Promise<GooglePlaceResult> => {
    const GOOGLE_API_KEY = 'AIzaSyDoLzY6DBVoUPPMoCNewEnnp3inyXvCkNE'; // Replace with your actual Google API key
    const encodedQuery = encodeURIComponent(`${address}`);
    const url = `/maps/api/place/textsearch/json?query=${encodedQuery}&location=${lat},${lng}&key=${GOOGLE_API_KEY}`;
    try {
      const response = await axios.get(url);
      const result = response.data.results[0];
      if (!result) {
        throw new Error('No results found');
      }
      return {
        name: result.name,
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
    border: '2px solid black',
    padding: '8px',
  };

  const innerTableHeaderStyle = {
    ...tableHeaderStyle,
    backgroundColor: '#f0f0f0',
    padding: '8px',
    borderBottom: '1px solid #ddd',
  };

  const innerTableCellStyle = {
    ...tableCellStyle,
    padding: '8px',
    borderBottom: '1px solid #ddd',
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
            <th style={tableHeaderStyle}>HERE API Results Based on Google Results(Based on Name, Address and Coords)</th>
            <th style={tableHeaderStyle}>HERE API Results</th>
            <th style={tableHeaderStyle}>Google API Results Based on HERE Results(Based on Address and Coords)</th>
          </tr>
        </thead>
        <tbody>
          {groupedRLatLons.map((group) => (
            group.ranLatLonss.map((ranLatLonsData, ranLatLonsIndex) => (
              <tr key={`${group.subregion_id}-${ranLatLonsIndex}`}>
                {ranLatLonsIndex === 0 && (
                  <td style={tableCellStyle} rowSpan={group.ranLatLonss.length}>
                    {group.subregion_id}
                  </td>
                )}
                <td style={tableCellStyle}>
                  ({ranLatLonsData.ranLatLons.lat.toFixed(6)}, {ranLatLonsData.ranLatLons.lng.toFixed(6)})
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
                      {ranLatLonsData.nearbyPlaces.length > 0 ? (
                        ranLatLonsData.nearbyPlaces.sort((a, b) => a.name.localeCompare(b.name)).map((place, placeIndex) => (
                          <tr key={`google-${placeIndex}`}>
                            <td style={innerTableCellStyle}>{place.name}</td>
                            <td style={innerTableCellStyle}>{place.types ? place.types[0] : 'N/A'}</td>
                            <td style={innerTableCellStyle}>{place.formatted_address}</td>
                            <td style={innerTableCellStyle}>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} style={innerTableCellStyle}>No API key found or error in API or No results found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </td>
                <td style={tableCellStyle}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={innerTableHeaderStyle}>Name</th>
                        <th style={innerTableHeaderStyle}>Coordinates</th>
                        <th style={innerTableHeaderStyle}>Status</th>
                        <th style={innerTableHeaderStyle}>Matches Google</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranLatLonsData.nearbyPlaces.length > 0 ? (
                        ranLatLonsData.nearbyPlaces
                          .map(place => {
                            const searchKey = `${place.name}-${place.formatted_address}`;
                            return { ...place, hereResultState: hereAddressResults[searchKey] };
                          })
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((place, placeIndex) => (
                            <tr key={`here-google-${placeIndex}`}>
                              <td style={innerTableCellStyle}>{place.hereResultState?.result?.name || 'N/A'}</td>
                              <td style={innerTableCellStyle}>
                                {place.hereResultState?.result
                                  ? `(${place.hereResultState.result.lat.toFixed(6)}, ${place.hereResultState.result.lng.toFixed(6)})`
                                  : 'N/A'}
                              </td>
                              <td style={innerTableCellStyle}>
                                {place.hereResultState?.loading ? 'Loading...' :
                                  place.hereResultState?.error ? `Error: ${place.hereResultState.error}` :
                                    'Completed'}
                              </td>
                              <td style={innerTableCellStyle}>
                                {place.hereResultState?.result?.matchesGoogle &&
                                  place.hereResultState.result.matchesGoogle(place.formatted_address, place.name)
                                  ? 'Data matches with Google'
                                  : 'Data doesn\'t match with Google'}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={4} style={innerTableCellStyle}>No results found</td>
                        </tr>
                      )}
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
                      {ranLatLonsData.hereNearbyPlaces.length > 0 ? (
                        ranLatLonsData.hereNearbyPlaces.sort((a, b) => a.name.localeCompare(b.name)).map((place, placeIndex) => (
                          <tr key={`here-${placeIndex}`}>
                            <td style={innerTableCellStyle}>{place.name}</td>
                            <td style={innerTableCellStyle}>{place.categoryType || 'N/A'}</td>
                            <td style={innerTableCellStyle}>{place.address}</td>
                            <td style={innerTableCellStyle}>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} style={innerTableCellStyle}>No API key found or error in API or No results found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </td>
                <td style={tableCellStyle}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={innerTableHeaderStyle}>Name</th>
                        <th style={innerTableHeaderStyle}>Coordinates</th>
                        <th style={innerTableHeaderStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranLatLonsData.hereNearbyPlaces.length > 0 ? (
                        ranLatLonsData.hereNearbyPlaces
                          .map(place => {
                            const searchKey = `${place.name}-${place.address}`;
                            return { ...place, googleResultState: googleGeocodingResults[searchKey] };
                          })
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((place, placeIndex) => (
                            <tr key={`google-here-${placeIndex}`}>
                              <td style={innerTableCellStyle}>{place.googleResultState?.result?.name || 'N/A'}</td>
                              <td style={innerTableCellStyle}>
                                {place.googleResultState?.result
                                  ? `(${place.googleResultState.result.lat.toFixed(6)}, ${place.googleResultState.result.lng.toFixed(6)})`
                                  : 'N/A'}
                              </td>
                              <td style={innerTableCellStyle}>
                                {place.googleResultState?.loading ? 'Loading...' :
                                  place.googleResultState?.error ? `Error: ${place.googleResultState.error}` :
                                    'Completed'}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={3} style={innerTableCellStyle}>No API key found or error in API or No results found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </td>
              </tr>
            ))
          ))}
        </tbody>
      </table>
    </div>
  );
};



export default ResultPage;
