import { Editor } from './editor';
import { TariffZone } from './tariff-zone';

export interface ReservationDAO {
    idReservation: number;
    idEditor: number;
    status: string;
    editor: Editor;
    nbSmallTables: number;
    nbLargeTables: number;
    nbCityHallTables: number;
    m2: number;
    remise: number;
    typeAnimateur: number; // 0 = a besoin de bénévoles, 1 = n'a pas besoin de bénévoles
    listeDemandee: boolean;
    listeRecue: boolean;
    jeuxRecus: boolean;
    festivalName: string;
    idTZ: number;
    tariffZone?: TariffZone;
}