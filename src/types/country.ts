export interface Country {
  id: string
  name: string
  population: number
  year: number
  /** Share of the 31-country bloc's combined GDP, as a given percentage (0-100). */
  gdpSharePercent: number
}

export interface CountryWithShares extends Country {
  gdpShare: number
  populationShare: number
  selected: boolean
}
