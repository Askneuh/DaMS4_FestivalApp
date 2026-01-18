import { TestBed } from '@angular/core/testing';

import { PlanAreaService } from './plan-area-service';

describe('PlanAreaService', () => {
  let service: PlanAreaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanAreaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
