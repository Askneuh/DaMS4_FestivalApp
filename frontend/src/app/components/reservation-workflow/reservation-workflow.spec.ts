import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationWorkflow } from './reservation-workflow';

describe('ReservationWorkflow', () => {
  let component: ReservationWorkflow;
  let fixture: ComponentFixture<ReservationWorkflow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationWorkflow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationWorkflow);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
