import React, { useEffect, useRef, useState } from 'react';
import './map.css';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDoLzY6DBVoUPPMoCNewEnnp3inyXvCkNE'; // Replace with your actual API key

interface GoogleMap extends google.maps.Map {}

const GridDivisionsMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<GoogleMap | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [placePolygon, setPlacePolygon] = useState<google.maps.Polygon | null>(null);
  const [boundingBoxCoords, setBoundingBoxCoords] = useState<string[]>([]);
  const [gridDivisions, setGridDivisions] = useState<{ M: number; N: number }>({ M: 1, N: 1 });
  const [gridLines, setGridLines] = useState<google.maps.Polyline[]>([]);
  const [gridLabels, setGridLabels] = useState<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || map !== null) return;

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

          drawPlaceOutline(place, googleMap);
          displayBoundingBoxCoords(place);
        } else {
          console.error('Place selected does not have geometry');
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
    setGridDivisions(prevState => ({
      ...prevState,
      [name]: parseInt(value, 10)
    }));
  };

  const handleEnterButtonClick = () => {
    if (selectedPlace) {
      drawGridDivisions();
    }
  };

  const drawGridDivisions = () => {
    if (!map || !selectedPlace) return;

    clearGridDivisions();
    clearGridLabels();

    const bounds = selectedPlace.geometry!.viewport;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const boundsLatLng = [
      { lat: ne.lat(), lng: ne.lng() },
      { lat: sw.lat(), lng: ne.lng() },
      { lat: sw.lat(), lng: sw.lng() },
      { lat: ne.lat(), lng: sw.lng() }
    ];

    const M = gridDivisions.M;
    const N = gridDivisions.N;

    const latStep = (ne.lat() - sw.lat()) / M;
    const lngStep = (ne.lng() - sw.lng()) / N;

    const lines: google.maps.Polyline[] = [];
    const labels: google.maps.Marker[] = [];

    for (let i = 0; i <= M; i++) {
      const lat = ne.lat() - i * latStep;
      const lineCoords = [
        { lat: lat, lng: ne.lng() },
        { lat: lat, lng: sw.lng() }
      ];

      const gridLine = new google.maps.Polyline({
        path: lineCoords,
        strokeColor: "#000000",
        strokeOpacity: 0.5,
        strokeWeight: 1,
        map: map
      });

      lines.push(gridLine);
    }

    for (let j = 0; j <= N; j++) {
      const lng = sw.lng() + j * lngStep;
      const lineCoords = [
        { lat: ne.lat(), lng: lng },
        { lat: sw.lat(), lng: lng }
      ];

      const gridLine = new google.maps.Polyline({
        path: lineCoords,
        strokeColor: "#000000",
        strokeOpacity: 0.5,
        strokeWeight: 1,
        map: map
      });

      lines.push(gridLine);
    }

    let labelIndex = 1;
    for (let i = 0; i < M; i++) {
      const lat1 = ne.lat() - i * latStep;
      const lat2 = ne.lat() - (i + 1) * latStep;
      for (let j = 0; j < N; j++) {
        const lng1 = sw.lng() + j * lngStep;
        const lng2 = sw.lng() + (j + 1) * lngStep;

        const labelPosition = new google.maps.LatLng(
          lat1 - latStep / 2,
          lng1 + lngStep / 2
        );

        const label = new google.maps.Marker({
          position: labelPosition,
          label: {
            text: `${labelIndex}`,
            color: 'black',
            fontSize: '12px',
            fontWeight: 'bold'
          },
          map: map,
        });

        labels.push(label);
        labelIndex++;
      }
    }

    setGridLines(lines);
    setGridLabels(labels);
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

  const handleUndoButtonClick = () => {
    clearGridDivisions();
    clearGridLabels();
  };

  return (
    <div className='grid-map'>
      <div className='search-container'>
        <input
          type="text"
          className='locationSearch'
          placeholder="Search for a place"
          ref={searchInputRef}
          style={{marginBottom: '20px', width: '400px', height: '22px',  border: '1px solid #000', borderRadius: '4px', paddingLeft:'12px' }}
        />
      </div>
      <div className='map-container'>
        <div className='map' style={{ width: '9000px', height: '400px', border: '1px solid #ccc', borderRadius: '4px' }} ref={mapRef}>
          Loading Map...
        </div>
        <div className='coord1'>
          {boundingBoxCoords.map((coord, index) => (
            <div className='coordinate' key={index}>{coord}</div>
          ))}
        </div>
      </div>
      <div className='mapinput'>
        <label>Number of Rows (M):</label>
        <input type="number" name="M" value={gridDivisions.M} onChange={handleGridDivisionsChange} />
        <label>Number of Columns (N):</label>
        <input type="number" name="N" value={gridDivisions.N} onChange={handleGridDivisionsChange} />
        <button onClick={handleEnterButtonClick}>Enter</button>
        <button onClick={handleUndoButtonClick}>Undo</button>
      </div>
    </div>
  );
};

export default GridDivisionsMap;