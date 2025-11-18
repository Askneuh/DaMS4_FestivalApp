import { Editor } from "./editor"

export interface Game {
    id: number
    name: string
    author: string
    edition: number
    editor: Editor
}

