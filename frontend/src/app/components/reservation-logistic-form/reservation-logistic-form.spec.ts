import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationLogisticForm } from './reservation-logistic-form';

describe('ReservationLogisticForm', () => {
  let component: ReservationLogisticForm;
  let fixture: ComponentFixture<ReservationLogisticForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationLogisticForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationLogisticForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
