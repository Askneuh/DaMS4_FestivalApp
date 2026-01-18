export interface Contact {
    id: number
    name: string
    email: string
    phone?: string
    role?: string // ex: "contact principal", "contact technique", etc.
    priority: boolean
    idEditor: number
}