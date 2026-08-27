export interface Country {
  id: string
  name: string
  population: number
  gdpPerCapita: number
  year: number
}

export interface CountryWithShares extends Country {
  gdp: number
  gdpShare: number
  populationShare: number
  selected: boolean
}
