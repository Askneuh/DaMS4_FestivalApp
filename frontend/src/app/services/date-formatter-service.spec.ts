import { TestBed } from '@angular/core/testing';
import { DateFormatterService } from './date-formatter-service';

describe('DateFormatterService', () => {
    let service: DateFormatterService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DateFormatterService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should format date to French format', () => {
        const date = new Date(2023, 9, 21); // 21 Oct 2023
        expect(service.formatDate(date)).toBe('21/10/2023');
    });

    it('should format date ISO', () => {
        const date = new Date(2023, 9, 21);
        expect(service.formatDateISO(date)).toBe('2023-10-21');
    });
});
