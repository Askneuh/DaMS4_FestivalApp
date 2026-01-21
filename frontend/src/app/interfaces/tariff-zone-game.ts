import { Game } from './game';
import { GameType } from './game-type';

export interface TariffZoneGame extends Game {
    totalQuantity: number;
    assignedQuantity: number;
    remainingQuantity: number;
    isGamePlaced: boolean;
    idReservation: number;
    festivalName: string;
    editorName: string;
    editorLogo: string;
    gameType?: GameType;
}
