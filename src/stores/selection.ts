import { defineStore } from 'pinia'
import countriesData from '../data/countries.json'
import type { Country, CountryWithShares } from '../types/country'

const rawCountries = countriesData as Country[]
const MIN_COUNTRIES = 8
const GNI_GOAL_SHARE = 50

const LOCKED_IDS_STORAGE_KEY = 'iwego:lockedCountryIds'
const DEFAULT_LOCKED_IDS = ['NO', 'FR', 'GR']
const SHARE_PARAM = 'countries'

function loadLockedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCKED_IDS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return new Set(parsed)
    }
  } catch {
    // localStorage unavailable or corrupted — fall back to the default below.
  }
  return new Set(DEFAULT_LOCKED_IDS)
}

function saveLockedIds(ids: Set<string>) {
  try {
    localStorage.setItem(LOCKED_IDS_STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // Best-effort persistence; ignore if storage is unavailable.
  }
}

/** Reads the shared coalition (if any) out of the current page URL. */
function loadSelectionFromUrl(): Set<string> | null {
  try {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get(SHARE_PARAM)
    if (!raw) return null
    const validIds = new Set(rawCountries.map((c) => c.id))
    const ids = raw
      .split(',')
      .map((id) => id.trim().toUpperCase())
      .filter((id) => validIds.has(id))
    return ids.length > 0 ? new Set(ids) : null
  } catch {
    return null
  }
}

export const useSelectionStore = defineStore('selection', {
  state: () => {
    const lockedIds = loadLockedIds()
    const sharedSelection = loadSelectionFromUrl()
    const selectedIds = sharedSelection
      ? new Set([...sharedSelection, ...lockedIds])
      : new Set(lockedIds)
    return {
      selectedIds,
      lockedIds,
    }
  },

  getters: {
    minCountries(): number {
      return MIN_COUNTRIES
    },

    countries(): Country[] {
      return rawCountries
    },

    /** Sum of the given per-country GNI shares; should be ~100 by construction. */
    totalGniSharePercent(): number {
      return rawCountries.reduce((sum, c) => sum + c.gniSharePercent, 0)
    },

    totalGni(): number {
      return rawCountries.reduce((sum, c) => sum + c.gni, 0)
    },

    countriesWithShares(): CountryWithShares[] {
      return rawCountries.map((c) => ({
        ...c,
        gniShare: c.gniSharePercent,
        selected: this.selectedIds.has(c.id),
        locked: this.lockedIds.has(c.id),
      }))
    },

    selectedCountries(): CountryWithShares[] {
      return this.countriesWithShares.filter((c) => c.selected)
    },

    selectedGniShare(): number {
      return this.selectedCountries.reduce((sum, c) => sum + c.gniSharePercent, 0)
    },

    /** A URL that reproduces the current coalition when opened. */
    shareUrl(): string {
      const ids = [...this.selectedIds].sort()
      const url = new URL(window.location.href)
      url.search = ids.length > 0 ? `${SHARE_PARAM}=${ids.join(',')}` : ''
      return url.toString()
    },

    countRequirementMet(): boolean {
      return this.selectedCountries.length >= MIN_COUNTRIES
    },

    gniRequirementMet(): boolean {
      return this.selectedGniShare > GNI_GOAL_SHARE
    },

    goalReached(): boolean {
      return this.countRequirementMet && this.gniRequirementMet
    },
  },

  actions: {
    toggleCountry(id: string) {
      if (this.lockedIds.has(id)) return // locked countries can't be deselected
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id)
      } else {
        this.selectedIds.add(id)
      }
      // Force reactivity on the Set
      this.selectedIds = new Set(this.selectedIds)
    },

    removeCountry(id: string) {
      if (this.lockedIds.has(id)) return
      this.selectedIds.delete(id)
      this.selectedIds = new Set(this.selectedIds)
    },

    reset() {
      // Locked countries can't be cleared either — reset falls back to them.
      this.selectedIds = new Set(this.lockedIds)
    },

    toggleLocked(id: string) {
      const lockedIds = new Set(this.lockedIds)
      if (lockedIds.has(id)) {
        lockedIds.delete(id)
      } else {
        lockedIds.add(id)
      }
      this.lockedIds = lockedIds
      saveLockedIds(lockedIds)

      // Newly locked countries are pinned into the current selection.
      if (lockedIds.has(id) && !this.selectedIds.has(id)) {
        this.selectedIds = new Set(this.selectedIds).add(id)
      }
    },
  },
})
