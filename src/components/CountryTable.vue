<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSelectionStore } from '../stores/selection'
import type { CountryWithShares } from '../types/country'

const store = useSelectionStore()

type SortKey = 'name' | 'population' | 'gdpPerCapita' | 'populationShare' | 'gdpShare'

const sortKey = ref<SortKey>('gdpShare')
const sortAsc = ref(false)

function sortBy(key: SortKey) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = false
  }
}

const sortedCountries = computed<CountryWithShares[]>(() => {
  const list = [...store.countriesWithShares]
  const dir = sortAsc.value ? 1 : -1
  list.sort((a, b) => {
    const av = a[sortKey.value]
    const bv = b[sortKey.value]
    if (typeof av === 'string' && typeof bv === 'string') {
      return av.localeCompare(bv) * dir
    }
    return ((av as number) - (bv as number)) * dir
  })
  return list
})

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`
}

function sortIndicator(key: SortKey): string {
  if (sortKey.value !== key) return ''
  return sortAsc.value ? '▲' : '▼'
}
</script>

<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th @click="sortBy('name')">Member state {{ sortIndicator('name') }}</th>
          <th @click="sortBy('population')">Population {{ sortIndicator('population') }}</th>
          <th @click="sortBy('gdpPerCapita')">GDP / capita {{ sortIndicator('gdpPerCapita') }}</th>
          <th @click="sortBy('populationShare')">Share of population {{ sortIndicator('populationShare') }}</th>
          <th @click="sortBy('gdpShare')">Share of GDP {{ sortIndicator('gdpShare') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="c in sortedCountries"
          :key="c.id"
          :class="{ selected: c.selected }"
          @click="store.toggleCountry(c.id)"
        >
          <td>{{ c.name }}</td>
          <td class="num">{{ formatNumber(c.population) }}</td>
          <td class="num">${{ formatNumber(c.gdpPerCapita) }}</td>
          <td class="num">{{ formatPercent(c.populationShare) }}</td>
          <td class="num">{{ formatPercent(c.gdpShare) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrapper {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: 4px;
  overflow: auto;
  max-height: 480px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.83rem;
  color: var(--color-text);
}

th {
  position: sticky;
  top: 0;
  background: var(--color-surface-raised);
  text-align: left;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  border-bottom: 1px solid var(--color-line);
  color: var(--color-text-muted);
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: 500;
}

th:hover {
  color: var(--color-gold);
}

td {
  padding: 0.4rem 0.75rem;
  border-bottom: 1px solid var(--color-line);
}

td.num {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

tbody tr {
  cursor: pointer;
}

tbody tr:hover {
  background: var(--color-surface-raised);
}

tbody tr.selected {
  background: var(--color-gold-soft);
}

tbody tr.selected td:first-child {
  color: var(--color-gold);
}
</style>
