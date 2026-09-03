import maplibregl, { type MapMouseEvent } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'

type Coordinates = { latitude: number; longitude: number }

type Props = {
  coordinates: Coordinates | null
  onOceanPick: (coordinates: Coordinates) => void
  disabled: boolean
}

const oceanLayerName = /(^|[-_])(water|ocean|marine|sea)([-_]|$)/i

function layerNamesForOcean(map: maplibregl.Map) {
  return map.getStyle().layers
    .filter((layer) => oceanLayerName.test(layer.id) || oceanLayerName.test((layer as unknown as { 'source-layer'?: string })['source-layer'] ?? ''))
    .map((layer) => layer.id)
}

export default function OceanMap({ coordinates, onOceanPick, disabled }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const marker = useRef<maplibregl.Marker | null>(null)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('Loading ocean map…')

  useEffect(() => {
    if (!container.current || map.current) return
    const instance = new maplibregl.Map({
      container: container.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [-20, 25],
      zoom: 2.1,
      attributionControl: { compact: true },
    })
    map.current = instance
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    instance.on('load', () => {
      setReady(true)
      setMessage('Click a blue ocean surface to load its marine forecast.')
    })
    const selectOcean = (event: MapMouseEvent) => {
      const oceanLayers = layerNamesForOcean(instance)
      const hitOcean = oceanLayers.length > 0 && instance.queryRenderedFeatures(event.point, { layers: oceanLayers }).length > 0
      if (!hitOcean) {
        setMessage('Land is not selectable. Click a blue ocean surface.')
        return
      }
      setMessage('Ocean point selected — loading forecast…')
      onOceanPick({ latitude: event.lngLat.lat, longitude: event.lngLat.lng })
    }
    instance.on('click', selectOcean)
    return () => {
      marker.current?.remove()
      marker.current = null
      map.current = null
      instance.remove()
    }
  }, [onOceanPick])

  useEffect(() => {
    if (!map.current || !ready || !coordinates) return
    marker.current?.remove()
    marker.current = new maplibregl.Marker({ color: '#f4a340' })
      .setLngLat([coordinates.longitude, coordinates.latitude])
      .addTo(map.current)
  }, [coordinates, ready])

  useEffect(() => {
    if (!disabled && message.includes('loading forecast')) {
      setMessage('Forecast saved as the debugger baseline. You can now tune every value below.')
    }
  }, [disabled, message])

  return (
    <section className="map-card">
      <div className="section-heading"><span>01 · Ocean point</span><span className="status-dot" /></div>
      <div ref={container} className="map" aria-label="Map for selecting an ocean coordinate" />
      <p className="map-message" aria-live="polite">{disabled ? 'Loading the marine forecast…' : message}</p>
    </section>
  )
}
