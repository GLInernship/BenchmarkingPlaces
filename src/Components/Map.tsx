import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGridContext } from './GridContext';
import hereLogo from './HERE_logo.svg.png';
import {
    MainContainer,
    Header,
    SearchContainer,
    SearchInput,
    GridMap,
    MapContainer,
    Sidebar,
    FormGroup,
    ButtonGroup,
    Button,
    Button2,
    RightSection,
    CoordinateContainer,
    BoundingBoxDetails,
    Label,
    Input
  } from './MapStyles';


const GOOGLE_MAPS_API_KEY = 'AIzaSyDoLzY6DBVoUPPMoCNewEnnp3inyXvCkNE'; // Replace with your actual API key

interface GoogleMap extends google.maps.Map { }

interface PlaceType {
    label: string;
    googleValue: string;
    hereValue: string;
}

const placeTypeOptions: PlaceType[] = [
    { label: "None", googleValue: "", hereValue: "" },
    { label: "Restaurant", googleValue: "restaurant", hereValue: "100-1000-0000" },
    { label: "Cafe", googleValue: "cafe", hereValue: "100-1000-0007" },
    { label: "Park", googleValue: "park", hereValue: "550-5510-0202" },
    { label: "Museum", googleValue: "museum", hereValue: "300-3100-0000" },
    { label: "Shopping", googleValue: "shopping_mall", hereValue: "600-6100-0062" },
    { label: "Hotel", googleValue: "lodging", hereValue: "500-5100-0000" },
    { label: "Hospital", googleValue: "hospital", hereValue: "800-8000-0159" },
    { label: "Bank", googleValue: "bank", hereValue: "700-7000-0107" },
    { label: "School", googleValue: "school", hereValue: "800-8200-0174" },
];

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
    const [placeName, setPlaceName] = useState<string>('');
    

    const [placeType, setPlaceType] = useState<PlaceType>(placeTypeOptions[0]);

    useEffect(() => {
      // Initialize placeName from localStorage when component mounts
      const storedPlaceName = localStorage.getItem('placeName');
      if (storedPlaceName) {
          setPlaceName(storedPlaceName);
      }
  }, []);


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

    const handlePlaceTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedType = placeTypeOptions.find(option => option.label === event.target.value);
        setPlaceType(selectedType || placeTypeOptions[0]);
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
                    setIsPlaceSelected(true); // Add this line
                    setPlaceName(place.name || '');

                    drawPlaceOutline(place, googleMap);
                    displayBoundingBoxCoords(place);
                } else {
                    console.error('Place selected does not have geometry');
                    setIsPlaceSelected(false); // Add this line
                    setPlaceName('');
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
            setPoiData(divisionData.flatMap(division => division.ranLatLonss.map((ranLatLons: any) => ({
                ...ranLatLons,
                subregion_id: division.subregion_id
            }))));
            setEnterClicked(true);
            saveGridDataToBackend(divisionData); // Add this line
        }
    };
    const handleNearbySearchClick = () => {
        if (selectedPlace) {
            const allDivisions = drawGridDivisions();
            const centers = allDivisions.map(division => ({
                index: division.subregion_id, // Changed from index to subregion_id
                center: division.center
            }));
            navigate('/nearby-search', {
                state: {
                    subregion_id: gridDivisions.M * gridDivisions.N, // Changed from divisionIndex to subregion_id
                    centers: centers,
                    searchRadius: searchRadius,
                    resultLimit: resultLimit,
                    placeType: placeType,
                    placeName: placeName
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
                    subregion_id: labelIndex, // Changed from index to subregion_id
                    bounds: boxCoords,
                    center: { lat: centerLat, lng: centerLng },
                    ranLatLonss: randomPOIs // Changed from pois to ranLatLonss
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

    const displayRandomPOIs = (ranLatLonss: { name: string, lat: number, lng: number }[]) => {
        ranLatLonss.forEach(ranLatLons => {

            const icon = {
                url: 'https://www.pngall.com/wp-content/uploads/13/Red-Circle.png',
                scaledSize: new google.maps.Size(12, 12), // Adjust the size as needed
                origin: new google.maps.Point(0, 0), // Optional. The origin point of the icon
                anchor: new google.maps.Point(16, 16) // Optional. The anchor point of the icon (center)
            };

            new google.maps.Marker({
                position: { lat: ranLatLons.lat, lng: ranLatLons.lng },
                map: map!,
                title: ranLatLons.name,
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

    const saveGridDataToBackend = async (divisionData: any[]) => {
        try {
            const response = await fetch('https://j5s9dm7w-9000.inc1.devtunnels.ms/api/grid-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    placeName: placeName,
                    gridData: divisionData
                }),
            });
            if (response.ok) {
                console.log('Grid data saved successfully');
            } else {
                console.error('Failed to save grid data');
            }
        } catch (error) {
            console.error('Error saving grid data:', error);
        }
    };

    const handleViewRecentReports = () => {
        navigate('/report-generation');
    };


    return (
        <MainContainer>
          <Header>
            <p>Benchmarking Places</p>
            <SearchContainer>
              <SearchInput
                type="text"
                placeholder="Search place"
                ref={searchInputRef}
                className='search-input 85px'
                required
              />
            </SearchContainer>
            <img src={hereLogo} alt="here" />
          </Header>
          <GridMap>
            <MapContainer>
              <div style={{ width: '100%', height: '800px', border: '1px solid #ccc', borderRadius: '4px' }} ref={mapRef}>
                Loading Map...
              </div>
              <RightSection>
                <CoordinateContainer>
                  {boundingBoxCoords.map((coord, index) => (
                    <div className='coordinate' key={index}>{coord}</div>
                  ))}
                </CoordinateContainer>
                <BoundingBoxDetails>
                  {boundingBoxDetails.map((detail, index) => (
                    <div className='box-detail' key={index}>{detail}</div>
                  ))}
                </BoundingBoxDetails>
              </RightSection>
            </MapContainer>
            <Sidebar>
              <FormGroup as="form" onSubmit={handleFormSubmit}>
                <Label>Number of Rows :</Label>
                <Input
                  type="number"
                  name="M"
                  value={gridDivisions.M}
                  onChange={handleGridDivisionsChange}
                  onKeyPress={handleKeyPress}
                  required
                  min="1"
                />
                <Label>Number of Columns :</Label>
                <Input
                  type="number"
                  name="N"
                  value={gridDivisions.N}
                  onChange={handleGridDivisionsChange}
                  onKeyPress={handleKeyPress}
                  required
                  min="1"
                />
                <Label>Number of (Lat, Lng) (1-20):</Label>
                <Input
                  type="number"
                  name="poiCount"
                  value={poiCount}
                  onChange={handlePoiCountChange}
                  onKeyPress={handleKeyPress}
                  min="1"
                  max="20"
                  placeholder="Enter Random Lat Long count"
                  required
                />
                <Label>Place Type:</Label>
                <select
                  className='typeSelect'
                  value={placeType.label}
                  onChange={handlePlaceTypeChange}
                  required
                >
                  {placeTypeOptions.map(option => (
                    <option key={option.label} value={option.label}>{option.label}</option>
                  ))}
                </select>
                <Label>Search Radius (meters):</Label>
                <Input
                  type="number"
                  name="searchRadius"
                  value={searchRadius}
                  onChange={handleSearchRadiusChange}
                  onKeyPress={handleKeyPress}
                  required
                  min="1"
                />
                <Label>Result Limit (1-60):</Label>
                <Input
                  type="number"
                  name="resultLimit"
                  value={resultLimit}
                  onChange={handleResultLimitChange}
                  onKeyPress={handleKeyPress}
                  required
                  min="1"
                  max="60"
                />
                <ButtonGroup>
                  <Button type="submit" disabled={!isPlaceSelected}>Enter</Button>
                  <Button type="button" onClick={handlePageRefresh}>Reset</Button>
                  {enterClicked && <Button2 type="button" onClick={handleNearbySearchClick}>Nearby Search</Button2>}
                  <Button2 type="button" onClick={handleViewRecentReports}>View Recent Reports</Button2>
                </ButtonGroup>
              </FormGroup>
            </Sidebar>
          </GridMap>
        </MainContainer>
      );
};

export default GridDivisionsMap;


