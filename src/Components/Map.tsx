import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDoLzY6DBVoUPPMoCNewEnnp3inyXvCkNE';

interface GoogleMap extends google.maps.Map {}

const Map: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<GoogleMap | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [placePolygon, setPlacePolygon] = useState<google.maps.Polygon | null>(null);

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

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Search for a place"
          ref={searchInputRef}
          style={{
            width: '300px',
            padding: '6px',
            fontSize: '16px', // Example additional style
            borderRadius: '4px' // Example additional style
          }}
        />
      </div>
      <div style={{ width: '100%', height: '400px', border: '1px solid #ccc', borderRadius: '4px' }} ref={mapRef}>
        Loading Map...
      </div>
    </div>
  );
};

export default Map;
