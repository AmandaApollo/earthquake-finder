# earthquake-finder

![GIF of earthquake finder app](https://github.com/AmandaApollo/earthquake-finder/blob/main/map.gif)

A web application to search and visualize recent earthquakes on an interactive map.  
Users can search by coordinates or place name, view earthquake details, and see contextual location information.

This application was primarily generated using v0 and intended to be used as a demo application, not production ready. 

For a full tutorial of this application including how to utilize REST connectors, [head to the blog](https://www.apollographql.com/blog/simplify-your-rest-api-logic-in-react-with-connectors-for-rest-apis-and-graphql).

## Features

- Search for earthquakes by coordinates or place name
- Interactive map using [Leaflet](https://leafletjs.com/)
- Earthquake data from [USGS Earthquake API](https://earthquake.usgs.gov/fdsnws/event/1/)
- Reverse geocoding with [Nominatim](https://nominatim.openstreetmap.org/)
- Earthquake markers sized and colored by magnitude
- Popup details for each earthquake, including location, magnitude, time, depth, and tsunami alerts

## Getting Started

### Prerequisites

- Node.js (18+ recommended)
- npm or pnpm

### Installation

1. Clone the repository:
 
2. Install dependencies:
   ```sh
   npm install
   # or
   pnpm install
   ```

3. (Optional) Install Leaflet types for TypeScript - this will resolve errors on Leaflet, but the application will run and work without it:
   ```sh
   npm install --save-dev @types/leaflet
   ```

### Running the App

```sh
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/components/earthquake-map.tsx` — React component for the interactive Leaflet map
- `/app/actions.ts` — Server actions for fetching and enriching earthquake data
- `/components/earthquake-search.ts` — (Type definitions and search logic)

## API Usage

- **USGS Earthquake API**: Fetches earthquake data based on coordinates and radius.
- **Nominatim**: Used for reverse geocoding (getting place names from coordinates).

## Notes

- The app uses a custom User-Agent for Nominatim requests as required by their usage policy.
- To avoid rate limiting, a small delay is added before each reverse geocoding request.

## License

MIT

---

**Made with ❤️ using React, TypeScript, and Leaflet.**
