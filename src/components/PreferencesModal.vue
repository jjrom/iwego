<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useSelectionStore } from '../stores/selection'

const emit = defineEmits<{ close: [] }>()
const store = useSelectionStore()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="prefs-title">
      <div class="modal-header">
        <h2 id="prefs-title">Preferences</h2>
        <button class="close-btn" aria-label="Close preferences" @click="emit('close')">✕</button>
      </div>

      <p class="modal-intro">
        Pinned member states are pre-selected when the app loads and can't be removed from the
        coalition. Ratified member states are additionally marked as ratified from the start
        &mdash; both settings are remembered on this device.
      </p>

      <div class="country-list-header">
        <span>Member state</span>
        <span class="col-label">Pinned</span>
        <span class="col-label">Ratified</span>
      </div>

      <ul class="country-list">
        <li v-for="c in store.countries" :key="c.id" class="country-row">
          <span class="country-name">{{ c.name }}</span>
          <label class="col-checkbox" :aria-label="`Pin ${c.name}`">
            <input
              type="checkbox"
              :checked="store.lockedIds.has(c.id)"
              @change="store.toggleLocked(c.id)"
            />
          </label>
          <label class="col-checkbox" :aria-label="`Ratify ${c.name} by default`">
            <input
              type="checkbox"
              :checked="store.defaultRatifiedIds.has(c.id)"
              @change="store.toggleDefaultRatified(c.id)"
            />
          </label>
        </li>
      </ul>

      <div class="modal-footer">
        <button class="done-btn" @click="emit('close')">Done</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 8, 18, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  width: min(420px, 90vw);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: 6px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem 0.5rem;
}

.modal-header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.15rem;
  color: var(--color-text);
}

.close-btn {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.25rem;
}

.close-btn:hover {
  color: var(--color-crimson);
}

.close-btn:focus-visible,
.done-btn:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 2px;
}

.modal-intro {
  margin: 0 1.25rem 0.75rem;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-text-muted);
}

.country-list-header {
  display: grid;
  grid-template-columns: 1fr 4.5rem 4.5rem;
  align-items: center;
  padding: 0 1.25rem 0.4rem;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.col-label {
  text-align: center;
}

.country-list {
  list-style: none;
  margin: 0;
  padding: 0 1.25rem;
  overflow-y: auto;
  flex: 1;
  border-top: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
}

.country-row {
  display: grid;
  grid-template-columns: 1fr 4.5rem 4.5rem;
  align-items: center;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--color-line);
}

.country-row:last-child {
  border-bottom: none;
}

.country-name {
  font-size: 0.85rem;
  color: var(--color-text);
}

.col-checkbox {
  display: flex;
  justify-content: center;
  cursor: pointer;
}

.country-row input[type='checkbox'] {
  accent-color: var(--color-gold);
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 0.85rem 1.25rem;
}

.done-btn {
  padding: 0.45rem 1rem;
  border: 1px solid var(--color-gold);
  border-radius: 3px;
  background: var(--color-gold-soft);
  color: var(--color-gold);
  font-family: var(--font-body);
  font-size: 0.85rem;
  cursor: pointer;
}

.done-btn:hover {
  background: var(--color-gold);
  color: var(--color-bg);
}

@media (prefers-reduced-motion: no-preference) {
  .modal {
    animation: modal-in 0.18s ease-out;
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
