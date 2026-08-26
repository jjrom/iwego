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
          <th @click="sortBy('name')">Country {{ sortIndicator('name') }}</th>
          <th @click="sortBy('population')">Population {{ sortIndicator('population') }}</th>
          <th @click="sortBy('gdpPerCapita')">GDP / capita {{ sortIndicator('gdpPerCapita') }}</th>
          <th @click="sortBy('populationShare')">% of EU population {{ sortIndicator('populationShare') }}</th>
          <th @click="sortBy('gdpShare')">% of EU GDP {{ sortIndicator('gdpShare') }}</th>
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
          <td>{{ formatNumber(c.population) }}</td>
          <td>${{ formatNumber(c.gdpPerCapita) }}</td>
          <td>{{ formatPercent(c.populationShare) }}</td>
          <td>{{ formatPercent(c.gdpShare) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrapper {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: auto;
  max-height: 480px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

th {
  position: sticky;
  top: 0;
  background: #f5f5f5;
  text-align: left;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  border-bottom: 1px solid #e0e0e0;
}

td {
  padding: 0.4rem 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

tbody tr {
  cursor: pointer;
}

tbody tr:hover {
  background: #f9f9f9;
}

tbody tr.selected {
  background: #e6f4ea;
}
</style>
