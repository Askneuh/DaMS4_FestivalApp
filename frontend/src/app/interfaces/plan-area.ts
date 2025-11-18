import { Editor } from "./editor"
import { Game } from "./game"

export interface PlanArea {
    id: number
    name: string
    nbTables: number
    presentedGame: Game[]
    festivalName: string
    editors: Editor[] //Les editeurs présents sur place qui animent
    //Pas la liste de tous les editeurs dont les jeux sont présentés.
}
