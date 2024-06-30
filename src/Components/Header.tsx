import React from 'react';
import hereLogo from './HERE_logo.svg.png';
import searchIcon from './search-bar-01.png'; // Import the search icon
import '../Components/CSS/map.css';

interface HeaderProps {
  isMapPage: boolean;
}

function Header({isMapPage}: HeaderProps) {
  return (
    <nav className='header'>
      <img src={hereLogo} alt="here" />
      <div className='search-container'>
        {!isMapPage && (
          <div className="search-bar"> {/* Wrapper for search input and icon */}
            <img src={searchIcon} alt="Search" className="search-icon" /> {/* Search icon */}
            <input
              type="text"
              placeholder="Search Place" // Updated placeholder text
              className='search-input'
              required
            />
          </div>
        )}
      </div>
      <p>Benchmarking Places</p>
    </nav>
  )
}

export default Header;