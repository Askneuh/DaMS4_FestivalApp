import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationOrganisationForm } from './reservation-organisation-form';

describe('ReservationOrganisationForm', () => {
  let component: ReservationOrganisationForm;
  let fixture: ComponentFixture<ReservationOrganisationForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationOrganisationForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationOrganisationForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
