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
const HATCH_LAYER = 'countries-hatch'
const LINE_LAYER = 'countries-line'
const HATCH_IMAGE_ID = 'ratified-hatch'

function formatGni(n: number): string {
  return `$${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`
}

/** A small tileable diagonal-stripe pattern marking a ratified country. */
function createHatchPattern(): ImageData {
  const size = 10
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.strokeStyle = 'rgba(13, 24, 48, 0.55)'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.moveTo(0, size)
  ctx.lineTo(size, 0)
  ctx.stroke()
  return ctx.getImageData(0, 0, size, size)
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
  const goalReached = store.goalReached
  for (const country of store.countries) {
    map.setFeatureState(
      { source: SOURCE_ID, id: country.id },
      {
        selected: store.selectedIds.has(country.id),
        locked: store.lockedIds.has(country.id),
        ratified: store.ratifiedIds.has(country.id),
        goalReached,
      },
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

    if (!activeMap.hasImage(HATCH_IMAGE_ID)) {
      activeMap.addImage(HATCH_IMAGE_ID, createHatchPattern())
    }

    activeMap.addLayer({
      id: FILL_LAYER,
      type: 'fill',
      source: SOURCE_ID,
      paint: {
        // Gold marks a plain selection; once the coalition actually clears
        // the qualified-majority bar, every selected country flips to green
        // so "we're there" reads at a glance, not just in the side panel.
        'fill-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          [
            'case',
            ['boolean', ['feature-state', 'goalReached'], false],
            '#43a047',
            '#e0b13c',
          ],
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

    // Ratified countries get a diagonal hatch overlay on top of their plain
    // (gold/green) fill — the signature -> ratification step, made visible.
    activeMap.addLayer({
      id: HATCH_LAYER,
      type: 'fill',
      source: SOURCE_ID,
      paint: {
        'fill-pattern': HATCH_IMAGE_ID,
        'fill-opacity': ['case', ['boolean', ['feature-state', 'ratified'], false], 1, 0],
      },
    })

    activeMap.addLayer({
      id: LINE_LAYER,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        // Locked (pinned) countries get a distinct parchment ring so they
        // read as "can't be removed" at a glance, separate from a plain
        // (removable) selection.
        'line-color': [
          'case',
          ['boolean', ['feature-state', 'locked'], false],
          '#efe9d8',
          ['boolean', ['feature-state', 'selected'], false],
          [
            'case',
            ['boolean', ['feature-state', 'goalReached'], false],
            '#81c784',
            '#f3cf76',
          ],
          '#5c6f9e',
        ],
        'line-width': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          2.5,
          ['boolean', ['feature-state', 'locked'], false],
          1.75,
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
watch(() => store.lockedIds, applySelectionState, { deep: true })
watch(() => store.ratifiedIds, applySelectionState, { deep: true })
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
