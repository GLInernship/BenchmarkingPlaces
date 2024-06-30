import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import Header from '../Header';
import axios from 'axios';
import styled from 'styled-components';

// Styled components
// Styled components
const Container = styled.div`
  width: 100%;
  overflow-x: auto;
  zoom: 0.7;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

const TableHeader = styled.th`
  border: 1px solid black;
  padding: 8px;
  background-color: #f2f2f2;
  text-align: left;
`;

const TableCell = styled.td`
  border: 1px solid black;
  padding: 0;
  vertical-align: top;
`;

const InnerTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const InnerTableHeader = styled.th`
  border: 1px solid black;
  padding: 4px;
  background-color: #e6e6e6;
  text-align: left;
`;

const InnerTableCell = styled.td`
  border: 1px solid black;
  padding: 4px;
`;

const Button = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  margin-bottom: 5px;
`;

interface PlaceDetails {
  placeName: string;
  results: Array<{
    latLng: { lat: number; lng: number };
    subRegion: number;
    googlePlaces: Array<{
      types: string[];
      name: string;
      formatted_address: string;
      lat: number;
      lng: number;
    }>;
    hereBasedOnGoogle: Array<{
      name: string;
      lat: number;
      lng: number;
      matchesGoogle: boolean;
      neededStreetSimilary: boolean;
      neededDistanceMatch: boolean;
      neededNameSimilarity: boolean;
      address: string;
      categoryHereType : string;
    }>;
    herePlaces: Array<{
      categoryType: string;
      name: string;
      address: string;
      lat: number;
      lng: number;
    }>;
    googleBasedOnHere: Array<{
      name: string;
      lat: number;
      lng: number;
    } | null>;
  }>;
}

const PlaceDetailsPage: React.FC = () => {
  const location = useLocation();
  const { placeName } = useParams<{ placeName: string }>();
  const passedPlaceName = location.state?.placeName || placeName;
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [matchingData, setMatchingData] = useState<{ matches: number, nonMatches: number }>({ matches: 0, nonMatches: 0 });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        const response = await axios.get(`https://j5s9dm7w-9000.inc1.devtunnels.ms/api/place/${passedPlaceName}`);
        setPlaceDetails(response.data.placeDetails);
        const matchingData = calculateMatchingData(response.data.placeDetails);
        setMatchingData(matchingData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching place details:', error);
        setIsLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [passedPlaceName]);

  const calculateMatchingData = (details: PlaceDetails) => {
    let matches = 0;
    let nonMatches = 0;

    details.results.forEach(result => {
      result.hereBasedOnGoogle.forEach(place => {
        if (place.matchesGoogle) {
          matches++;
        } else {
          nonMatches++;
        }
      });
    });

    return { matches, nonMatches };
  };

  const navigateToVisualization = () => {
    navigate('/visualization', { state: { matchingData } });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!placeDetails) {
    return <div>No details found for this place.</div>;
  }

  return (
    <Container>
      <Header isMapPage={true} />
      <h1>Search Results</h1>
      <p>Place Name: {placeDetails?.placeName || 'N/A'}</p>
      <Button onClick={navigateToVisualization}>
        View Matching Data Visualization
      </Button>

      {placeDetails?.results && placeDetails.results.length > 0 ? (
        <StyledTable>
          <thead>
            <tr>
              <TableHeader>Sub-Region</TableHeader>
              <TableHeader>LAT-LNG Coordinates</TableHeader>
              <TableHeader>Google Places API Results</TableHeader>
              <TableHeader>HERE API Results Based on Google Results</TableHeader>
              <TableHeader>HERE API Results</TableHeader>
              <TableHeader>Google API Results Based on HERE Results</TableHeader>
            </tr>
          </thead>
          <tbody>
            {placeDetails.results.map((result, index) => (
              <tr key={index}>
                <TableCell>{result.subRegion}</TableCell>
                <TableCell>
                  ({result.latLng.lat.toFixed(6)}, {result.latLng.lng.toFixed(6)})
                </TableCell>
                <TableCell>
                  <InnerTable>
                    <thead>
                      <tr>
                        <InnerTableHeader>Name</InnerTableHeader>
                        <InnerTableHeader>Type</InnerTableHeader>
                        <InnerTableHeader>Address</InnerTableHeader>
                        <InnerTableHeader>Coordinates</InnerTableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {result.googlePlaces.map((place, placeIndex) => (
                        <tr key={placeIndex}>
                          <InnerTableCell>{place.name}</InnerTableCell>
                          <InnerTableCell>{place.types.join(', ')}</InnerTableCell>
                          <InnerTableCell>{place.formatted_address}</InnerTableCell>
                          <InnerTableCell>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</InnerTableCell>
                        </tr>
                      ))}
                    </tbody>
                  </InnerTable>
                </TableCell>
                <TableCell>
                  <InnerTable>
                    <thead>
                      <tr>
                        <InnerTableHeader>Name</InnerTableHeader>
                        <InnerTableHeader>Type</InnerTableHeader>
                        <InnerTableHeader>Address</InnerTableHeader>
                        <InnerTableHeader>Coordinates</InnerTableHeader>
                        <InnerTableHeader>Matches Google</InnerTableHeader>
                        <InnerTableHeader>Needed Street Similarity</InnerTableHeader>
                        <InnerTableHeader>Needed Distance Match</InnerTableHeader>
                        <InnerTableHeader>Needed Name Match</InnerTableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {result.hereBasedOnGoogle.map((place, placeIndex) => (
                        <tr key={placeIndex}>
                          <InnerTableCell>{place.name}</InnerTableCell>
                          <InnerTableCell>{place.categoryHereType}</InnerTableCell>
                          <InnerTableCell>{place.address}</InnerTableCell>
                          <InnerTableCell>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</InnerTableCell>
                          <InnerTableCell>{place.matchesGoogle ? 'Yes' : 'No'}</InnerTableCell>
                          <InnerTableCell>{place.neededStreetSimilary ? 'Yes' : 'No'}</InnerTableCell>
                          <InnerTableCell>{place.neededDistanceMatch ? 'Yes' : 'No'}</InnerTableCell>
                          <InnerTableCell>{place.neededNameSimilarity ? 'Yes' : 'No'}</InnerTableCell>
                        </tr>
                      ))}
                    </tbody>
                  </InnerTable>
                </TableCell>
                <TableCell>
                  <InnerTable>
                    <thead>
                      <tr>
                        <InnerTableHeader>Name</InnerTableHeader>
                        <InnerTableHeader>Type</InnerTableHeader>
                        <InnerTableHeader>Address</InnerTableHeader>
                        <InnerTableHeader>Coordinates</InnerTableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {result.herePlaces.map((place, placeIndex) => (
                        <tr key={placeIndex}>
                          <InnerTableCell>{place.name}</InnerTableCell>
                          <InnerTableCell>{place.categoryType}</InnerTableCell>
                          <InnerTableCell>{place.address}</InnerTableCell>
                          <InnerTableCell>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</InnerTableCell>
                        </tr>
                      ))}
                    </tbody>
                  </InnerTable>
                </TableCell>
                <TableCell>
                  <InnerTable>
                    <thead>
                      <tr>
                        <InnerTableHeader>Name</InnerTableHeader>
                        <InnerTableHeader>Coordinates</InnerTableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {result.googleBasedOnHere.map((place, placeIndex) => (
                        <tr key={placeIndex}>
                          <InnerTableCell>{place ? place.name : 'N/A'}</InnerTableCell>
                          <InnerTableCell>
                            {place ? `(${place.lat.toFixed(6)}, ${place.lng.toFixed(6)})` : 'N/A'}
                          </InnerTableCell>
                        </tr>
                      ))}
                    </tbody>
                  </InnerTable>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </StyledTable>
      ) : (
        <p>No results available</p>
      )}
    </Container>
  );
};

export default PlaceDetailsPage;