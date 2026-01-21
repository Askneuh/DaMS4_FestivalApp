import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TariffZoneForm } from './tariff-zone-form';

describe('TariffZoneForm', () => {
  let component: TariffZoneForm;
  let fixture: ComponentFixture<TariffZoneForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TariffZoneForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TariffZoneForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
