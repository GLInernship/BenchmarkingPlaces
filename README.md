# Benchmarking Places

## Description
Benchmarking Places is a React-based web application that allows users to search for places, divide them into grid sections, and perform nearby searches for points of interest. It integrates with Google Maps API for place searching and visualization.

## Features
- Search for places using Google Maps API
- Divide selected areas into customizable grid sections
- Generate random latitude and longitude points within grid sections
- Perform nearby searches for various place types
- Visualize search results and grid divisions on an interactive map
- Generate and view reports of recent searches

## Installation
1. Clone the repository
2. Run `npm install` to install dependencies
3. Create a `.env` file and add your Google Maps API key:

4. Run `npm start` to start the development server

## Usage
1. Navigate to the main page
2. Search for a place using the search bar
3. Set the number of rows and columns for grid division
4. Specify the number of random (lat, lng) points to generate
5. Select a place type for nearby search
6. Set the search radius and result limit
7. Click "Enter" to generate the grid
8. Use "Nearby Search" to find points of interest
9. View results and visualizations on subsequent pages

## Components
- `Map`: Main component for place search and grid generation
- `NearbySearchPage`: Handles nearby search functionality
- `ResultPage`: Displays search results
- `VisualizationPage`: Provides data visualizations
- `Reportgenerationpage`: Shows recent search reports
- `PlaceDetailsPage`: Displays detailed information about a specific place

## Context
The application uses `GridContext` to manage and share state across components.

## Routing
React Router is used for navigation between different pages of the application.

## API Integration
- Google Maps API for place search and map visualization
- Custom backend API for storing and retrieving grid data and search results

## Styling
The application uses custom styled components for a consistent and responsive design.

## Contributing
Contributions to improve Benchmarking Places are welcome. Please follow these steps:
1. Fork the repository
2. Create a new branch
3. Make your changes and commit them
4. Push to your fork and submit a pull request


### Contributors
- Developed by -
- Nihal saran das duggirala - nihal.saran@globallogic.com
- Aashi Chaudhary- aashi.chaudhary@globallogic.com
- Insha Khan - insha.khan@globallogic.com
- Muskan Arya - muskan.arya@globallogic.com
- Sajal Satsangi - sajal.satsangi@globallogic.com
- N Shikhar - nakirekanti.shikhar@globallogic.com


### License
