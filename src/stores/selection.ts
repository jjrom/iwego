import { defineStore } from 'pinia'
import countriesData from '../data/countries.json'
import type { Country, CountryWithShares } from '../types/country'

const rawCountries = countriesData as Country[]
const MIN_COUNTRIES = 8
const GNI_GOAL_SHARE = 50

const LOCKED_IDS_STORAGE_KEY = 'iwego:lockedCountryIds'
const DEFAULT_LOCKED_IDS = ['NO', 'FR', 'GR']
const DEFAULT_RATIFIED_IDS_STORAGE_KEY = 'iwego:defaultRatifiedCountryIds'
const DEFAULT_RATIFIED_IDS = ['NO']
const SIGNED_PARAM = 'countries'
const RATIFIED_PARAM = 'ratified'

function loadIdSet(key: string, fallback: string[]): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return new Set(parsed)
    }
  } catch {
    // localStorage unavailable or corrupted — fall back to the default below.
  }
  return new Set(fallback)
}

function saveIdSet(key: string, ids: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...ids]))
  } catch {
    // Best-effort persistence; ignore if storage is unavailable.
  }
}

/** Reads a comma-separated list of country ids out of a URL query param. */
function loadIdsFromUrl(param: string): Set<string> {
  try {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get(param)
    if (!raw) return new Set()
    const validIds = new Set(rawCountries.map((c) => c.id))
    const ids = raw
      .split(',')
      .map((id) => id.trim().toUpperCase())
      .filter((id) => validIds.has(id))
    return new Set(ids)
  } catch {
    return new Set()
  }
}

export const useSelectionStore = defineStore('selection', {
  state: () => {
    const lockedIds = loadIdSet(LOCKED_IDS_STORAGE_KEY, DEFAULT_LOCKED_IDS)
    const defaultRatifiedIds = loadIdSet(DEFAULT_RATIFIED_IDS_STORAGE_KEY, DEFAULT_RATIFIED_IDS)
    const sharedSelection = loadIdsFromUrl(SIGNED_PARAM)
    // Locked and default-ratified countries are always pre-selected.
    const selectedIds = new Set([...sharedSelection, ...lockedIds, ...defaultRatifiedIds])
    // A country can only be ratified if it was actually signed.
    const sharedRatified = loadIdsFromUrl(RATIFIED_PARAM)
    const ratifiedIds = new Set(
      [...sharedRatified, ...defaultRatifiedIds].filter((id) => selectedIds.has(id)),
    )
    return {
      selectedIds,
      lockedIds,
      defaultRatifiedIds,
      ratifiedIds,
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
        ratified: this.ratifiedIds.has(c.id),
      }))
    },

    selectedCountries(): CountryWithShares[] {
      return this.countriesWithShares.filter((c) => c.selected)
    },

    selectedGniShare(): number {
      return this.selectedCountries.reduce((sum, c) => sum + c.gniSharePercent, 0)
    },

    /** A URL that reproduces the current coalition (signatures + ratifications) when opened. */
    shareUrl(): string {
      const signedIds = [...this.selectedIds].sort()
      const ratifiedIds = [...this.ratifiedIds].sort()
      const url = new URL(window.location.href)
      const params = new URLSearchParams()
      if (signedIds.length > 0) params.set(SIGNED_PARAM, signedIds.join(','))
      if (ratifiedIds.length > 0) params.set(RATIFIED_PARAM, ratifiedIds.join(','))
      url.search = params.toString()
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
        this.ratifiedIds.delete(id) // can't stay ratified once un-signed
        this.ratifiedIds = new Set(this.ratifiedIds)
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
      this.ratifiedIds.delete(id)
      this.ratifiedIds = new Set(this.ratifiedIds)
    },

    reset() {
      // Locked and default-ratified countries can't be cleared either —
      // reset falls back to exactly that baseline.
      this.selectedIds = new Set([...this.lockedIds, ...this.defaultRatifiedIds])
      this.ratifiedIds = new Set(
        [...this.defaultRatifiedIds].filter((id) => this.selectedIds.has(id)),
      )
    },

    toggleLocked(id: string) {
      const lockedIds = new Set(this.lockedIds)
      if (lockedIds.has(id)) {
        lockedIds.delete(id)
      } else {
        lockedIds.add(id)
      }
      this.lockedIds = lockedIds
      saveIdSet(LOCKED_IDS_STORAGE_KEY, lockedIds)

      // Newly locked countries are pinned into the current selection.
      if (lockedIds.has(id) && !this.selectedIds.has(id)) {
        this.selectedIds = new Set(this.selectedIds).add(id)
      }
    },

    toggleRatified(id: string) {
      if (!this.selectedIds.has(id)) return // must be signed before it can be ratified
      const ratifiedIds = new Set(this.ratifiedIds)
      if (ratifiedIds.has(id)) {
        ratifiedIds.delete(id)
      } else {
        ratifiedIds.add(id)
      }
      this.ratifiedIds = ratifiedIds
    },

    /** Toggles whether a country is ratified (and pre-selected) by default on every load. */
    toggleDefaultRatified(id: string) {
      const defaultRatifiedIds = new Set(this.defaultRatifiedIds)
      if (defaultRatifiedIds.has(id)) {
        defaultRatifiedIds.delete(id)
      } else {
        defaultRatifiedIds.add(id)
      }
      this.defaultRatifiedIds = defaultRatifiedIds
      saveIdSet(DEFAULT_RATIFIED_IDS_STORAGE_KEY, defaultRatifiedIds)

      // Newly default-ratified countries are signed and ratified right away.
      if (defaultRatifiedIds.has(id)) {
        if (!this.selectedIds.has(id)) {
          this.selectedIds = new Set(this.selectedIds).add(id)
        }
        if (!this.ratifiedIds.has(id)) {
          this.ratifiedIds = new Set(this.ratifiedIds).add(id)
        }
      }
    },
  },
})
