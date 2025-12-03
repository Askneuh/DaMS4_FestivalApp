import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FestivalDetail } from './festival-detail';

describe('FestivalDetail', () => {
  let component: FestivalDetail;
  let fixture: ComponentFixture<FestivalDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FestivalDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FestivalDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
