import { TestBed } from '@angular/core/testing';
import { ValidationService } from './validation-service';

describe('ValidationService', () => {
    let service: ValidationService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ValidationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should validate table allocation', () => {
        const festival = {
            nbSmallTables: 10,
            nbLargeTables: 10,
            nbCityHallTables: 10,
            tariffZones: [
                { nbSmallTables: 5, nbLargeTables: 5, nbCityHallTables: 5 },
                { nbSmallTables: 6, nbLargeTables: 5, nbCityHallTables: 5 }
            ]
        };
        const errors = service.validateTableAllocation(festival);
        expect(errors).toBeTruthy();
        expect(errors?.['smallTablesExceeded']).toBeTruthy();
    });

    it('should return null if table allocation is valid', () => {
        const festival = {
            nbSmallTables: 10,
            nbLargeTables: 10,
            nbCityHallTables: 10,
            tariffZones: [
                { nbSmallTables: 5, nbLargeTables: 5, nbCityHallTables: 5 }
            ]
        };
        const errors = service.validateTableAllocation(festival);
        expect(errors).toBeNull();
    });
});
