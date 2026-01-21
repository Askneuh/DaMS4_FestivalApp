import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Service centralisé pour les validations métier
 */
@Injectable({
    providedIn: 'root'
})
export class ValidationService {

    /**
     * Valide que les tables allouées aux zones tarifaires ne dépassent pas le total du festival
     * @param festival - Données du festival avec zones tarifaires
     * @returns Erreurs de validation ou null
     */
    validateTableAllocation(festival: {
        nbSmallTables: number;
        nbLargeTables: number;
        nbCityHallTables: number;
        tariffZones: Array<{
            nbSmallTables: number;
            nbLargeTables: number;
            nbCityHallTables: number;
        }>;
    }): ValidationErrors | null {
        const nbSmallTables = festival.nbSmallTables || 0;
        const nbLargeTables = festival.nbLargeTables || 0;
        const nbCityHallTables = festival.nbCityHallTables || 0;

        let allocatedSmall = 0;
        let allocatedLarge = 0;
        let allocatedCityHall = 0;

        festival.tariffZones.forEach((zone) => {
            allocatedSmall += zone.nbSmallTables || 0;
            allocatedLarge += zone.nbLargeTables || 0;
            allocatedCityHall += zone.nbCityHallTables || 0;
        });

        const errors: any = {};
        let hasError = false;

        if (allocatedSmall > nbSmallTables) {
            errors.smallTablesExceeded = { allocated: allocatedSmall, total: nbSmallTables };
            hasError = true;
        }
        if (allocatedLarge > nbLargeTables) {
            errors.largeTablesExceeded = { allocated: allocatedLarge, total: nbLargeTables };
            hasError = true;
        }
        if (allocatedCityHall > nbCityHallTables) {
            errors.cityHallTablesExceeded = { allocated: allocatedCityHall, total: nbCityHallTables };
            hasError = true;
        }

        return hasError ? errors : null;
    }

    /**
     * Valide qu'un éditeur est soit exposant, soit distributeur, ou les deux
     * @param editor - Données de l'éditeur
     * @returns Erreurs de validation ou null
     */
    validateEditorType(editor: {
        exposant: boolean;
        distributeur: boolean;
    }): ValidationErrors | null {
        return (editor.exposant || editor.distributeur)
            ? null
            : { atLeastOne: true };
    }

    /**
     * Valide que le nombre de joueurs minimum est inférieur ou égal au maximum
     * @param game - Données du jeu
     * @returns Erreurs de validation ou null
     */
    validateGamePlayerRange(game: {
        nbMinPlayer: number;
        nbMaxPlayer: number;
    }): ValidationErrors | null {
        if (game.nbMinPlayer > game.nbMaxPlayer) {
            return {
                playerRangeInvalid: {
                    min: game.nbMinPlayer,
                    max: game.nbMaxPlayer
                }
            };
        }
        return null;
    }

    /**
     * Validateur Angular Forms pour l'allocation des tables
     * Peut être utilisé directement dans les FormGroups
     */
    tableAllocationValidator = (control: AbstractControl): ValidationErrors | null => {
        const nbSmallTables = control.get('nbSmallTables')?.value || 0;
        const nbLargeTables = control.get('nbLargeTables')?.value || 0;
        const nbCityHallTables = control.get('nbCityHallTables')?.value || 0;

        const tariffZones = control.get('tariffZones')?.value || [];

        return this.validateTableAllocation({
            nbSmallTables,
            nbLargeTables,
            nbCityHallTables,
            tariffZones
        });
    };

    /**
     * Validateur Angular Forms pour le type d'éditeur
     * Peut être utilisé directement dans les FormGroups
     */
    editorTypeValidator = (control: AbstractControl): ValidationErrors | null => {
        const exposant = control.get('exposant')?.value;
        const distributeur = control.get('distributeur')?.value;

        return this.validateEditorType({ exposant, distributeur });
    };

    /**
     * Validateur Angular Forms pour la plage de joueurs
     * Peut être utilisé directement dans les FormGroups
     */
    playerRangeValidator = (control: AbstractControl): ValidationErrors | null => {
        const nbMinPlayer = control.get('nbMinPlayer')?.value;
        const nbMaxPlayer = control.get('nbMaxPlayer')?.value;

        return this.validateGamePlayerRange({ nbMinPlayer, nbMaxPlayer });
    };
}
