import { Editor } from "./editor"
import { PlanAreaGame } from "./plan-area-game"

export interface PlanArea {
    id: number
    name: string
    nbSmallTables: number
    nbLargeTables: number
    nbCityHallTables: number
    festivalName: string
    idTZ: number
    editors?: Editor[] //Les editeurs présents sur place qui animent
    //Pas la liste de tous les editeurs dont les jeux sont présentés.
    presentedGames?: PlanAreaGame[]
}
