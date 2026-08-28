export interface Country {
  id: string
  name: string
  population: number
  year: number
  /** Average Gross National Income in USD, 2020-22 (source: UNdata). */
  gni: number
  /** Share of the 31-country bloc's combined GNI, as a given percentage (0-100). */
  gniSharePercent: number
}

export interface CountryWithShares extends Country {
  gniShare: number
  selected: boolean
  locked: boolean
  /** Signed (selected) and formally ratified — the second step of the process. */
  ratified: boolean
}
