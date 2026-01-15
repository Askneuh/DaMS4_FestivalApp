import { Editor } from './editor';

export interface ReservationDAO {
    idReservation: number;
    idEditor: number;
    status: string;
    editor: Editor;
    nbSmallTables: number;
    nbLargeTables: number;
    nbCityHallTables: number;
    remise: number;
    typeAnimateur: number; // 0 = a besoin de bénévoles, 1 = n'a pas besoin de bénévoles
    listeDemandee: boolean;
    listeRecue: boolean;
    jeuxRecus: boolean;
    festivalName: string;
}