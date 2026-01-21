import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FestivalService } from './festival-service';
import { environment } from '../../environment/environment';

describe('FestivalService', () => {
    let service: FestivalService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [FestivalService]
        });
        service = TestBed.inject(FestivalService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        // Initial calls in constructor
        const req1 = httpMock.expectOne(`${environment.apiUrl}/festivals`);
        const req2 = httpMock.expectOne(`${environment.apiUrl}/festivals/current`);
        expect(service).toBeTruthy();
    });

    it('should get festival by name', () => {
        // Handling initial constructor calls
        httpMock.expectOne(`${environment.apiUrl}/festivals`);
        httpMock.expectOne(`${environment.apiUrl}/festivals/current`);

        const dummyFestival = { name: 'Test Festival', nbSmallTables: 10, nbLargeTables: 5, nbCityHallTables: 2, isCurrent: false };
        service.findByName('Test Festival').subscribe(festival => {
            expect(festival.name).toBe('Test Festival');
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/festivals/Test Festival`);
        expect(req.request.method).toBe('GET');
        req.flush(dummyFestival);
    });
});
