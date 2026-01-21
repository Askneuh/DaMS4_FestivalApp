import { TestBed } from '@angular/core/testing';

import { FestivalGameService } from './festival-game-service';

describe('FestivalGameService', () => {
  let service: FestivalGameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FestivalGameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
