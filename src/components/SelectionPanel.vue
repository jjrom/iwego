<script setup lang="ts">
import { computed } from 'vue'
import { useSelectionStore } from '../stores/selection'

const store = useSelectionStore()

const gdpShare = computed(() => store.selectedGdpShare)
const popShare = computed(() => store.selectedPopulationShare)

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`
}
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <h2>Selection</h2>
      <button
        class="reset-btn"
        :disabled="store.selectedCountries.length === 0"
        @click="store.reset()"
      >
        Reset
      </button>
    </div>

    <div v-if="store.goalReached" class="goal-badge">
      🎯 Goal reached: ≥{{ store.minCountries }} countries and &gt;50% GDP
    </div>

    <div class="requirements">
      <div class="requirement" :class="{ met: store.countRequirementMet }">
        <span class="req-icon">{{ store.countRequirementMet ? '✓' : '○' }}</span>
        <span class="req-label">At least {{ store.minCountries }} countries</span>
        <span class="req-value">{{ store.selectedCountries.length }} / {{ store.minCountries }}</span>
      </div>
      <div class="requirement" :class="{ met: store.gdpRequirementMet }">
        <span class="req-icon">{{ store.gdpRequirementMet ? '✓' : '○' }}</span>
        <span class="req-label">GDP share above 50%</span>
        <span class="req-value">{{ formatPercent(gdpShare) }}</span>
      </div>
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="metric-label">
          <span>GDP share</span>
          <span>{{ formatPercent(gdpShare) }}</span>
        </div>
        <div class="bar-track">
          <div
            class="bar-fill"
            :class="`level-${store.gdpLevel}`"
            :style="{ width: `${Math.min(gdpShare, 100)}%` }"
          />
        </div>
      </div>

      <div class="metric">
        <div class="metric-label">
          <span>Population share (info only)</span>
          <span>{{ formatPercent(popShare) }}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill bar-neutral" :style="{ width: `${Math.min(popShare, 100)}%` }" />
        </div>
      </div>
    </div>

    <ul class="selected-list">
      <li v-if="store.selectedCountries.length === 0" class="empty">
        Click countries on the map to select them.
      </li>
      <li v-for="c in store.selectedCountries" :key="c.id" class="selected-item">
        <span>{{ c.name }}</span>
        <span class="selected-item-details">
          {{ formatNumber(c.population) }} · ${{ formatNumber(c.gdpPerCapita) }}/cap
        </span>
        <button class="remove-btn" @click="store.removeCountry(c.id)">✕</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #1a1d24;
  border: 1px solid #2a2e37;
  border-radius: 8px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #f0f2f5;
}

.reset-btn {
  padding: 0.35rem 0.75rem;
  border: 1px solid #3a3f4a;
  border-radius: 6px;
  background: #262a33;
  color: #e4e7eb;
  cursor: pointer;
}

.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.goal-badge {
  padding: 0.5rem 0.75rem;
  background: rgba(67, 160, 71, 0.18);
  color: #81c784;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}

.requirements {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  background: #20242c;
  font-size: 0.85rem;
  color: #9aa3af;
}

.requirement.met {
  color: #e4e7eb;
}

.req-icon {
  width: 1.1rem;
  text-align: center;
  color: #e53935;
}

.requirement.met .req-icon {
  color: #43a047;
}

.req-label {
  flex: 1;
}

.req-value {
  font-variant-numeric: tabular-nums;
  color: #c3c9d1;
}

.metrics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metric-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  color: #c3c9d1;
}

.bar-track {
  height: 10px;
  background: #2a2e37;
  border-radius: 6px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.level-red {
  background: #e53935;
}

.level-orange {
  background: #fb8c00;
}

.level-green {
  background: #43a047;
}

.bar-neutral {
  background: #5c6773;
}

.selected-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 220px;
  overflow-y: auto;
}

.empty {
  color: #7c8592;
  font-size: 0.85rem;
  font-style: italic;
}

.selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  background: #22262e;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #e4e7eb;
}

.selected-item-details {
  color: #9aa3af;
  font-size: 0.78rem;
  white-space: nowrap;
}

.remove-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #7c8592;
  font-size: 0.85rem;
  padding: 0 0.25rem;
}

.remove-btn:hover {
  color: #e57373;
}
</style>
