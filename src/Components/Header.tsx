import React from 'react'
import hereLogo from './hereMaps.png';

interface HeaderProps {
    ref: React.RefObject<HTMLInputElement>; // Assuming ref is for an input element
    isInput: boolean;
  }
  
function Header({ref, isInput}: HeaderProps) {
    return (
        <nav className='header'>
            <p>Benchmarking Places</p>
            <div className='search-container'>
                {isInput && <input
                    type="text"
                    placeholder="Search for a place"
                    ref={ref}
                    className='search-input'
                    required
                />}
            </div>
            <img src={hereLogo} className='img' alt="here" />
        </nav>
    )
}

export default Header