import { Game } from './game';
import { GameType } from './game-type';

export interface AssignedGame extends Game {
    idReservation: number;
    isGamePlaced: boolean;
    festivalName: string;
    idTZ: number;
    editorName: string;
    editorLogo: string;
    gameType?: GameType;
    quantity: number;
}
