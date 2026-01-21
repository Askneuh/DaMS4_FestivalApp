import { AbstractControl, FormArray, ValidationErrors } from '@angular/forms';

/**
 * Custom validators réutilisables pour les formulaires Angular
 */
export class CustomValidators {

    /**
     * Validateur pour vérifier l'allocation des tables dans un festival
     * Vérifie que les tables allouées aux zones tarifaires ne dépassent pas le total du festival
     * 
     * @param control - FormGroup contenant nbSmallTables, nbLargeTables, nbCityHallTables et tariffZones
     * @returns ValidationErrors si l'allocation dépasse le total, null sinon
     * 
     * @example
     * ```typescript
     * festivalForm = this.fb.group({
     *   nbSmallTables: [100],
     *   nbLargeTables: [50],
     *   nbCityHallTables: [20],
     *   tariffZones: this.fb.array([])
     * }, { validators: CustomValidators.tableAllocationValidator });
     * ```
     */
    static tableAllocationValidator(control: AbstractControl): ValidationErrors | null {
        const nbSmallTables = control.get('nbSmallTables')?.value || 0;
        const nbLargeTables = control.get('nbLargeTables')?.value || 0;
        const nbCityHallTables = control.get('nbCityHallTables')?.value || 0;

        const tariffZones = control.get('tariffZones') as FormArray;

        if (!tariffZones) return null;

        let allocatedSmall = 0;
        let allocatedLarge = 0;
        let allocatedCityHall = 0;

        tariffZones.controls.forEach((zone) => {
            allocatedSmall += zone.get('nbSmallTables')?.value || 0;
            allocatedLarge += zone.get('nbLargeTables')?.value || 0;
            allocatedCityHall += zone.get('nbCityHallTables')?.value || 0;
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
     * Validateur pour vérifier qu'au moins une checkbox est cochée
     * Utilisé pour les éditeurs qui doivent être soit exposant, soit distributeur, ou les deux
     * 
     * @param control - FormGroup contenant les champs exposant et distributeur
     * @returns ValidationErrors si aucune checkbox n'est cochée, null sinon
     * 
     * @example
     * ```typescript
     * editorForm = new FormGroup({
     *   exposant: new FormControl(false),
     *   distributeur: new FormControl(false)
     * }, { validators: CustomValidators.atLeastOneCheckbox });
     * ```
     */
    static atLeastOneCheckbox(control: AbstractControl): ValidationErrors | null {
        const exposant = control.get('exposant')?.value;
        const distributeur = control.get('distributeur')?.value;
        return (exposant || distributeur) ? null : { atLeastOne: true };
    }

    /**
     * Validateur pour vérifier qu'au moins un champ parmi plusieurs est rempli
     * Version générique de atLeastOneCheckbox
     * 
     * @param fieldNames - Noms des champs à vérifier
     * @returns ValidatorFn
     * 
     * @example
     * ```typescript
     * form = new FormGroup({
     *   email: new FormControl(''),
     *   phone: new FormControl('')
     * }, { validators: CustomValidators.atLeastOneRequired(['email', 'phone']) });
     * ```
     */
    static atLeastOneRequired(fieldNames: string[]) {
        return (control: AbstractControl): ValidationErrors | null => {
            const hasValue = fieldNames.some(fieldName => {
                const field = control.get(fieldName);
                return field && field.value;
            });
            return hasValue ? null : { atLeastOneRequired: { fields: fieldNames } };
        };
    }

    /**
     * Validateur pour vérifier qu'une plage de valeurs est valide (min <= max)
     * 
     * @param minFieldName - Nom du champ minimum
     * @param maxFieldName - Nom du champ maximum
     * @returns ValidatorFn
     * 
     * @example
     * ```typescript
     * gameForm = new FormGroup({
     *   nbMinPlayer: new FormControl(1),
     *   nbMaxPlayer: new FormControl(4)
     * }, { validators: CustomValidators.rangeValidator('nbMinPlayer', 'nbMaxPlayer') });
     * ```
     */
    static rangeValidator(minFieldName: string, maxFieldName: string) {
        return (control: AbstractControl): ValidationErrors | null => {
            const minValue = control.get(minFieldName)?.value;
            const maxValue = control.get(maxFieldName)?.value;

            if (minValue == null || maxValue == null) {
                return null;
            }

            if (minValue > maxValue) {
                return {
                    rangeInvalid: {
                        min: minValue,
                        max: maxValue,
                        minField: minFieldName,
                        maxField: maxFieldName
                    }
                };
            }

            return null;
        };
    }

    /**
     * Validateur pour vérifier qu'une date de début est avant une date de fin
     * 
     * @param startDateField - Nom du champ date de début
     * @param endDateField - Nom du champ date de fin
     * @returns ValidatorFn
     * 
     * @example
     * ```typescript
     * festivalForm = new FormGroup({
     *   startDate: new FormControl(new Date()),
     *   endDate: new FormControl(new Date())
     * }, { validators: CustomValidators.dateRangeValidator('startDate', 'endDate') });
     * ```
     */
    static dateRangeValidator(startDateField: string, endDateField: string) {
        return (control: AbstractControl): ValidationErrors | null => {
            const startDate = control.get(startDateField)?.value;
            const endDate = control.get(endDateField)?.value;

            if (!startDate || !endDate) {
                return null;
            }

            const start = new Date(startDate);
            const end = new Date(endDate);

            if (start > end) {
                return {
                    dateRangeInvalid: {
                        startDate: start,
                        endDate: end
                    }
                };
            }

            return null;
        };
    }
}
