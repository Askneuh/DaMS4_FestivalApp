import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TariffZoneFormComponent } from './tariff-zone-form-component';

describe('TariffZoneFormComponent', () => {
  let component: TariffZoneFormComponent;
  let fixture: ComponentFixture<TariffZoneFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TariffZoneFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TariffZoneFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
