import React from 'react'
import hereLogo from './hereMaps.png';

function Header({ref:<HTMLInputElement>, isInput}) {
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