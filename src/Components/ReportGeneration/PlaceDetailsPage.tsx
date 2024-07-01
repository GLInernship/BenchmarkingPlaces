import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import Header from '../Header';
import axios from 'axios';
import styled from 'styled-components';
import { API_URL } from '../../constants';

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
  height: 80px
`;

const TableCell = styled.td`
  border: 1px solid black;
  padding: 0;
  vertical-align: top;
  height: 80px;
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
  height: 80px;
`;

const InnerTableCell = styled.td`
  border: 1px solid black;
  padding: 4px;
  height: 85px;
`;

const Button = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  margin-bottom: 5px;
  background: linear-gradient(to bottom, #A8DEC6 12%, #E0E1A7 100%);
  border-radius: 20px;
`;

const CostomRow = styled.tr<{ $primary?: boolean; $canBeRed?: boolean; }>`
  background: ${props => props.$canBeRed ? "#BF4F74" : "white"};
  color: ${props => props.$canBeRed ? "white" : "green"};
`;

interface PlaceDetails {
  placeName: string;
  placeType: {
    label: string;
    googleValue: string;
    hereValue: string;
  };
  results: Array<{
    subRegion: number;
    latLng: { lat: number; lng: number };
    googlePlaces: Array<{
      index: number;
      types: string[];
      name: string;
      formatted_address: string;
      lat: number;
      lng: number;
    }>;
    hereBasedOnGoogle: Array<{
      index: number;
      name: string;
      lat: number;
      lng: number;
      matchesGoogle: boolean;
      neededStreetSimilary: boolean;
      neededDistanceMatch: boolean;
      neededNameSimilarity: boolean;
      address: string;
      categoryHereType: string;
    }>;
    herePlaces: Array<{
      index: number;
      categoryType: string;
      name: string;
      address: string;
      lat: number;
      lng: number;
    }>;
    googleBasedOnHere: Array<{
      index: number;
      name: string;
      lat: number;
      lng: number;
    }>;
  }>;
}


const PlaceDetailsPage: React.FC = () => {
  const location = useLocation();
  const { placeName } = useParams<{ placeName: string }>();
  const passedPlaceName = location.state?.placeName || placeName;
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [matchingData, setMatchingData] = useState<{
    matches: number,
    nonMatches: number,
    neededStreetSimilarity: number,
    notNeededStreetSimilarity: number,
    neededDistanceSimilarity: number,
    notNeededDistanceSimilarity: number,
    neededNameSimilarity: number,
    notNeededNameSimilarity: number
  }>({ matches: 0, nonMatches: 0, neededStreetSimilarity: 0, notNeededStreetSimilarity: 0, neededDistanceSimilarity: 0, notNeededDistanceSimilarity: 0, neededNameSimilarity: 0, notNeededNameSimilarity: 0 });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/place/${passedPlaceName}`);
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
    let neededStreetSimilarity = 0;
    let notNeededStreetSimilarity = 0;
    let neededDistanceSimilarity = 0;
    let notNeededDistanceSimilarity = 0;
    let neededNameSimilarity = 0;
    let notNeededNameSimilarity = 0;

    details.results.forEach(result => {
      result.hereBasedOnGoogle.forEach(place => {
        if (place.matchesGoogle) {
          matches++;
        } else {
          nonMatches++;
        }
        if (place.neededStreetSimilary) {
          neededStreetSimilarity++;
        } else {
          notNeededStreetSimilarity++;
        }
        if (place.neededDistanceMatch) {
          neededDistanceSimilarity++;
        } else {
          notNeededDistanceSimilarity++;
        }
        if (place.neededNameSimilarity) {
          neededNameSimilarity++;
        } else {
          notNeededNameSimilarity++;
        }
      });
    });

    return { matches, nonMatches, neededStreetSimilarity, notNeededStreetSimilarity, neededDistanceSimilarity, notNeededDistanceSimilarity, neededNameSimilarity, notNeededNameSimilarity };
  };

  const navigateToVisualization_GoogleMatches = () => {
    const nonMatchingDetails = placeDetails?.results.flatMap(result =>
      result.hereBasedOnGoogle.filter(place => !place.matchesGoogle).map(place => ({
        ...place,
        googlePlace: result.googlePlaces.find(gp => gp.index === place.index)
      }))
    );
    navigate('/visualizationmatchesgoogle', {
      state: {
        matchingData,
        nonMatchingDetails
      }
    });
  };

  const navigateToVisualization_StreetSimilarity = () => {
    const neededStreetSimilarityDetails = placeDetails?.results.flatMap(result =>
      result.hereBasedOnGoogle.filter(place => place.neededStreetSimilary).map(place => ({
        ...place,
        googlePlace: result.googlePlaces.find(gp => gp.index === place.index)
      }))
    );
    const notNeededStreetSimilarityDetails = placeDetails?.results.flatMap(result =>
      result.hereBasedOnGoogle.filter(place => !place.neededStreetSimilary).map(place => ({
        ...place,
        googlePlace: result.googlePlaces.find(gp => gp.index === place.index)
      }))
    );
    navigate('/visualizationstreet', {
      state: {
        neededStreetSimilarity: matchingData.neededStreetSimilarity,
        notNeededStreetSimilarity: matchingData.notNeededStreetSimilarity,
        neededStreetSimilarityDetails,
        notNeededStreetSimilarityDetails
      }
    });
  };

  const navigateToVisualization_DistanceSimilarity = () => {
    const neededDistanceDetails = placeDetails?.results.flatMap(result =>
      result.hereBasedOnGoogle.filter(place => place.neededDistanceMatch).map(place => ({
        ...place,
        googlePlace: result.googlePlaces.find(gp => gp.index === place.index)
      }))
    );
    const notNeededDistanceDetails = placeDetails?.results.flatMap(result =>
      result.hereBasedOnGoogle.filter(place => !place.neededDistanceMatch).map(place => ({
        ...place,
        googlePlace: result.googlePlaces.find(gp => gp.index === place.index)
      }))
    );
    navigate('/visualizationdistance', {
      state: {
        neededDistanceSimilarity: matchingData.neededDistanceSimilarity,
        notNeededDistanceSimilarity: matchingData.notNeededDistanceSimilarity,
        neededDistanceDetails,
        notNeededDistanceDetails
      }
    });
  };

  const navigateToVisualization_NameSimilarity = () => {
    const neededNameDetails = placeDetails?.results.flatMap(result =>
      result.hereBasedOnGoogle.filter(place => place.neededNameSimilarity).map(place => ({
        ...place,
        googlePlace: result.googlePlaces.find(gp => gp.index === place.index)
      }))
    );
    const notNeededNameDetails = placeDetails?.results.flatMap(result =>
      result.hereBasedOnGoogle.filter(place => !place.neededNameSimilarity).map(place => ({
        ...place,
        googlePlace: result.googlePlaces.find(gp => gp.index === place.index)
      }))
    );
    navigate('/visualizationname', {
      state: {
        neededNameSimilarity: matchingData.neededNameSimilarity,
        notNeededNameSimilarity: matchingData.notNeededNameSimilarity,
        neededNameDetails,
        notNeededNameDetails
      }
    });
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
      <Button onClick={navigateToVisualization_GoogleMatches}>
        Matching Data
      </Button>
      <Button onClick={navigateToVisualization_StreetSimilarity}>
        Street Similarity Visualization
      </Button>
      <Button onClick={navigateToVisualization_DistanceSimilarity}>
        Distance Visualization
      </Button>
      <Button onClick={navigateToVisualization_NameSimilarity}>
        Name Visualization
      </Button>

      {placeDetails?.results && placeDetails.results.length > 0 ? (
        <StyledTable>
          <thead>
            <tr>
              <TableHeader>Sub-Region</TableHeader>
              <TableHeader>LAT-LNG Coordinates</TableHeader>
              <TableHeader>Google Places API Results</TableHeader>
              <TableHeader>HERE API Results Based on Google Results</TableHeader>
              {/* <TableHeader>HERE API Results</TableHeader>
              <TableHeader>Google API Results Based on HERE Results</TableHeader> */}
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
                        <InnerTableHeader>Index</InnerTableHeader>
                        <InnerTableHeader>Name</InnerTableHeader>
                        <InnerTableHeader>Type</InnerTableHeader>
                        <InnerTableHeader>Address</InnerTableHeader>
                        <InnerTableHeader>Coordinates</InnerTableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {result.googlePlaces.map((place) => (
                        <tr key={place.index}>
                          <InnerTableCell>{place.index}</InnerTableCell>
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
                        <InnerTableHeader>Index</InnerTableHeader>
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
                      {result.hereBasedOnGoogle.map((place) => (
                        <tr key={place.index}>
                          <InnerTableCell>{place.index}</InnerTableCell>
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
                {/* <TableCell>
                  <InnerTable>
                    <thead>
                      <tr>
                      <InnerTableHeader>Index</InnerTableHeader>
                        <InnerTableHeader>Name</InnerTableHeader>
                        <InnerTableHeader>Type</InnerTableHeader>
                        <InnerTableHeader>Address</InnerTableHeader>
                        <InnerTableHeader>Coordinates</InnerTableHeader>
                      </tr>
                    </thead>
                    <tbody>
                     {result.herePlaces.map((place) => (
                        <tr key={place.index}>
                          <InnerTableCell>{place.index}</InnerTableCell>
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
                         <InnerTableHeader>Index</InnerTableHeader>
                        <InnerTableHeader>Name</InnerTableHeader>
                        <InnerTableHeader>Coordinates</InnerTableHeader>
                      </tr>
                    </thead>
                    <tbody>
                       {result.googleBasedOnHere.map((place) => (
                        <tr key={place.index}>
                          <InnerTableCell>{place.index}</InnerTableCell>
                          <InnerTableCell>{place.name}</InnerTableCell>
                          <InnerTableCell>({place.lat.toFixed(6)}, {place.lng.toFixed(6)})</InnerTableCell>
                        </tr>
                      ))}
                    </tbody>
                  </InnerTable>
                </TableCell> */}
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