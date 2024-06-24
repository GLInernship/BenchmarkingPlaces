import React, { useState, useEffect } from 'react';
import { useGridContext } from './GridContext';

const NearbySearchPage: React.FC = () => {
  const { divisionData, poiData } = useGridContext();
  const [nearbyPlaces, setNearbyPlaces] = useState<google.maps.places.PlaceResult[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (poiData.length > 0) {
      searchNearbyPlaces();
    }
  }, [poiData]);

  const searchNearbyPlaces = async () => {
    setLoading(true);
    setError(null);
    const allNearbyPlaces: google.maps.places.PlaceResult[][] = [];

    try {
      // Create a map instance (required for PlacesService)
      const mapElement = document.createElement('div');
      const map = new google.maps.Map(mapElement);
      const service = new google.maps.places.PlacesService(map);

      for (const poi of poiData) {
        try {
          const request: google.maps.places.PlaceSearchRequest = {
            location: new google.maps.LatLng(poi.lat, poi.lng),
            radius: 500, // Search within 500 meters
            type: 'point_of_interest' // You can change this to specific types if needed
          };

          console.log('Searching nearby places for POI:', poi);

          const results = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
            service.nearbySearch(request, (results, status) => {
              console.log('Nearby search status:', status);
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                resolve(results);
              } else {
                reject(new Error(`Nearby search failed for POI: ${poi.name}. Status: ${status}`));
              }
            });
          });

          console.log('Nearby search results:', results);
          allNearbyPlaces.push(results);
        } catch (poiError) {
          console.error('Error searching for POI:', poi, poiError);
          allNearbyPlaces.push([]);
        }
      }

      setNearbyPlaces(allNearbyPlaces);
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

  return (
    <div>
      <h1>Nearby Search</h1>
      {loading && <p>Loading nearby places...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <>
          <h2>Nearby Places:</h2>
          {nearbyPlaces.map((placesForPoi, index) => (
            <div key={index}>
              <h3>POI: {poiData[index].name}</h3>
              {placesForPoi.length > 0 ? (
                <ul>
                  {placesForPoi.map((place, placeIndex) => (
                    <li key={placeIndex}>
                      {place.name} - {place.vicinity}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No nearby places found for this POI.</p>
              )}
            </div>
          ))}
          <h2>Division Data:</h2>
          <pre>{JSON.stringify(divisionData, null, 2)}</pre>
          <h2>POI Data:</h2>
          <pre>{JSON.stringify(poiData, null, 2)}</pre>
        </>
      )}
    </div>
  );
};

export default NearbySearchPage;