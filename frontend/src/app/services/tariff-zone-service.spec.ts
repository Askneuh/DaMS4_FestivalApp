import { TestBed } from '@angular/core/testing';

import { TariffZoneService } from './tariff-zone-service';

describe('TariffZoneService', () => {
  let service: TariffZoneService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TariffZoneService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
