import { Editor } from "./editor"
import { GameType } from "./game-type"
import { Mechanism } from "./mechanism"

export interface Game {
    id: number
    name: string
    author: string
    nbMinPlayer: number
    nbMaxPlayer: number
    gameNotice: string
    idGameType: number
    minimumAge: number
    prototype: boolean
    duration: number
    theme: string
    description: string
    gameImage: string //pour l'instant lien vers une image 
    rulesTutorial: string //lien vers une video
    edition: number
    idEditor: number
    editor?: Editor
    mechanisms?: Mechanism[] // appeler getMechanismsByGame(idGame: number)
    gameType?: GameType // appeler getGameTypeLabel(idGameType: number
}

