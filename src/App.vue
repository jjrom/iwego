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
      <h1>I(WE)GO</h1>
      <div class="totals">
        <span>Total population: {{ formatNumber(totalPopulation) }}</span>
        <span>Total GDP: {{ formatGdp(totalGdp) }}</span>
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
  background: #14171c;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: #1a1d24;
  border-bottom: 1px solid #2a2e37;
}

.app-header h1 {
  margin: 0;
  font-size: 1.4rem;
  color: #f0f2f5;
}

.totals {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: #9aa3af;
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
