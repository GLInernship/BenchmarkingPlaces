import React from 'react'
import hereLogo from './hereMaps.png';

interface HeaderProps {
    isMapPage: boolean;
  }
  
function Header({isMapPage}: HeaderProps) {
    return (
        <nav className='header'>
            <p>Benchmarking Places</p>
            <div className='search-container'>
                {!isMapPage && <input
                    type="text"
                    placeholder="Search for a place"
                    className='search-input'
                    required
                />}
            </div>
            <img src={hereLogo} className='img' alt="here" />
        </nav>
    )
}

export default Header