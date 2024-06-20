## Nearby Places Comparison Tool

### Overview

This web application utilizes Google Maps API and HERE Geocoding & Reverse Geocoding API to compare and display nearby places based on user input. It allows users to search for a location or select a place type to find nearby places of interest. The tool fetches data from both Google Maps and HERE WeGo APIs, compares the coordinates and names of places, and calculates the distance between them.

### Features

- **Search Functionality:** Users can search for a location using autocomplete from Google Maps API.
- **Place Type Filtering:** Users can filter nearby places by selecting a specific type (e.g., restaurants, parks).
- **Comparison Table:** Displays a table comparing Google Maps and HERE WeGo data for each nearby place:
  - Place name and vicinity
  - Google Maps coordinates
  - HERE WeGo place name
  - HERE WeGo coordinates
  - Coordinate difference between Google Maps and HERE WeGo (in kilometers)
- **CSV Export:** Allows users to download the comparison data in CSV format for further analysis.

### How to Use

1. **Initial Setup:**
   - Ensure `config.json` file is correctly configured with your Google API key and HERE API key.

2. **Loading the Application:**
   - On page load, the application fetches API keys from `config.json` and initializes the Google Maps API with the specified libraries (`places`).

3. **Search Functionality:**
   - Users can search for a location using the search input field. Autocomplete suggestions are provided by Google Maps API.
   - Upon selecting a place from the autocomplete suggestions, the map centers on the selected location and triggers a search for nearby places based on the selected place type (if provided).

4. **Comparison Table:**
   - For each nearby place found using Google Maps API, the tool fetches corresponding data from HERE WeGo API:
     - HERE WeGo place name
     - HERE WeGo coordinates
     - Calculates the distance between Google Maps and HERE WeGo coordinates.
   - Displays this data in a table format.

5. **CSV Export:**
   - Users can download the comparison data (from the table) in CSV format by clicking the "Download CSV" button.

### Libraries Used

- **Google Maps JavaScript API:** For displaying maps, geocoding, and places services.
- **HERE Geocoding & Reverse Geocoding API:** For fetching HERE WeGo place names and coordinates based on Google Maps place data.

### Notes

- The application assumes a valid `config.json` file with correct API keys for Google Maps and HERE.
- Ensure proper network connectivity for API calls to function correctly.
- Coordinate differences are calculated using the Haversine formula and are rounded to two decimal places for clarity.

### Contributors

- Developed by -
- Sajal Satsangi - sajal.satsangi@globallogic.com
- N Shikhar - nakirekanti.shikhar@globallogic.com
- Nihal saran das duggirala - nihal.saran@globallogic.com
- Muskan Arya - muskan.arya@globallogic.com
- Insha Khan - insha.khan@globallogic.com
- Aashi Chaudhary- aashi.chaudhary@globallogic.com

### License
