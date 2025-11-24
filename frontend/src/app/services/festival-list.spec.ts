import { TestBed } from '@angular/core/testing';

import { FestivalList } from './festival-list';

describe('FestivalList', () => {
  let service: FestivalList;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FestivalList);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
