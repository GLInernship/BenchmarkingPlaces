import styled from 'styled-components';

export const MainContainer = styled.div`
  overflow-y: hidden;
`;

export const Header = styled.nav`
  background: linear-gradient(to left, #A8DEC6 12%, #E0E1A7 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 18px;

  p {
    order: 2;
    padding: 8px;
    color: #000000;
    font-size: 24px;
    font-family: "Noto Sans JP";
    font-weight: 700;
    margin-left: auto;
  }

  img {
    order: 0;
    width: 85px;
    height: 85px;
    border-radius: 5%;
    margin-right: 50px;
  }
`;

export const SearchContainer = styled.div`
  order: 1;
  margin: auto;
  margin-left: 425px;
  box-shadow: 10px 10px 10px rgba(3,3,3,0);
`;

export const SearchInput = styled.input`
  border: none;
  border-radius: 15px;
  width: 400px;
  padding: 0.8rem;
  padding-left: 35px;
`;

export const GridMap = styled.div`
  display: flex;
  flex-direction: row-reverse;
  height: 100%;
`;

export const MapContainer = styled.div`
  display: flex;
  width: 100%;
  background: linear-gradient(to right, rgba(152, 244, 202, 0.45) 12%, rgba(255, 255, 255, 0.45) 100%);
  box-shadow: 40px 40px 10px rgba(3,3,3,0);
`;

export const Sidebar = styled.div`
  width: 400px;
  background-color: rgb(255, 255, 255);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  box-shadow: 10px 10px 10px rgba(3,3,3,0);
`;

export const FormGroup = styled.div`
  input, select {
    width: 90%;
    padding: 0.5rem;
    margin-bottom: 42px;
    border-radius: 15px;
    border: 1px solid grey;
  }

  select {
    width: 95% !important;
    background: rgba(234, 235, 235, 0.65);
    box-shadow: 10px 10px 10px rgba(3,3,3,0);
  }
`;

export const ButtonGroup = styled.div`
  margin-top: 20%;
  margin-left: 8%;
`;

export const Button = styled.button`
  width: 45%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  background: linear-gradient(to bottom, #A8DEC6 12%, #E0E1A7 100%);
  color: rgb(0, 0, 0);
  border: none;
  cursor: pointer;
  border-radius: 15px;
  box-shadow: 10px 10px 10px rgba(3,3,3,0);
  outline: 0.5px solid #949292;
`;

export const Button2 = styled(Button)`
  width: 92%;
`;

export const RightSection = styled.div`
  height: 400px;
  margin-top: 20px;
`;

export const CoordinateContainer = styled.div`
  .coordinate {
    margin-left: 25px;
    font-family: noto sans jp, sans-serif;
    font-weight: bold;
    font-size: 18px;
    width: 500px;
  }
`;

export const BoundingBoxDetails = styled.div`
  margin-left: 10%;
  margin-top: 5%;
  overflow: scroll;
  overflow-x: hidden;
  height: 600px;

  .box-detail {
    font-weight: lighter;
    font-family: noto sans jp, sans-serif;
    font-size: 16px;
  }
`;

export const Label = styled.label`
  margin-left: 18px;
  margin-right: 5px;
  font-weight: bold;
`;

export const Input = styled.input`
  margin-right: 5px;
  width: 50px;
  border: 1px solid black;
  background: rgba(234, 235, 235, 0.65);
`;