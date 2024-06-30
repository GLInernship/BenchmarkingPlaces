import React from 'react';
import styled from 'styled-components';
import hereLogo from './HERE_logo.svg.png';
import searchIcon from './search-bar-01.png'

interface HeaderProps {
  isMapPage: boolean;
}

const StyledNav = styled.nav`
  background: linear-gradient(to left, #A8DEC6 12%, #E0E1A7 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 18px;
`;

const StyledP = styled.p`
  order: 2;
  padding: 8px;
  color: #000000;
  font-size: 24px;
  font-family: "Noto Sans JP";
  font-weight: 700;
  margin-left: auto;
`;

const StyledImg = styled.img`
  order: 0;
  width: 85px;
  height: 85px;
  border-radius: 5%;
  margin-right: 50px;
`;

function Header({isMapPage}: HeaderProps) {
  return (
    <StyledNav>
      <StyledImg src={hereLogo} alt="here" />
      <div className='search-container'>
        {!isMapPage && (
          <div className="search-bar">
            <StyledImg src={searchIcon} alt="Search" className="search-icon" />
            <input
              type="text"
              placeholder="Search Place"
              className='search-input'
              required
            />
          </div>
        )}
      </div>
      <StyledP>Benchmarking Places</StyledP>
    </StyledNav>
  )
}

export default Header;