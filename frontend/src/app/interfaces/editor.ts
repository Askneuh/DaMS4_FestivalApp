import { Contact } from "./contact"
import { Game } from "./game"

export interface Editor {
    id: number
    name: string
    contacts: Contact[]
    games: Game[]
}
