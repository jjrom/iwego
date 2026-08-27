<script setup lang="ts">
import { computed } from 'vue'
import { useSelectionStore } from './stores/selection'
import EuropeMap from './components/EuropeMap.vue'
import SelectionPanel from './components/SelectionPanel.vue'
import CountryTable from './components/CountryTable.vue'

const store = useSelectionStore()

const totalPopulation = computed(() => store.totalPopulation)
const totalGdp = computed(() => store.totalGdp)

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

function formatGdp(n: number): string {
  return `$${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="masthead">
        <h1>I(WE)GO</h1>
        <p class="masthead-sub">Qualified majority simulator &middot; 31 member states</p>
      </div>
      <div class="totals">
        <div class="total-item">
          <span class="total-label">Population</span>
          <span class="total-value">{{ formatNumber(totalPopulation) }}</span>
        </div>
        <div class="total-item">
          <span class="total-label">Combined GDP</span>
          <span class="total-value">{{ formatGdp(totalGdp) }}</span>
        </div>
      </div>
    </header>

    <main class="app-main">
      <div class="map-column">
        <EuropeMap />
      </div>
      <div class="side-column">
        <SelectionPanel />
        <CountryTable />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg);
}

.app-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 1rem 1.5rem 0.85rem;
  border-bottom: 1px solid var(--color-line);
}

.masthead h1 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.9rem;
  letter-spacing: -0.01em;
  color: var(--color-text);
}

.masthead-sub {
  margin: 0.15rem 0 0;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-gold);
}

.totals {
  display: flex;
  gap: 2rem;
}

.total-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.total-label {
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.total-value {
  font-family: var(--font-mono);
  font-size: 1rem;
  color: var(--color-text);
}

.app-main {
  flex: 1;
  display: flex;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.map-column {
  flex: 2;
  min-width: 0;
}

.side-column {
  flex: 1;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}
</style>
