import { TariffZone } from "./tariff-zone"

export interface Festival {
    name: string
    nbSmallTables: number
    nbLargeTables: number
    nbCityHallTables: number
    remainingSmallTables: number
    remainingLargeTables: number
    remainingCityHallTables: number
    tariffZones?: TariffZone[]
}
