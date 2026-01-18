import { Game } from "./game";

export interface ReservationGame extends Game {
    idReservation: number;
    isGamePlaced: boolean;
    quantity: number;
}
