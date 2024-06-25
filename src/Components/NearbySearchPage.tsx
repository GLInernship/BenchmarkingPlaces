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
    nearbyPlace: NearbyPlace | null;
  }[];
}

interface LocationState {
  divisionIndex: number;
  centers: { index: number; center: { lat: number; lng: number } }[];
}

const NearbySearchPage: React.FC = () => {
  const { divisionData, poiData } = useGridContext();
  const [groupedPOIs, setGroupedPOIs] = useState<GroupedPOI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(1000); // Default radius of 1000 meters
  const [dataSaved, setDataSaved] = useState(false);

  const location = useLocation();
  const { divisionIndex: totalDivisions, centers } = location.state as LocationState;

  useEffect(() => {
    if (centers.length > 0) {
      searchNearbyPlaces();
    }
  }, [centers]);

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
            const nearbyPlace = await searchNearbyPlace(service, poi);
            return { poi, nearbyPlace };
          } catch (poiError) {
            console.error('Error searching for POI:', poi, poiError);
            return { poi, nearbyPlace: null };
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

  const searchNearbyPlace = (service: google.maps.places.PlacesService, poi: POI): Promise<NearbyPlace | null> => {
    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(poi.lat, poi.lng),
        radius: searchRadius,
        type: 'point_of_interest'
      };

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
          <button onClick={handleSaveData} disabled={dataSaved}>
            {dataSaved ? 'Data Saved' : 'Save Data'}
          </button>
          {groupedPOIs.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h3>Sub-Region: {group.divisionIndex}----{group.centerAddress}</h3>
              <p>Center: (Lat: {group.center.lat.toFixed(6)}, Lng: {group.center.lng.toFixed(6)})</p>
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