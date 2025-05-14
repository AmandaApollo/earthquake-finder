"use server"

import type { Earthquake, LocationDetails } from "@/components/earthquake-search"

// Function to search earthquakes by coordinates
export async function searchEarthquakes(
  latitude: number,
  longitude: number,
  maxRadius: number,
  limit = 20,
): Promise<Earthquake[]> {
  try {
    // Build USGS Earthquake API URL
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${latitude}&longitude=${longitude}&maxradius=${maxRadius}&limit=${limit}`

    // Fetch earthquake data
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`USGS API error: ${response.statusText}`)
    }

    const data = await response.json()
    const earthquakes = data.features as Earthquake[]

    // Get location details for each earthquake
    const earthquakesWithLocation = await Promise.all(
      earthquakes.map(async (quake) => {
        try {
          // Get location details from Nominatim
          const locationDetails = await getLocationDetails(
            quake.geometry.coordinates[1], // latitude
            quake.geometry.coordinates[0], // longitude
          )

          // Add location details to earthquake properties
          return {
            ...quake,
            properties: {
              ...quake.properties,
              locationDetails: locationDetails ?? undefined,
            },
          }
        } catch (error) {
          console.error(`Error getting location details for earthquake ${quake.id}:`, error)
          return quake
        }
      }),
    )

    // Log the first earthquake with location details for debugging
    if (earthquakesWithLocation.length > 0) {
      console.log(
        "First earthquake with location details:",
        JSON.stringify(
          {
            id: earthquakesWithLocation[0].id,
            hasLocationDetails: !!earthquakesWithLocation[0].properties.locationDetails,
            locationDetails: earthquakesWithLocation[0].properties.locationDetails,
          },
          null,
          2,
        ),
      )
    }

    return earthquakesWithLocation
  } catch (error) {
    console.error("Error fetching earthquake data:", error)
    return []
  }
}

// Function to search earthquakes by place name
export async function searchByPlace(
  place: string,
  maxRadius: number,
  limit = 20,
): Promise<{ latitude: number; longitude: number; earthquakes: Earthquake[] } | null> {
  try {
    // First, geocode the place to get coordinates
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`

    const geocodeResponse = await fetch(geocodeUrl, {
      headers: {
        "User-Agent": "EarthquakeSearchApp/1.0",
      },
    })

    if (!geocodeResponse.ok) {
      throw new Error(`Nominatim API error: ${geocodeResponse.statusText}`)
    }

    const geocodeData = await geocodeResponse.json()

    if (!geocodeData || geocodeData.length === 0) {
      throw new Error("Location not found")
    }

    const location = geocodeData[0]
    const latitude = Number.parseFloat(location.lat)
    const longitude = Number.parseFloat(location.lon)

    // Then search for earthquakes using the coordinates
    const earthquakes = await searchEarthquakes(latitude, longitude, maxRadius, limit)

    return {
      latitude,
      longitude,
      earthquakes,
    }
  } catch (error) {
    console.error("Error searching by place:", error)
    return null
  }
}

// Function to get location details from Nominatim
async function getLocationDetails(latitude: number, longitude: number): Promise<LocationDetails | null> {
  try {
    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "EarthquakeSearchApp/1.0",
      },
      // Ensure we don't cache the response
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()

    // Log the response for debugging
    console.log(
      `Location details for ${latitude},${longitude}:`,
      JSON.stringify(
        {
          display_name: data.display_name,
          has_address: !!data.address,
          address_keys: data.address ? Object.keys(data.address) : [],
        },
        null,
        2,
      ),
    )

    return {
      display_name: data.display_name,
      address: data.address,
      lat: data.lat,
      lon: data.lon,
    }
  } catch (error) {
    console.error("Error getting location details:", error)
    return null
  }
}
