import React, { useEffect, useRef, useState } from 'react';
import './map.css';
import { useNavigate } from 'react-router-dom';
import { useGridContext } from './GridContext';


const GOOGLE_MAPS_API_KEY = 'AIzaSyDoLzY6DBVoUPPMoCNewEnnp3inyXvCkNE'; // Replace with your actual API key

interface GoogleMap extends google.maps.Map { }

const GridDivisionsMap: React.FC = () => {
  const navigate = useNavigate();
  const { setDivisionData, setPoiData } = useGridContext();

  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<GoogleMap | undefined>(undefined);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [placePolygon, setPlacePolygon] = useState<google.maps.Polygon | null>(null);
  const [boundingBoxCoords, setBoundingBoxCoords] = useState<string[]>([]);
  const [gridDivisions, setGridDivisions] = useState<{ M: number; N: number }>({ M: 1, N: 1 });
  const [gridLines, setGridLines] = useState<google.maps.Polyline[]>([]);
  const [gridLabels, setGridLabels] = useState<google.maps.Marker[]>([]);
  const [boundingBoxDetails, setBoundingBoxDetails] = useState<string[]>([]);
  const [poiCount, setPoiCount] = useState<string>(''); // Changed from number to string
  const [enterClicked, setEnterClicked] = useState<boolean>(false);
  const [isPlaceSelected, setIsPlaceSelected] = useState<boolean>(false);
  const [searchRadius, setSearchRadius] = useState<number>(1000);
  const [resultLimit, setResultLimit] = useState<number>(20);

  const handleSearchRadiusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0) {
      setSearchRadius(value);
    }
  };

  const handleResultLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0 && value <= 60) {
      setResultLimit(value);
    }
  };


  useEffect(() => {
    if (!mapRef.current || map !== undefined) return;
  
    const onLoad = () => {
      const googleMap = new window.google.maps.Map(mapRef.current!, {
        center: { lat: 40.712776, lng: -74.005974 },
        zoom: 12,
      });
  
      setMap(googleMap);
  
      const autocompleteInstance = new window.google.maps.places.Autocomplete(searchInputRef.current!);
      autocompleteInstance.bindTo('bounds', googleMap);
      setAutocomplete(autocompleteInstance);
  
      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        if (place.geometry) {
          googleMap.setCenter(place.geometry.location);
          googleMap.setZoom(12);
          setSelectedPlace(place);
          setIsPlaceSelected(true);  // Add this line
  
          drawPlaceOutline(place, googleMap);
          displayBoundingBoxCoords(place);
        } else {
          console.error('Place selected does not have geometry');
          setIsPlaceSelected(false);  // Add this line
        }
      });
    };
  
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.onload = onLoad;
      document.head.appendChild(script);
    } else {
      onLoad();
    }
  }, [map]);

  const drawPlaceOutline = (place: google.maps.places.PlaceResult, googleMap: google.maps.Map) => {
    if (place.geometry && place.geometry.viewport) {
      const bounds = place.geometry.viewport;
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      if (placePolygon) {
        placePolygon.setMap(null);
      }

      const boundsLatLng = [
        { lat: ne.lat(), lng: ne.lng() },
        { lat: sw.lat(), lng: ne.lng() },
        { lat: sw.lat(), lng: sw.lng() },
        { lat: ne.lat(), lng: sw.lng() }
      ];

      const redLineCoords = new google.maps.Polygon({
        paths: boundsLatLng,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        editable: false,
        draggable: false,
        geodesic: true,
        map: googleMap,
      });
      setPlacePolygon(redLineCoords);
    }
  };

  const displayBoundingBoxCoords = (place: google.maps.places.PlaceResult) => {
    if (place.geometry && place.geometry.viewport) {
      const bounds = place.geometry.viewport;
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      const coords = [
        `North-East: (Lat: ${ne.lat().toFixed(6)}, Lng: ${ne.lng().toFixed(6)})`,
        `North-West: (Lat: ${ne.lat().toFixed(6)}, Lng: ${sw.lng().toFixed(6)})`,
        `South-West: (Lat: ${sw.lat().toFixed(6)}, Lng: ${sw.lng().toFixed(6)})`,
        `South-East: (Lat: ${sw.lat().toFixed(6)}, Lng: ${ne.lng().toFixed(6)})`
      ];

      setBoundingBoxCoords(coords);
    }
  };

  const handleGridDivisionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const numValue = Math.abs(parseInt(value, 10)); // Ensure positive number
    setGridDivisions(prevState => ({
      ...prevState,
      [name]: isNaN(numValue) ? '' : numValue
    }));
  };

  const handleEnterButtonClick = () => {
    if (selectedPlace) {
      const divisionData = drawGridDivisions();
      setDivisionData(divisionData);
      setPoiData(divisionData.flatMap(division => division.pois.map((poi: any) => ({
        ...poi,
        divisionIndex: division.index
      }))));
      setEnterClicked(true); // Add this line
    }
  };
  const handleNearbySearchClick = () => {
    if (selectedPlace) {
      const allDivisions = drawGridDivisions();
      const centers = allDivisions.map(division => ({
        index: division.index,
        center: division.center
      }));
      navigate('/nearby-search', {
        state: {
          divisionIndex: gridDivisions.M * gridDivisions.N,
          centers: centers,
          searchRadius: searchRadius,
          resultLimit: resultLimit
        }
      });
    } else {
      alert("Please select a place first.");
    }
  };


  const drawGridDivisions = () => {
    if (!map || !selectedPlace) return [];

    clearGridDivisions();
    clearGridLabels();

    const bounds = selectedPlace.geometry!.viewport;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const M = gridDivisions.M;
    const N = gridDivisions.N;

    const latStep = (ne.lat() - sw.lat()) / M;
    const lngStep = (ne.lng() - sw.lng()) / N;

    const lines: google.maps.Polyline[] = [];
    const labels: google.maps.Marker[] = [];
    const divisionData: any[] = [];
    const newBoundingBoxDetails: string[] = [];

    // Draw horizontal grid lines
    for (let i = 0; i <= M; i++) {
      const lat = ne.lat() - i * latStep;
      const lineCoords = [
        { lat, lng: sw.lng() },
        { lat, lng: ne.lng() }
      ];
      const gridLine = new google.maps.Polyline({
        path: lineCoords,
        strokeColor: "#000000",
        strokeOpacity: 0.5,
        strokeWeight: 1,
        map: map,
      });
      lines.push(gridLine);
    }

    // Draw vertical grid lines
    for (let j = 0; j <= N; j++) {
      const lng = sw.lng() + j * lngStep;
      const lineCoords = [
        { lat: ne.lat(), lng },
        { lat: sw.lat(), lng }
      ];
      const gridLine = new google.maps.Polyline({
        path: lineCoords,
        strokeColor: "#000000",
        strokeOpacity: 0.5,
        strokeWeight: 1,
        map: map,
      });
      lines.push(gridLine);
    }

    // Draw grid labels and generate division data
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < N; j++) {
        const lat1 = ne.lat() - i * latStep;
        const lat2 = ne.lat() - (i + 1) * latStep;
        const lng1 = sw.lng() + j * lngStep;
        const lng2 = sw.lng() + (j + 1) * lngStep;

        // Calculate center point
        const centerLat = (lat1 + lat2) / 2;
        const centerLng = (lng1 + lng2) / 2;

        const labelPosition = new google.maps.LatLng(
          lat1 - latStep / 2,
          lng1 + lngStep / 2
        );

        const labelIndex = i * N + j + 1;

        // Draw grid label
        const icon = {
          url: 'https://imgs.search.brave.com/g-dExE8SKvkVmB8zFFK55jmu3dQOigkuC2FLNyhMfaw/rs:fit:860:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nbWFydC5jb20v/ZmlsZXMvMjMvQmxh/Y2stQ2lyY2xlLVBO/Ry1IRC5wbmc',
          scaledSize: new google.maps.Size(32, 32),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(16, 16)
        };

        const label = new google.maps.Marker({
          position: labelPosition,
          label: {
            text: `${labelIndex}`,
            color: 'yellow',
            fontSize: '12px',
            fontWeight: 'bold'
          },
          icon: icon,
          map: map,
        });
        labels.push(label);

        // Generate division data
        const boxCoords = [
          `Top-Left: (${lat1.toFixed(6)}, ${lng1.toFixed(6)})`,
          `Top-Right: (${lat1.toFixed(6)}, ${lng2.toFixed(6)})`,
          `Bottom-Left: (${lat2.toFixed(6)}, ${lng1.toFixed(6)})`,
          `Bottom-Right: (${lat2.toFixed(6)}, ${lng2.toFixed(6)})`,
          `Center: (${centerLat.toFixed(6)}, ${centerLng.toFixed(6)})`
        ];
        newBoundingBoxDetails.push(``);
        newBoundingBoxDetails.push(`-----------------------`);
        newBoundingBoxDetails.push(`Division ${labelIndex}:`);
        newBoundingBoxDetails.push(...boxCoords);

        // Generate and display random POIs
        const poiBounds = {
          north: lat1,
          south: lat2,
          east: lng2,
          west: lng1
        };
        const randomPOIs = generateRandomPOIs(poiBounds, poiCount);
        displayRandomPOIs(randomPOIs);

        // Store division data
        divisionData.push({
          index: labelIndex,
          bounds: boxCoords,
          center: { lat: centerLat, lng: centerLng },
          pois: randomPOIs
        });

        newBoundingBoxDetails.push(`Random Lat-Lng:`);
        randomPOIs.forEach(poi => {
          newBoundingBoxDetails.push(`${poi.name} - (${poi.lat.toFixed(6)}, ${poi.lng.toFixed(6)})`);
        });
      }
    }

    setGridLines(lines);
    setGridLabels(labels);
    setBoundingBoxDetails(newBoundingBoxDetails);

    return divisionData;
  };

  const generateRandomPOIs = (bounds: { north: number, south: number, east: number, west: number }, count: string): { name: string, lat: number, lng: number }[] => {
    const numPOIs = count === '' ? 0 : Math.min(Math.max(0, parseInt(count, 10)), 20);
    const randomPOIs: { name: string, lat: number, lng: number }[] = [];

    for (let i = 0; i < numPOIs; i++) {
      const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
      const lng = bounds.west + Math.random() * (bounds.east - bounds.west);
      randomPOIs.push({ name: `Point ${i + 1}`, lat, lng });
    }

    return randomPOIs;
  };

  const displayRandomPOIs = (pois: { name: string, lat: number, lng: number }[]) => {
    pois.forEach(poi => {

      const icon = {
        url: 'https://www.pngall.com/wp-content/uploads/13/Red-Circle.png',
        scaledSize: new google.maps.Size(12, 12),  // Adjust the size as needed
        origin: new google.maps.Point(0, 0),  // Optional. The origin point of the icon
        anchor: new google.maps.Point(16, 16)  // Optional. The anchor point of the icon (center)
      };

      new google.maps.Marker({
        position: { lat: poi.lat, lng: poi.lng },
        map: map!,
        title: poi.name,
        icon: icon
      });
    });
  };


  const clearGridDivisions = () => {
    gridLines.forEach(line => {
      line.setMap(null);
    });
    setGridLines([]);
  };

  const clearGridLabels = () => {
    gridLabels.forEach(label => {
      label.setMap(null);
    });
    setGridLabels([]);
  };

  const handlePageRefresh = () => {
    window.location.reload();
  };

  const handlePoiCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const numValue = Math.abs(parseInt(value, 10)); // Ensure positive number
    if (value === '' || (numValue >= 0 && numValue <= 20)) {
      setPoiCount(value === '' ? '' : numValue.toString());
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPlace) {
      alert("Please search and select a place before submitting.");
      return;
    }
    if (gridDivisions.M > 0 && gridDivisions.N > 0 && poiCount !== '') {
      handleEnterButtonClick();
    } else {
      alert("Please fill in all fields before submitting.");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent '+' and '-' from being entered
    if (event.key === '+' || event.key === '-') {
      event.preventDefault();
    }
  };

  return (
    <div className='grid-map'>
      <div className='search-container'>
        <input
          type="text"
          placeholder="Search for a place"
          ref={searchInputRef}
          className='mapinput'
          required
        />
      </div>
      <div className='map-container'>
        <div style={{ width: '100%', height: '400px', border: '1px solid #ccc', borderRadius: '4px' }} ref={mapRef}>
          Loading Map...
        </div>
        <div className='coordinate-container'>
          {boundingBoxCoords.map((coord, index) => (
            <div className='coordinate' key={index}>{coord}</div>
          ))}
        </div>
      </div>
      <form onSubmit={handleFormSubmit} className='control-panel'>
        <label>Number of Rows (M):</label>
        <input
          type="number"
          name="M"
          value={gridDivisions.M}
          onChange={handleGridDivisionsChange}
          onKeyPress={handleKeyPress}
          required
          min="1"
        />
        <label>Number of Columns (N):</label>
        <input
          type="number"
          name="N"
          value={gridDivisions.N}
          onChange={handleGridDivisionsChange}
          onKeyPress={handleKeyPress}
          required
          min="1"
        />
        <label>Number of (Lat, Lng) (1-20):</label>
        <input
          type="number"
          name="poiCount"
          value={poiCount}
          onChange={handlePoiCountChange}
          onKeyPress={handleKeyPress}
          min="1"
          max="20"
          placeholder="Enter POI count"
          required
        />
        <label>Search Radius (meters):</label>
        <input
          type="number"
          name="searchRadius"
          value={searchRadius}
          onChange={handleSearchRadiusChange}
          onKeyPress={handleKeyPress}
          required
          min="1"
        />
        
        <label>Result Limit (1-60):</label>
        <input
          type="number"
          name="resultLimit"
          value={resultLimit}
          onChange={handleResultLimitChange}
          onKeyPress={handleKeyPress}
          required
          min="1"
          max="60"
        />
       <button type="submit" disabled={!isPlaceSelected}>Enter</button>
        {enterClicked && <button type="button" onClick={handleNearbySearchClick}>Nearby Search</button>}
        <button type="button" onClick={handlePageRefresh}>Reset</button>
      </form>

      <div className='bounding-box-details'>
        {boundingBoxDetails.map((detail, index) => (
          <div className='box-detail' key={index}>{detail}</div>
        ))}
      </div>
    </div>
  );
};

export default GridDivisionsMap;