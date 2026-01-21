import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationStatus } from './reservation-status';

describe('ReservationStatus', () => {
  let component: ReservationStatus;
  let fixture: ComponentFixture<ReservationStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationStatus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
