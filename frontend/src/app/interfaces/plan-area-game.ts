import { Game } from "./game";

export interface PlanAreaGame extends Game {
    quantity: number;
    editorName?: string;
}
