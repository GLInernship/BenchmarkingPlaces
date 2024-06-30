import styled from 'styled-components';

export const AppContainer = styled.div`
  font-family: Arial, sans-serif;
  max-width: 1200px;
  max-height: 100vh;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
`;

export const ReloadButton = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin: auto;
  width: 100px;
  position: absolute;
  right: 520px;
  top: 70px;
`;

export const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background-color: red;
`;

export const Logo = styled.div`
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  background-color: blue;
`;

export const LogoIcon = styled.span`
  font-size: 24px;
  margin-right: 8px;
`;

export const NavLink = styled.a`
  text-decoration: none;
  color: #000;
  padding: 8px 16px;
  background-color: green;
`;

export const Main = styled.main`
  padding: 50px;
`;

export const SearchBar = styled.input`
  width: 90%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 20px;
  background-color: yellow;
`;

export const FilterContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
`;

export const FilterGroup = styled.div`
  display: flex;
  align-items: center;
`;

export const FilterLabel = styled.label`
  margin-right: 8px;
`;

export const FilterSelect = styled.select`
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

export const PlacesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
`;

export const PlaceCard = styled.div`
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
`;

export const PlaceImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
`;

export const PlaceName = styled.h3`
  margin: 10px;
  font-size: 18px;
`;

export const PlaceLocation = styled.p`
  margin: 10px;
  color: #666;
`;