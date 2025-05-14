"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { searchEarthquakes, searchByPlace } from "@/app/actions"
import { Loader2, ChevronDown, ChevronUp, MapPin, Info } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Dynamically import the Map component to avoid SSR issues with Leaflet
const EarthquakeMap = dynamic(() => import("@/components/earthquake-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full flex items-center justify-center bg-muted">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
})

export type Earthquake = {
  id: string
  properties: {
    mag: number
    place: string
    time: number
    url: string
    title: string
    tsunami: number
    type: string
    locationDetails?: LocationDetails
  }
  geometry: {
    coordinates: [number, number, number] // [longitude, latitude, depth]
  }
}

export type LocationDetails = {
  display_name?: string
  address?: {
    road?: string
    city?: string
    county?: string
    state?: string
    country?: string
    postcode?: string
    [key: string]: string | undefined
  }
  lat?: string
  lon?: string
}

export default function EarthquakeSearch() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get initial values from URL if they exist
  const initialLat = searchParams.get("lat") ? Number.parseFloat(searchParams.get("lat")!) : 37.7749
  const initialLng = searchParams.get("lng") ? Number.parseFloat(searchParams.get("lng")!) : -122.4194
  const initialRadius = searchParams.get("radius") ? Number.parseFloat(searchParams.get("radius")!) : 10
  const initialPlace = searchParams.get("place") || ""

  const [latitude, setLatitude] = useState<number>(initialLat)
  const [longitude, setLongitude] = useState<number>(initialLng)
  const [maxRadius, setMaxRadius] = useState<number>(initialRadius)
  const [limit, setLimit] = useState<number>(20)
  const [place, setPlace] = useState<string>(initialPlace)
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hasSearched, setHasSearched] = useState<boolean>(false)
  const [searchTab, setSearchTab] = useState<string>(initialPlace ? "place" : "coordinates")
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  // Handle map click to update coordinates
  const handleMapClick = (lat: number, lng: number) => {
    setLatitude(lat)
    setLongitude(lng)
    setSearchTab("coordinates")
  }

  // Toggle card expansion
  const toggleCardExpansion = (id: string) => {
    console.log("Toggling card:", id, "Current state:", expandedCards[id])
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Handle form submission for coordinate search
  const handleCoordinateSearch = async () => {
    setIsLoading(true)

    try {
      // Update URL with search parameters
      const params = new URLSearchParams()
      params.set("lat", latitude.toString())
      params.set("lng", longitude.toString())
      params.set("radius", maxRadius.toString())
      params.set("limit", limit.toString())
      router.push(`/?${params.toString()}`, { scroll: false })

      // Call server action to fetch earthquake data
      const data = await searchEarthquakes(latitude, longitude, maxRadius, limit)
      console.log("Received earthquakes:", data.length)
      console.log("First earthquake:", data[0]?.id, "Has location details:", !!data[0]?.properties.locationDetails)
      setEarthquakes(data)
      setHasSearched(true)
    } catch (error) {
      console.error("Error searching for earthquakes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form submission for place search
  const handlePlaceSearch = async () => {
    if (!place.trim()) return

    setIsLoading(true)

    try {
      // Update URL with search parameters
      const params = new URLSearchParams()
      params.set("place", place)
      params.set("radius", maxRadius.toString())
      params.set("limit", limit.toString())
      router.push(`/?${params.toString()}`, { scroll: false })

      // Call server action to fetch earthquake data by place
      const result = await searchByPlace(place, maxRadius, limit)

      if (result) {
        setLatitude(result.latitude)
        setLongitude(result.longitude)
        setEarthquakes(result.earthquakes)
        setHasSearched(true)
      }
    } catch (error) {
      console.error("Error searching for place:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search based on active tab
  const handleSearch = () => {
    if (searchTab === "coordinates") {
      handleCoordinateSearch()
    } else {
      handlePlaceSearch()
    }
  }

  // Reset search
  const handleReset = () => {
    setLatitude(37.7749)
    setLongitude(-122.4194)
    setMaxRadius(10)
    setLimit(20)
    setPlace("")
    setEarthquakes([])
    setHasSearched(false)
    setExpandedCards({})
    router.push("/")
  }

  // Log when expandedCards changes
  useEffect(() => {
    console.log("Expanded cards state:", expandedCards)
  }, [expandedCards])

  return (
    <div className="space-y-6">
      <Tabs value={searchTab} onValueChange={setSearchTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="coordinates">Search by Coordinates</TabsTrigger>
          <TabsTrigger value="place">Search by Place</TabsTrigger>
        </TabsList>

        <TabsContent value="coordinates" className="space-y-4 mt-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(Number.parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(Number.parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="radius">Max Radius (km)</Label>
              <Input
                id="radius"
                type="number"
                min="1"
                max="1000"
                value={maxRadius}
                onChange={(e) => setMaxRadius(Number.parseFloat(e.target.value) || 10)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Result Limit</Label>
              <Input
                id="limit"
                type="number"
                min="1"
                max="20"
                value={limit}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value)
                  setLimit(Math.min(Math.max(value || 1, 1), 20))
                }}
              />
              <p className="text-xs text-muted-foreground">Max: 20 earthquakes</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="place" className="space-y-4 mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="place">Place or Address</Label>
              <Input
                id="place"
                type="text"
                placeholder="Enter city, address, landmark, etc."
                value={place}
                onChange={(e) => setPlace(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="place-radius">Max Radius (km)</Label>
              <Input
                id="place-radius"
                type="number"
                min="1"
                max="1000"
                value={maxRadius}
                onChange={(e) => setMaxRadius(Number.parseFloat(e.target.value) || 10)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="place-limit">Result Limit</Label>
              <Input
                id="place-limit"
                type="number"
                min="1"
                max="20"
                value={limit}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value)
                  setLimit(Math.min(Math.max(value || 1, 1), 20))
                }}
              />
              <p className="text-xs text-muted-foreground">Max: 20 earthquakes</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Button onClick={handleSearch} disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            "Search Earthquakes"
          )}
        </Button>

        {hasSearched && (
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>

      <div className="h-[400px] w-full rounded-md overflow-hidden border">
        <EarthquakeMap
          latitude={latitude}
          longitude={longitude}
          earthquakes={earthquakes}
          onMapClick={handleMapClick}
          radius={maxRadius}
        />
      </div>

      {hasSearched && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{earthquakes.length} Earthquakes Found</h2>

          {earthquakes.length > 0 ? (
            <div className="space-y-3">
              {earthquakes.map((quake) => {
                // Check if location details exist and have content
                const hasLocationDetails =
                  quake.properties.locationDetails &&
                  (quake.properties.locationDetails.display_name ||
                    (quake.properties.locationDetails.address &&
                      Object.keys(quake.properties.locationDetails.address).length > 0))

                return (
                  <Card key={quake.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{quake.properties.place}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(quake.properties.time).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-white ${
                              quake.properties.mag >= 5
                                ? "bg-red-500"
                                : quake.properties.mag >= 3
                                  ? "bg-orange-500"
                                  : "bg-green-500"
                            }`}
                          >
                            Magnitude {quake.properties.mag.toFixed(1)}
                          </span>
                          {quake.properties.tsunami === 1 && (
                            <span className="block mt-1 text-xs text-red-500 font-semibold">Tsunami Alert</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-sm flex justify-between items-center">
                        <div>
                          <p>Depth: {quake.geometry.coordinates[2].toFixed(1)} km</p>
                          <a
                            href={quake.properties.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View details on USGS
                          </a>
                        </div>

                        {hasLocationDetails ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-8 w-8"
                            onClick={() => toggleCardExpansion(quake.id)}
                          >
                            {expandedCards[quake.id] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Info className="h-3 w-3 mr-1" />
                            No location details
                          </div>
                        )}
                      </div>

                      {hasLocationDetails && expandedCards[quake.id] && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <h4 className="font-medium text-sm">Location Details</h4>
                                <p className="text-sm text-muted-foreground">
                                  {quake.properties.locationDetails?.display_name}
                                </p>
                              </div>
                            </div>

                            {quake.properties.locationDetails?.address &&
                              Object.keys(quake.properties.locationDetails.address).length > 0 && (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                                  {Object.entries(quake.properties.locationDetails.address).map(
                                    ([key, value]) =>
                                      value && (
                                        <div key={key} className="flex justify-between">
                                          <span className="font-medium capitalize">{key.replace("_", " ")}:</span>
                                          <span>{value}</span>
                                        </div>
                                      ),
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              No earthquakes found in this area. Try increasing the radius or searching in a different location.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
