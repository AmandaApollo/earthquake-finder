"use server";

import type { Earthquake } from "@/components/earthquake-search";

// Function to search earthquakes by coordinates
export async function searchEarthquakes(
  latitude: number,
  longitude: number,
  maxRadius: number,
  limit = 20
): Promise<Earthquake[]> {
  try {
    // Build USGS Earthquake API URL
    // const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${latitude}&longitude=${longitude}&maxradius=${maxRadius}&limit=${limit}`;

    // // Fetch earthquake data
    // const response = await fetch(url);

    // if (!response.ok) {
    //   throw new Error(`USGS API error: ${response.statusText}`);
    // }

    // const data = await response.json();
    // const earthquakes = data.features as Earthquake[];

    // // Get location details for each earthquake
    // const earthquakesWithLocation = await Promise.all(
    //   earthquakes.map(async (quake) => {
    //     try {
    //       // Get location details from Nominatim
    //       const locationDetails = await getLocationDetails(
    //         quake.geometry.coordinates[1], // latitude
    //         quake.geometry.coordinates[0] // longitude
    //       );

    //       // Add location details to earthquake properties
    //       return {
    //         ...quake,
    //         locationDetails: locationDetails ?? undefined,
    //       };
    //     } catch (error) {
    //       console.error(
    //         `Error getting location details for earthquake ${quake.id}:`,
    //         error
    //       );
    //       return quake;
    //     }
    //   })
    // );

    // // Log the first earthquake with location details for debugging
    // if (earthquakesWithLocation.length > 0) {
    //   console.log(
    //     "First earthquake with location details:",
    //     JSON.stringify(
    //       {
    //         id: earthquakesWithLocation[0].id,
    //         hasLocationDetails:
    //           !!earthquakesWithLocation[0].locationDetails,
    //         locationDetails:
    //           earthquakesWithLocation[0].locationDetails,
    //       },
    //       null,
    //       2
    //     )
    //   );
    // }

    // return earthquakesWithLocation;

    //graphql rest connector version - to run this you will need to use the schema associated with this query and have apollo router running locally
    const query = `
    query RecentEarthquakes($limit: Int!, $lat: String!, $lon: String!, $maxRadius: Int!) {
      recentEarthquakes(limit: $limit, lat: $lat, lon: $lon, maxRadius: $maxRadius) {
        id
        locationDetails: display_name
        properties {
          mag
          place
          time
          updated
          url
          title
        }
        geometry {
          coordinates
        }
      }
    }
  `;

    const variables = {
      limit,
      maxRadius,
      lat: latitude.toString(),
      lon: longitude.toString(),
    };

    const response = await fetch("http://localhost:4000/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
    if (!response.ok) {
      throw new Error(`GraphQL API error: ${response.statusText}`);
    }

    const { data } = await response.json();

    const earthquakes = data.recentEarthquakes ?? [];
    console.log(earthquakes);
    return earthquakes;
  } catch (error) {
    console.error("Error fetching earthquake data:", error);
    return [];
  }
}

// Function to search earthquakes by place name
export async function searchByPlace(
  place: string,
  maxRadius: number,
  limit = 20
): Promise<{
  latitude: number;
  longitude: number;
  earthquakes: Earthquake[];
} | null> {
  try {
    // First, geocode the place to get coordinates
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      place
    )}&limit=1`;

    const geocodeResponse = await fetch(geocodeUrl, {
      headers: {
        "User-Agent": "EarthquakeSearchApp/1.0",
      },
    });

    if (!geocodeResponse.ok) {
      throw new Error(`Nominatim API error: ${geocodeResponse.statusText}`);
    }

    const geocodeData = await geocodeResponse.json();

    if (!geocodeData || geocodeData.length === 0) {
      throw new Error("Location not found");
    }

    const location = geocodeData[0];
    const latitude = Number.parseFloat(location.lat);
    const longitude = Number.parseFloat(location.lon);

    // Then search for earthquakes using the coordinates
    const earthquakes = await searchEarthquakes(
      latitude,
      longitude,
      maxRadius,
      limit
    );

    return {
      latitude,
      longitude,
      earthquakes,
    };
  } catch (error) {
    console.error("Error searching by place:", error);
    return null;
  }
}

// Function to get location details from Nominatim - commented out when using graphql version
// async function getLocationDetails(
//   latitude: number,
//   longitude: number
// ): Promise<string | null> {
//   try {
//     // Add a small delay to avoid rate limiting
//     await new Promise((resolve) => setTimeout(resolve, 100));

//     const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

//     const response = await fetch(url, {
//       headers: {
//         "User-Agent": "EarthquakeSearchApp/1.0",
//       },
//       // Ensure we don't cache the response
//       cache: "no-store",
//     });

//     if (!response.ok) {
//       console.error(
//         `Nominatim API error: ${response.status} ${response.statusText}`
//       );
//       return null;
//     }

//     const data = await response.json();

//     // Log the response for debugging
//     console.log(
//       `Location details for ${latitude},${longitude}:`,
//       JSON.stringify({ display_name: data.display_name }, null, 2)
//     );

//     return data.display_name ?? null;
//   } catch (error) {
//     console.error("Error getting location details:", error);
//     return null;
//   }
// }
