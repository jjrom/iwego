<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSelectionStore } from '../stores/selection'
import type { CountryWithShares } from '../types/country'

const store = useSelectionStore()

type SortKey = 'name' | 'gni' | 'gniShare'

const sortKey = ref<SortKey>('gniShare')
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

function formatGni(n: number): string {
  return `$${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`
}

function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
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
          <th @click="sortBy('gni')">GNI {{ sortIndicator('gni') }}</th>
          <th @click="sortBy('gniShare')">Share of GNI {{ sortIndicator('gniShare') }}</th>
          <th class="ratified-header">Ratified</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="c in sortedCountries"
          :key="c.id"
          :class="{ selected: c.selected, locked: c.locked, ratified: c.ratified }"
          @click="store.toggleCountry(c.id)"
        >
          <td>
            <span v-if="c.locked" class="lock-icon" title="Pinned in Preferences">🔒</span>
            {{ c.name }}
          </td>
          <td class="num">{{ formatGni(c.gni) }}</td>
          <td class="num">{{ formatPercent(c.gniShare, 2) }}</td>
          <td class="ratified-cell" @click.stop>
            <input
              type="checkbox"
              :checked="c.ratified"
              :disabled="!c.selected"
              @change="store.toggleRatified(c.id)"
            />
          </td>
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

.lock-icon {
  font-size: 0.7rem;
  margin-right: 0.15rem;
}

tbody tr {
  cursor: pointer;
  border-left: 3px solid transparent;
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

/* Locked (pinned) rows get a solid accent border so "can't be removed" reads
   as a distinct state from a plain (removable) selection. */
tbody tr.locked {
  border-left-color: var(--color-gold);
  cursor: default;
}

tbody tr.locked:hover {
  background: var(--color-gold-soft);
}

/* Ratified rows get the same diagonal hatch used on the map. */
tbody tr.ratified {
  background-image: repeating-linear-gradient(
    45deg,
    rgba(13, 24, 48, 0.4) 0,
    rgba(13, 24, 48, 0.4) 2px,
    transparent 2px,
    transparent 7px
  );
}

.ratified-header {
  text-align: center;
}

.ratified-cell {
  text-align: center;
}

.ratified-cell input[type='checkbox'] {
  accent-color: var(--color-gold);
  width: 0.9rem;
  height: 0.9rem;
  cursor: pointer;
}

.ratified-cell input[type='checkbox']:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}
</style>
