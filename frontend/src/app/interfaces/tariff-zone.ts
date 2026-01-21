export interface TariffZone {
    idTZ: number
    name: string
    nbSmallTables: number
    nbLargeTables: number
    nbCityHallTables: number
    remainingSmallTables: number
    remainingLargeTables: number
    remainingCityHallTables: number
    smallTablePrice: number
    largeTablePrice: number
    cityHallTablePrice: number
    festivalName: string
    squareMeterPrice: number
}
