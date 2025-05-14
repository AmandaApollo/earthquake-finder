"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Earthquake } from "./earthquake-search"

// Fix Leaflet icon issues
let DefaultIcon: L.Icon

// This function ensures Leaflet icons are properly set up
function fixLeafletIcons() {
  // Only run this once
  if (DefaultIcon) return

  // Delete the default icon first
  delete (L.Icon.Default.prototype as any)._getIconUrl

  // Set up the new icon paths
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  })

  // Create our default icon
  DefaultIcon = new L.Icon.Default() as L.Icon<L.IconOptions>
}

interface EarthquakeMapProps {
  latitude: number
  longitude: number
  earthquakes: Earthquake[]
  onMapClick: (lat: number, lng: number) => void
  radius: number
}

export default function EarthquakeMap({ latitude, longitude, earthquakes, onMapClick, radius }: EarthquakeMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const radiusCircleRef = useRef<L.Circle | null>(null)
  const centerMarkerRef = useRef<L.Marker | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      // Fix Leaflet icons before initializing the map
      fixLeafletIcons()

      const map = L.map("map").setView([latitude, longitude], 8)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      // Create layers for markers and circle
      markersLayerRef.current = L.layerGroup().addTo(map)

      // Add center marker
      centerMarkerRef.current = L.marker([latitude, longitude], {
        draggable: true,
      }).addTo(map)

      // Add radius circle
      radiusCircleRef.current = L.circle([latitude, longitude], {
        radius: radius * 1000, // Convert km to meters
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
      }).addTo(map)

      // Handle map click
      map.on("click", (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng)
      })

      // Handle marker drag
      centerMarkerRef.current.on("dragend", (e) => {
        const marker = e.target
        const position = marker.getLatLng()
        onMapClick(position.lat, position.lng)
      })

      mapRef.current = map
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update center marker and circle when coordinates change
  useEffect(() => {
    if (mapRef.current && centerMarkerRef.current && radiusCircleRef.current) {
      centerMarkerRef.current.setLatLng([latitude, longitude])
      radiusCircleRef.current.setLatLng([latitude, longitude])
      radiusCircleRef.current.setRadius(radius * 1000) // Convert km to meters

      // Center map on new coordinates
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom())
    }
  }, [latitude, longitude, radius])

  // Update earthquake markers when data changes
  useEffect(() => {
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers()

      earthquakes.forEach((quake) => {
        // Leaflet uses [lat, lng] but GeoJSON uses [lng, lat]
        const lat = quake.geometry.coordinates[1]
        const lng = quake.geometry.coordinates[0]
        const magnitude = quake.properties.mag

        // Size and color based on magnitude
        const markerSize = Math.max(5, magnitude * 3)
        const markerColor = magnitude >= 5 ? "#ef4444" : magnitude >= 3 ? "#f97316" : "#22c55e"

        const circleMarker = L.circleMarker([lat, lng], {
          radius: markerSize,
          color: markerColor,
          fillColor: markerColor,
          fillOpacity: 0.7,
          weight: 1,
        }).addTo(markersLayerRef.current!)

        // Add popup with earthquake info
        circleMarker.bindPopup(`
          <strong>${quake.properties.place}</strong><br>
          Magnitude: ${magnitude.toFixed(1)}<br>
          Time: ${new Date(quake.properties.time).toLocaleString()}<br>
          Depth: ${quake.geometry.coordinates[2].toFixed(1)} km
          ${quake.properties.tsunami === 1 ? '<br><span style="color: red; font-weight: bold">Tsunami Alert</span>' : ""}
        `)
      })

      // Fit map to show all earthquakes if there are any
     if (earthquakes.length > 0 && mapRef.current) {
        const bounds = L.latLngBounds([
          [latitude, longitude] as [number, number], 
          ...earthquakes.map(
          (quake) => [quake.geometry.coordinates[1], quake.geometry.coordinates[0]] as [number, number]
    ),
  ])

        mapRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 10,
        })
      }
    }
  }, [earthquakes, latitude, longitude])

  return <div id="map" className="h-full w-full" />
}
