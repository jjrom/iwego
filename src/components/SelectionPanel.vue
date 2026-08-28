<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSelectionStore } from '../stores/selection'

const store = useSelectionStore()

const gniShare = computed(() => store.selectedGniShare)
const shareStatus = ref<'idle' | 'copied' | 'error'>('idle')

function formatGni(n: number): string {
  return `$${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for contexts without Clipboard API permission (e.g. plain http).
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      return ok
    } catch {
      return false
    }
  }
}

async function share() {
  const ok = await copyToClipboard(store.shareUrl)
  shareStatus.value = ok ? 'copied' : 'error'
  setTimeout(() => {
    shareStatus.value = 'idle'
  }, 2000)
}
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <h2>Coalition</h2>
      <div class="header-actions">
        <span v-if="shareStatus === 'copied'" class="share-status">Link copied</span>
        <span v-else-if="shareStatus === 'error'" class="share-status share-status--error">Copy failed</span>
        <button class="share-btn" @click="share">Share</button>
        <button
          class="reset-btn"
          :disabled="store.selectedCountries.length === 0"
          @click="store.reset()"
        >
          Clear coalition
        </button>
      </div>
    </div>

    <div v-if="store.goalReached" class="ratification">
      <svg class="seal" viewBox="0 0 100 100" aria-hidden="true">
        <circle class="seal-ring-outer" cx="50" cy="50" r="46" />
        <circle class="seal-ring-inner" cx="50" cy="50" r="38" />
        <text class="seal-text" x="50" y="46" text-anchor="middle">COALITION</text>
        <text class="seal-text" x="50" y="60" text-anchor="middle">RATIFIED</text>
      </svg>
      <p class="ratification-text">
        This bloc holds a qualified majority — it would carry the vote.
      </p>
    </div>

    <div class="requirements">
      <div class="requirement" :class="{ met: store.countRequirementMet }">
        <span class="req-mark">{{ store.countRequirementMet ? '✓' : store.selectedCountries.length }}</span>
        <span class="req-label">At least {{ store.minCountries }} member states</span>
        <span class="req-value">{{ store.selectedCountries.length }} / {{ store.minCountries }}</span>
      </div>
      <div class="requirement" :class="{ met: store.gniRequirementMet }">
        <span class="req-mark">{{ store.gniRequirementMet ? '✓' : '·' }}</span>
        <span class="req-label">Combined GNI over 50%</span>
        <span class="req-value">{{ formatPercent(gniShare) }}</span>
      </div>
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="metric-label">
          <span>GNI share</span>
          <span>{{ formatPercent(gniShare) }}</span>
        </div>
        <div class="bar-track">
          <div class="quorum-line" />
          <div
            class="bar-fill"
            :class="{ 'bar-fill--met': store.gniRequirementMet }"
            :style="{ width: `${Math.min(gniShare, 100)}%` }"
          />
        </div>
      </div>
    </div>

    <ul class="selected-list">
      <li v-if="store.selectedCountries.length === 0" class="empty">
        Select member states on the map to begin a coalition.
      </li>
      <li v-for="c in store.selectedCountries" :key="c.id" class="selected-item">
        <span class="selected-item-name">
          <span v-if="c.locked" class="lock-icon" title="Pinned in Preferences">🔒</span>
          {{ c.name }}
        </span>
        <span class="selected-item-details">
          {{ formatGni(c.gni) }} &middot; {{ c.gniSharePercent.toFixed(2) }}% GNI
        </span>
        <button
          v-if="!c.locked"
          class="remove-btn"
          :aria-label="`Remove ${c.name}`"
          @click="store.removeCountry(c.id)"
        >
          ✕
        </button>
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
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: 4px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.25rem;
  color: var(--color-text);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.share-status {
  font-size: 0.75rem;
  color: var(--color-gold);
  white-space: nowrap;
}

.share-status--error {
  color: var(--color-crimson);
}

.share-btn,
.reset-btn {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--color-line);
  border-radius: 3px;
  background: var(--color-surface-raised);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 0.8rem;
  cursor: pointer;
}

.reset-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.share-btn:hover,
.reset-btn:not(:disabled):hover {
  border-color: var(--color-gold);
}

.share-btn:focus-visible,
.reset-btn:focus-visible,
.remove-btn:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 2px;
}

/* Ratification seal — signature element */
.ratification {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.5rem 0.75rem 0.5rem 0.25rem;
}

.seal {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  animation: stamp-in 0.4s cubic-bezier(0.2, 1.6, 0.4, 1);
}

@media (prefers-reduced-motion: reduce) {
  .seal {
    animation: stamp-in-reduced 0.3s ease-out;
  }
}

.seal-ring-outer,
.seal-ring-inner {
  fill: none;
  stroke: var(--color-gold);
}

.seal-ring-outer {
  stroke-width: 2.5;
}

.seal-ring-inner {
  stroke-width: 1;
  opacity: 0.7;
}

.seal-text {
  font-family: var(--font-display);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
  fill: var(--color-gold);
}

@keyframes stamp-in {
  0% {
    opacity: 0;
    transform: scale(1.7) rotate(-20deg);
  }
  70% {
    opacity: 1;
    transform: scale(0.94) rotate(-4deg);
  }
  100% {
    transform: scale(1) rotate(-6deg);
  }
}

@keyframes stamp-in-reduced {
  from {
    opacity: 0;
    transform: rotate(-6deg);
  }
  to {
    opacity: 1;
    transform: rotate(-6deg);
  }
}

.ratification-text {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--color-text);
}

.requirements {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.6rem;
  border-radius: 3px;
  background: var(--color-surface-raised);
  font-size: 0.85rem;
  color: var(--color-text-muted);
  border-left: 2px solid var(--color-crimson);
}

.requirement.met {
  color: var(--color-text);
  border-left-color: var(--color-gold);
}

.req-mark {
  width: 1.3rem;
  height: 1.3rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  background: var(--color-crimson-soft);
  color: var(--color-crimson);
  flex-shrink: 0;
}

.requirement.met .req-mark {
  background: var(--color-gold-soft);
  color: var(--color-gold);
}

.req-label {
  flex: 1;
}

.req-value {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
}

.metrics {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.metric-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 0.3rem;
  color: var(--color-text-muted);
}

.metric-label em {
  font-style: normal;
  opacity: 0.75;
}

.bar-track {
  position: relative;
  height: 8px;
  background: var(--color-surface-raised);
  border-radius: 2px;
  overflow: hidden;
}

.quorum-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: var(--color-text-muted);
  opacity: 0.6;
  z-index: 1;
}

.bar-fill {
  height: 100%;
  position: relative;
  z-index: 0;
  background: var(--color-crimson);
  transition: width 0.3s ease, background-color 0.3s ease;
}

.bar-fill--met {
  background: var(--color-gold);
}

.selected-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  max-height: 220px;
  overflow-y: auto;
}

.empty {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-style: italic;
}

.selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  background: var(--color-surface-raised);
  border-radius: 3px;
  font-size: 0.85rem;
  color: var(--color-text);
}

.selected-item-name {
  white-space: nowrap;
}

.lock-icon {
  font-size: 0.7rem;
  margin-right: 0.15rem;
}

.selected-item-details {
  font-family: var(--font-mono);
  color: var(--color-text-muted);
  font-size: 0.74rem;
  white-space: nowrap;
}

.remove-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  padding: 0 0.25rem;
}

.remove-btn:hover {
  color: var(--color-crimson);
}
</style>
