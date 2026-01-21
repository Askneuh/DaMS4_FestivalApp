import { Contact } from "./contact"
import { Game } from "./game"

export interface Editor {
    id: number
    name: string
    exposant: boolean // vient lui même présenter ses jeux + les jeux de ses distributeurs (a un stand)
    distributeur: boolean // délègue la présentation de ses jeux à un exposant (n'a pas de stand)
    logo: string //lien vers une image
    contacts?: Contact[] // appeler getContactsByEditor(idEditor: number)
}
