import { TestBed } from '@angular/core/testing';

import { GameServiceTemp } from './game-service-temp';

describe('GameServiceTemp', () => {
  let service: GameServiceTemp;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameServiceTemp);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
