import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';

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
  neededStreetSimilary: boolean;
  neededDistanceMatch: boolean;
  updateNeededDistanceMatch: () => boolean;
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
const { groupedRLatLons, placeType, placeName } = location.state as { groupedRLatLons: GroupedRLatLon[], placeType: PlaceType, placeName: string };
  const [hereAddressResults, setHereAddressResults] = useState<{ [key: string]: HereAddressSearchState }>({});
  const [googleGeocodingResults, setGoogleGeocodingResults] = useState<{ [key: string]: GoogleGeocodingState }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [matchingData, setMatchingData] = useState<{ matches: number, nonMatches: number }>({ matches: 0, nonMatches: 0 });

  const navigate = useNavigate();

  function checkForDistanceThreshold(lat1: number, lon1: number, lat2: number, lon2: number): boolean {
    const distanceThreshold = .200;
    return calculateDistance(lat1, lon1, lat2, lon2) <= distanceThreshold;
  }

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  const navigateToVisualization = () => {
    navigate('/visualization', { state: { matchingData } });
  };

  useEffect(() => {
    const fetchResults = async () => {
      const hereResults: { [key: string]: HereAddressSearchState } = {};
      const googleResults: { [key: string]: GoogleGeocodingState } = {};
      let matches = 0;
      let nonMatches = 0;
      for (const group of groupedRLatLons) {
        for (const ranLatLonsData of group.ranLatLonss) {
          // HERE API calls for Google Places results
          for (const place of ranLatLonsData.nearbyPlaces) {
            const searchKey = `${place.name}-${place.formatted_address}`;
            if (place.formatted_address && !hereResults[searchKey]) {
              hereResults[searchKey] = { result: null, loading: true, error: null };
              setHereAddressResults(prevState => ({ ...prevState, [searchKey]: hereResults[searchKey] }));

              try {
                const result = await searchHereAddress(place.name, place.formatted_address, place.lat, place.lng);
                hereResults[searchKey] = { result, loading: false, error: null };
                // Count matches and non-matches
                if (result.matchesGoogle(place.formatted_address, place.name)) {
                  matches++;
                } else {
                  nonMatches++;
                }

              } catch (error) {
                const message = error instanceof Error ? error.message : 'An unknown error occurred';
                hereResults[searchKey] = { result: null, loading: false, error: message };
                nonMatches++; // Consider errors as non-matches
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
                const result = await searchGooglePlace(place.name, place.address, place.lat, place.lng);
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
      setMatchingData({ matches, nonMatches });
    };

    fetchResults();
  }, [groupedRLatLons]);

  const searchHereAddress = async (name: string, address: string, lat: number, lng: number): Promise<HereAddressSearchResult> => {
   // const HERE_API_KEY = 'L5lmAVOde08LJbnbqu3V4-ypjHx3BfDMkkj9JdNbqg4'; // aashi's key
     const HERE_API_KEY = 'TIGOyh7aNyvOOOhmCm60Yrf7iaFL6lEESPtNYPXCINc'; // insha's key
    const encodedQuery = encodeURIComponent(`${name}, ${address}`);
    const url = `https://discover.search.hereapi.com/v1/discover?q=${encodedQuery}&at=${lat},${lng}&apiKey=${HERE_API_KEY}`;

    try {
      const response = await axios.get(url);
      const result = response.data.items[0];
      if (!result) {
        throw new Error('No results found');
      }

      const street = result.address?.street?.toLowerCase();
      const houseNumber = result.address?.houseNumber?.toLowerCase().replace(/[^\w\s]/g, ' ') || '';
      let title = result.title.toLowerCase().replace(/\u00DF/g, 'ss').replace(/[.,-;:"&()]/g, ' ').replace(/[']/g, '');
      const titleTokens = title.split(' ').filter((token: string | any[]) => token.length > 0);

      let neededNameSimilarity = false;
      let neededStreetSimilary = false;
      let neededDistanceMatch = false;

      const matchesGoogle = (formatted_address: string, name: string): boolean => {
        const lowerGoogleAddress = formatted_address.toLowerCase();
        const lowerGoogleName = name.toLowerCase().replace(/[.,-;:"&()]/g, ' ').replace(/[']/g, '');
        
        let nameMatches = false;
        let addressMatches = false;
        let streetMatches = false;
        let distanceMatches = false;

         let nameMatchCount = 0;

         titleTokens.forEach((token: string) => {
           if (lowerGoogleName.includes(token)) {  
             nameMatchCount++;
           }
         }
         );
 
         // Set the allowed number of name token mismatches based on the word count of the (Here) name
         let nameMismatchThreshold = 0;

         if (titleTokens.length > 8) {
           nameMismatchThreshold = Math.floor(titleTokens.length / 3);
         }
         else if (titleTokens.length > 5) {
           nameMismatchThreshold = 2;
         }
         else if (titleTokens.length > 2) {
           nameMismatchThreshold = 1;
         }
         
        nameMatches = (titleTokens.length - nameMatchCount) <= nameMismatchThreshold;
        // If not an exact match, log it as a similarity match
        neededNameSimilarity = !(titleTokens.length == nameMatchCount);

        // If we get a name match, proceed with other checks. Else discard this result
        if (nameMatches)
        {
          streetMatches = street && lowerGoogleAddress.includes(street);

          // If street doesn't match exactly, check for similarity (ie. spelling errors)
          if (!streetMatches && street) {
            const googleAddress = formatted_address.toLowerCase().replace(/[.,-;:"'&]/g, ' ');
            const streetTokens = googleAddress.split(' ').filter((token: string | any[]) => token.length > 0);
            streetMatches = streetTokens.some((token: string) => isSimilar(street, token));
            if (streetMatches) {
              // Flag and Log the possible spelling error
              neededStreetSimilary = true;
            }
          }
          addressMatches = streetMatches && houseNumber && lowerGoogleAddress.includes(houseNumber);
        }

        let finalMatch = nameMatches;
        
        if (finalMatch) {

          //if name matches but address doesn't, check for distance match
          if (!addressMatches) {
            
            distanceMatches = checkForDistanceThreshold(lat, lng, result.position.lat, result.position.lng);
            finalMatch = distanceMatches && finalMatch;

            if (distanceMatches) {
              // Log that a distance match was needed to match Places
              neededDistanceMatch = true;
            }

          }
        }

        const googleData = {
          name: lowerGoogleName,
          address: lowerGoogleAddress
        };
        const hereData = {
          name: title,
          street: street,
          houseNumber: houseNumber,
          oldTitle: result.title,
          token: titleTokens,
        };
        const matchData = {
          nameMatches: nameMatches,
          addressMatches: addressMatches,
          streetMatches: streetMatches,
          distanceMatches: distanceMatches,
          finalmatch: finalMatch
        }
        const similarityRequirements = {
          neededNameSimilarity: neededNameSimilarity,
          neededStreetSimilary: neededStreetSimilary,
          neededDistanceMatch: neededDistanceMatch
        }

        console.log(
          "googleData", googleData,
          "hereData", hereData,
          "matchData", matchData,
          "similarityRequirements", similarityRequirements,
          "matchesgoogle", matchesGoogle,
        );
        

        return finalMatch;
      };

      return {
        name: result.title,
        lat: result.position.lat,
        lng: result.position.lng,
        matchesGoogle: matchesGoogle,
        neededStreetSimilary: neededStreetSimilary,
        neededDistanceMatch: false,
        updateNeededDistanceMatch: () => neededDistanceMatch
      };
    } catch (error) {
      console.error('Error in searchHereAddress function:', error);
      throw error;
    }
  };

  function isSimilar(str1: string, str2: string): boolean {
    const similarityThreshold = 0.80; // Set the similarity threshold here
    const similarity = calculateSimilarity(str1, str2); // Use a string similarity algorithm to calculate the similarity between the two strings
    return similarity >= similarityThreshold;
  }

  function calculateSimilarity(str1: string, str2: string): number {
    // Implement your string similarity algorithm here (e.g., Levenshtein distance or Jaro-Winkler distance)
    // Return a value between 0 and 1 representing the similarity between the two strings
    // Example implementation using Levenshtein distance:
    const distance = levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
  }

  function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = [];

    for (let i = 0; i <= m; i++) {
      dp[i] = [];
      dp[i][0] = i;
    }

    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1, // Deletion
            dp[i][j - 1] + 1, // Insertion
            dp[i - 1][j - 1] + 1 // Substitution
          );
        }
      }
    }

    return dp[m][n];
  }

  const searchGooglePlace = async (name: string, address: string, lat: number, lng: number): Promise<GooglePlaceResult> => {
    try {
      const response = await axios.get('https://j5s9dm7w-9000.inc1.devtunnels.ms/api/search-google-place', {
        params: { name, address, lat, lng }
      });
      return response.data;
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

  const saveDataToMongoDB = async () => {
    if (isSaved) return; // Prevent multiple saves
  
    setIsSaving(true);
    try {
      const dataToSave = {
        placeName: placeName,
        placeType: placeType, // Add this line to include placeType
        results: groupedRLatLons.flatMap(group =>
          group.ranLatLonss.map(ranLatLonsData => ({
            subRegion: group.subregion_id,
            latLng: {
              lat: ranLatLonsData.ranLatLons.lat,
              lng: ranLatLonsData.ranLatLons.lng
            },
            googlePlaces: ranLatLonsData.nearbyPlaces,
            hereBasedOnGoogle: ranLatLonsData.nearbyPlaces.map(place => {
              const searchKey = `${place.name}-${place.formatted_address}`;
              const hereResult = hereAddressResults[searchKey]?.result;
              if (hereResult) {
                const matchesGoogleResult = hereResult.matchesGoogle(place.formatted_address, place.name);
                return { 
                  name: hereResult.name,
                  lat: hereResult.lat,
                  lng: hereResult.lng,
                  matchesGoogle: matchesGoogleResult,
                  neededStreetSimilary: hereResult.neededStreetSimilary,
                  neededDistanceMatch: hereResult.updateNeededDistanceMatch()
                };
              }
              return null;
            }).filter(Boolean),
            herePlaces: ranLatLonsData.hereNearbyPlaces,
            googleBasedOnHere: ranLatLonsData.hereNearbyPlaces.map(place => {
              const searchKey = `${place.name}-${place.address}`;
              return googleGeocodingResults[searchKey]?.result || null;
            }).filter(Boolean)
          }))
        )
      };
  
      const response = await axios.post('https://j5s9dm7w-9000.inc1.devtunnels.ms/api/save-results', dataToSave);
      if (response.data.success) {
        alert('Data saved successfully!');
        setIsSaved(true);
      } else {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <Header isMapPage={true} ></Header>
      <h1>Search Results</h1>
      <p>Place Type: {placeType.label}</p>
      <p>Place Name: {placeName}</p>
      <button
        onClick={saveDataToMongoDB}
        disabled={isSaving || isSaved}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          fontSize: '13px',
          backgroundColor: isSaved ? '#cccccc' : '#4CAF50',
          color: 'Black',
          marginRight: '5px',
          marginBottom: '5px',

          cursor: isSaving || isSaved ? 'not-allowed' : 'pointer'
        }}
      >
        {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save Results to MongoDB'}
      </button>

      <button onClick={navigateToVisualization} style={{ marginTop: '20px', padding: '10px 20px', marginBottom: '5px' }}>
        View Matching Data Visualization
      </button>

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
                        <th style={innerTableHeaderStyle}>Distance Diff (km)</th>
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
                              <td style={innerTableCellStyle}>
                                {place.hereResultState?.result
                                  ? calculateDistance(
                                    place.lat,
                                    place.lng,
                                    place.hereResultState.result.lat,
                                    place.hereResultState.result.lng
                                  ).toFixed(3)
                                  : 'N/A'}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={innerTableCellStyle}>No API key found or error in API or No results found</td>
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
