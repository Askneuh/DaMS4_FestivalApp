import { TariffZone } from "./tariff-zone"

export interface Festival {
    name: string
    nbTables: number
    tariffZones: TariffZone[]
}
