<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import countriesGeo from '../data/countries.geo.json'
import { useSelectionStore } from '../stores/selection'
import type { FeatureCollection } from 'geojson'

const store = useSelectionStore()
const mapContainer = ref<HTMLDivElement | null>(null)
let map: maplibregl.Map | null = null
let popup: maplibregl.Popup | null = null
let hoveredId: string | number | null = null
let resizeObserver: ResizeObserver | null = null

const SOURCE_ID = 'countries'
const FILL_LAYER = 'countries-fill'
const LINE_LAYER = 'countries-line'

function formatGni(n: number): string {
  return `$${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`
}

function computeBounds(geo: FeatureCollection): maplibregl.LngLatBoundsLike {
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity

  function visit(coords: unknown): void {
    const arr = coords as unknown[]
    if (typeof arr[0] === 'number') {
      const [lng, lat] = arr as [number, number]
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
      return
    }
    for (const c of arr) visit(c)
  }

  for (const feature of geo.features) {
    if (feature.geometry && 'coordinates' in feature.geometry) {
      visit(feature.geometry.coordinates)
    }
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

function applySelectionState() {
  if (!map) return
  for (const country of store.countries) {
    map.setFeatureState(
      { source: SOURCE_ID, id: country.id },
      { selected: store.selectedIds.has(country.id) },
    )
  }
}

onMounted(() => {
  if (!mapContainer.value) return
  const container = mapContainer.value

  const bounds = computeBounds(countriesGeo as FeatureCollection)

  // Wait for the flex layout to settle so the container reports its final
  // size before MapLibre reads it — otherwise the initial fit uses a
  // transient (often tiny) size and frames the wrong area.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      map = new maplibregl.Map({
        container,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        bounds,
        fitBoundsOptions: { padding: 24 },
        attributionControl: false,
      })

      resizeObserver = new ResizeObserver(() => {
        map?.resize()
      })
      resizeObserver.observe(container)

      setupMap(map)
    })
  })
})

function setupMap(map: maplibregl.Map) {
  map.on('load', () => {
    const activeMap = map
    if (!activeMap) return

    activeMap.addSource(SOURCE_ID, {
      type: 'geojson',
      data: countriesGeo as FeatureCollection,
      promoteId: 'id',
    })

    activeMap.addLayer({
      id: FILL_LAYER,
      type: 'fill',
      source: SOURCE_ID,
      paint: {
        'fill-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          '#e0b13c',
          '#efe9d8',
        ],
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          ['case', ['boolean', ['feature-state', 'hover'], false], 0.85, 0.7],
          ['case', ['boolean', ['feature-state', 'hover'], false], 0.35, 0.12],
        ],
      },
    })

    activeMap.addLayer({
      id: LINE_LAYER,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        'line-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          '#f3cf76',
          '#5c6f9e',
        ],
        'line-width': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          2,
          0.75,
        ],
      },
    })

    applySelectionState()

    popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })

    activeMap.on('mousemove', FILL_LAYER, (e) => {
      if (!e.features || e.features.length === 0) return
      const feature = e.features[0]
      const id = feature.id
      if (id === undefined) return

      if (hoveredId !== null && hoveredId !== id) {
        activeMap.setFeatureState({ source: SOURCE_ID, id: hoveredId }, { hover: false })
      }
      hoveredId = id
      activeMap.setFeatureState({ source: SOURCE_ID, id }, { hover: true })
      activeMap.getCanvas().style.cursor = 'pointer'

      const props = feature.properties as { id: string; name: string }
      const country = store.countries.find((c) => c.id === props.id)
      if (country && popup) {
        const lockPrefix = store.lockedIds.has(country.id) ? '🔒 ' : ''
        popup
          .setLngLat(e.lngLat)
          .setHTML(
            `<strong>${lockPrefix}${country.name}</strong>` +
              `<span>GNI <b>${formatGni(country.gni)}</b></span>` +
              `<span>Share of GNI <b>${country.gniSharePercent.toFixed(2)}%</b></span>`,
          )
          .addTo(activeMap)
      }
    })

    activeMap.on('mouseleave', FILL_LAYER, () => {
      if (hoveredId !== null) {
        activeMap.setFeatureState({ source: SOURCE_ID, id: hoveredId }, { hover: false })
        hoveredId = null
      }
      activeMap.getCanvas().style.cursor = ''
      popup?.remove()
    })

    activeMap.on('click', FILL_LAYER, (e) => {
      if (!e.features || e.features.length === 0) return
      const props = e.features[0].properties as { id: string }
      store.toggleCountry(props.id)
    })
  })
}

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  popup?.remove()
  map?.remove()
})

watch(() => store.selectedIds, applySelectionState, { deep: true })
</script>

<template>
  <div ref="mapContainer" class="map-container" />
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  min-height: 420px;
}

:deep(.maplibregl-popup-content) {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 0.8rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}

:deep(.maplibregl-popup-content strong) {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.15rem;
}

:deep(.maplibregl-popup-content b) {
  font-family: var(--font-mono);
  font-weight: 500;
  color: var(--color-gold);
}

:deep(.maplibregl-popup-tip) {
  border-top-color: var(--color-surface);
  border-bottom-color: var(--color-surface);
}
</style>
