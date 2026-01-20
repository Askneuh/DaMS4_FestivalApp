import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanManagement } from './plan-management';

describe('PlanManagement', () => {
  let component: PlanManagement;
  let fixture: ComponentFixture<PlanManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
