import { Contact } from "./contact"
import { Game } from "./game"

export interface Editor {
    id: number
    name: string
    exposant: boolean // ??
    distributeur: boolean // ??
    logo?: string //lien vers une image
    contacts: Contact[]
    games: Game[] // A SUPPRIMER
}
