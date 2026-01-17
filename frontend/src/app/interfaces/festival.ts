import { TariffZone } from "./tariff-zone"
import { Reservation } from "./reservation"
import { Game } from "./game"

export interface Festival {
    name: string
    nbSmallTables: number
    nbLargeTables: number
    nbCityHallTables: number
    remainingSmallTables: number
    remainingLargeTables: number
    remainingCityHallTables: number
    tariffZones?: TariffZone[] // appeler findByFestivalName(festivalName: string)
    reservations?: Reservation[] // appeler getReservationsByFestival(festivalName: string)
    games?: Game[] // appeler getGamesByFestival(festivalName: string)
}
