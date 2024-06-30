import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Step 1: Updated import
import {
  AppContainer,
  ReloadButton,
  Main,
  SearchBar,
  PlacesGrid,
  PlaceCard,
  PlaceImage,
  PlaceName,
  PlaceLocation,
} from './ReportGenerationStyles'; // Adjust the import path as necessary
import Headerr from '../Header';

interface Place {
  placeName: string;
  location: string;
  imageUrl: string;
}

const Reportgenerationpage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('Most Relevant');
  const [places, setPlaces] = useState<Place[]>([]);
  const [isCached, setIsCached] = useState(false); // State to manage if data is cached
  const navigate = useNavigate(); // Step 2: Use useNavigate

  const filterPlaces = (places: Place[], term: string) => {
    return places.filter(place =>
      place.placeName.toLowerCase().includes(term.toLowerCase()) ||
      place.location.toLowerCase().includes(term.toLowerCase())
    );
  };

  useEffect(() => {
    const cachedPlaces = localStorage.getItem('places'); // Retrieve places from local storage
    if (cachedPlaces) {
      setPlaces(JSON.parse(cachedPlaces)); // Parse and set places if available
    } else {
      fetchPlaces(); // Fetch places if not available in local storage
    }
  }, []);


  const fetchPlaces = async () => {
    try {
      const response = await axios.get('https://j5s9dm7w-9000.inc1.devtunnels.ms/api/get-results');
    //  const response = await axios.get('http://localhost:9000/api/get-results');
      setPlaces(response.data);
      localStorage.setItem('places', JSON.stringify(response.data)); // Store places in local storage
    } catch (error) {
      console.error('Error fetching places:', error);
    }
  };

  const handleReloadClick = () => {
    console.log('Button clicked'); // Add console log
    localStorage.removeItem('places'); // Remove places from local storage
    fetchPlaces(); // Fetch new data
  };


  const handlePlaceClick = (placeName: string) => {
    navigate(`/place/${placeName}`, { state: { placeName } });
  };

  const filteredPlaces = filterPlaces(places, searchTerm);

  return (
    <AppContainer>
      
      <Headerr isMapPage={true} ></Headerr>
      {/* <Header>
        <Logo>
          <LogoIcon>📍🤣</LogoIcon>
          Benchmarking-Places
        </Logo>
        <NavLink href="/BenchmarkingPlaces">Home</NavLink>

      </Header> */}
      
      <Main>
      <ReloadButton onClick={handleReloadClick}>Reload</ReloadButton> {/* Reload Button */}
        <SearchBar
          type="text"
          placeholder="Search locations, landmarks, or addresses"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            // Optionally, you can debounce this to reduce unnecessary renders
          }}
        />
        
        <PlacesGrid>
          {filteredPlaces.map((place, index) => (
            <PlaceCard key={index} onClick={() => handlePlaceClick(place.placeName)}>
              <PlaceImage src={place.imageUrl} alt={place.placeName} />
              <PlaceName>{place.placeName}</PlaceName>
              <PlaceLocation>{place.location}</PlaceLocation>
            </PlaceCard>
          ))}
        </PlacesGrid>
      </Main>
    </AppContainer>
  );
};



export default Reportgenerationpage;