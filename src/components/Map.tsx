'use client'

import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Token Mapbox (doit être dans .env.local)
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

const HOSPITAL_COORDS: [number, number] = [-1.75978, 43.37536] // [Lng, Lat]

export default function MapComponent() {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const [lng, setLng] = useState(-1.75978)
    const [lat, setLat] = useState(43.37536)
    const [zoom, setZoom] = useState(13)

    useEffect(() => {
        if (map.current) return // initialize map only once
        if (!mapContainer.current) return

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: zoom,
        })

        // Ajouter un marqueur pour l'hôpital
        new mapboxgl.Marker({ color: 'red' })
            .setLngLat(HOSPITAL_COORDS)
            .setPopup(new mapboxgl.Popup().setHTML("<h3>Hôpital Marin</h3>"))
            .addTo(map.current)

        // Contrôles de navigation (+/-)
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

        // Géolocalisation de l'utilisateur
        const geolocate = new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        })
        map.current.addControl(geolocate, 'top-right');

    }, [lng, lat, zoom])

    return (
        <div className="relative w-full h-screen">
            <div ref={mapContainer} className="absolute top-0 left-0 w-full h-full" />

            {/* Overlay pour afficher les coordonnées (debug) */}
            <div className="absolute top-0 left-0 m-4 p-2 bg-white/80 rounded shadow text-xs font-mono z-10">
                Lng: {lng.toFixed(4)} | Lat: {lat.toFixed(4)} | Zoom: {zoom.toFixed(2)}
            </div>
        </div>
    )
}
