import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationGameForm } from './reservation-game-form';

describe('ReservationGameForm', () => {
  let component: ReservationGameForm;
  let fixture: ComponentFixture<ReservationGameForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationGameForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationGameForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
