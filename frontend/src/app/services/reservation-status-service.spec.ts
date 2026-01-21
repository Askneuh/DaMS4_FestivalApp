import { TestBed } from '@angular/core/testing';
import { ReservationStatusService } from './reservation-status-service';
import { RESERVATION_STATUSES } from '../shared/constants/reservation-defaults.const';

describe('ReservationStatusService', () => {
    let service: ReservationStatusService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ReservationStatusService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return available statuses', () => {
        expect(service.getAvailableStatuses()).toEqual(RESERVATION_STATUSES);
    });

    it('should validate status', () => {
        expect(service.isValidStatus('Validé')).toBe(true);
        expect(service.isValidStatus('Invalid')).toBe(false);
    });
});
