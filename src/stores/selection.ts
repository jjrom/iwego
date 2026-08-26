import { defineStore } from 'pinia'
import countriesData from '../data/countries.json'
import type { Country, CountryWithShares, ProgressLevel } from '../types/country'

const rawCountries = countriesData as Country[]

function progressLevel(share: number): ProgressLevel {
  if (share >= 50) return 'green'
  if (share >= 30) return 'orange'
  return 'red'
}

export const useSelectionStore = defineStore('selection', {
  state: () => ({
    selectedIds: new Set<string>(),
  }),

  getters: {
    countries(): Country[] {
      return rawCountries
    },

    totalPopulation(): number {
      return rawCountries.reduce((sum, c) => sum + c.population, 0)
    },

    totalGdp(): number {
      return rawCountries.reduce((sum, c) => sum + c.population * c.gdpPerCapita, 0)
    },

    countriesWithShares(): CountryWithShares[] {
      const totalPop = this.totalPopulation
      const totalGdp = this.totalGdp
      return rawCountries.map((c) => {
        const gdp = c.population * c.gdpPerCapita
        return {
          ...c,
          gdp,
          gdpShare: (gdp / totalGdp) * 100,
          populationShare: (c.population / totalPop) * 100,
          selected: this.selectedIds.has(c.id),
        }
      })
    },

    selectedCountries(): CountryWithShares[] {
      return this.countriesWithShares.filter((c) => c.selected)
    },

    selectedPopulation(): number {
      return this.selectedCountries.reduce((sum, c) => sum + c.population, 0)
    },

    selectedGdp(): number {
      return this.selectedCountries.reduce((sum, c) => sum + c.gdp, 0)
    },

    selectedPopulationShare(): number {
      if (this.totalPopulation === 0) return 0
      return (this.selectedPopulation / this.totalPopulation) * 100
    },

    selectedGdpShare(): number {
      if (this.totalGdp === 0) return 0
      return (this.selectedGdp / this.totalGdp) * 100
    },

    populationLevel(): ProgressLevel {
      return progressLevel(this.selectedPopulationShare)
    },

    gdpLevel(): ProgressLevel {
      return progressLevel(this.selectedGdpShare)
    },

    goalReached(): boolean {
      return this.selectedGdpShare >= 50 && this.selectedPopulationShare >= 50
    },
  },

  actions: {
    toggleCountry(id: string) {
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id)
      } else {
        this.selectedIds.add(id)
      }
      // Force reactivity on the Set
      this.selectedIds = new Set(this.selectedIds)
    },

    removeCountry(id: string) {
      this.selectedIds.delete(id)
      this.selectedIds = new Set(this.selectedIds)
    },

    reset() {
      this.selectedIds = new Set()
    },
  },
})
