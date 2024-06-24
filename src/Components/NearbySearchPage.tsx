import React, { useState, useEffect } from 'react';
import { useGridContext } from './GridContext';

interface POI {
  name: string;
  lat: number;
  lng: number;
  divisionId: number;
}

interface NearbyPlace {
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
}

interface GroupedPOI {
  division: string;
  pois: {
    poi: POI;
    nearbyPlace: NearbyPlace | null;
  }[];
}

const NearbySearchPage: React.FC = () => {
  const { divisionData, poiData } = useGridContext();
  const [groupedPOIs, setGroupedPOIs] = useState<GroupedPOI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(1000); // Default radius of 1000 meters

  useEffect(() => {
    if (poiData.length > 0) {
      searchNearbyPlaces();
    }
  }, [poiData]);

  const searchNearbyPlaces = async () => {
    setLoading(true);
    setError(null);
    const groupedResults: GroupedPOI[] = [];
    try {
      const mapElement = document.createElement('div');
      const map = new google.maps.Map(mapElement);
      const service = new google.maps.places.PlacesService(map);
      for (const division of divisionData) {
        const poisInDivision = poiData.filter(poi => poi.divisionId === division.id);
        const poisWithNearbyPlaces = await Promise.all(poisInDivision.map(async (poi) => {
          try {
            const request: google.maps.places.PlaceSearchRequest = {
              location: new google.maps.LatLng(poi.lat, poi.lng),
              radius: searchRadius,
              type: 'point_of_interest'
            };
            const result = await new Promise<NearbyPlace | null>((resolve, reject) => {
              service.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                  const nearbyPlace = results[0];
                  resolve({
                    name: nearbyPlace.name || 'Unknown',
                    formatted_address: nearbyPlace.vicinity || 'Unknown address',
                    lat: nearbyPlace.geometry?.location?.lat() || 0,
                    lng: nearbyPlace.geometry?.location?.lng() || 0
                  });
                } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                  resolve(null);
                } else {
                  reject(new Error(`Place search failed for POI: ${poi.name}. Status: ${status}`));
                }
              });
            });
            return { poi, nearbyPlace: result };
          } catch (poiError) {
            console.error('Error searching for POI:', poi, poiError);
            return { poi, nearbyPlace: null };
          }
        }));
        groupedResults.push({
          division: division.name,
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

  const handleRadiusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0) {
      setSearchRadius(value);
    }
  };

  const handleSearchClick = () => {
    searchNearbyPlaces();
  };

  return (
    <div>
      <h1>Nearby Search</h1>
      <div>
        <label htmlFor="radius">Search Radius (meters): </label>
        <input 
          type="number" 
          id="radius" 
          value={searchRadius} 
          onChange={handleRadiusChange} 
          min="1"
        />
        <button onClick={handleSearchClick}>Search</button>
      </div>
      {loading && <p>Loading nearby places...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <>
          <h2>Grouped Nearby Places:</h2>
          {groupedPOIs.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h3>Division: {group.division}</h3>
              {group.pois.map((poiData, poiIndex) => (
                <div key={poiIndex}>
                  <h4>POI: {poiData.poi.name} (Lat: {poiData.poi.lat.toFixed(6)}, Lng: {poiData.poi.lng.toFixed(6)})</h4>
                  {poiData.nearbyPlace ? (
                    <p>
                      Nearby Place: {poiData.nearbyPlace.name} - {poiData.nearbyPlace.formatted_address}
                      <br />
                      Lat: {poiData.nearbyPlace.lat.toFixed(6)}, Lng: {poiData.nearbyPlace.lng.toFixed(6)}
                    </p>
                  ) : (
                    <p>No nearby place found for this POI.</p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default NearbySearchPage;