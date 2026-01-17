import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestService } from './test-service';

describe('TestService', () => {
  let component: TestService;
  let fixture: ComponentFixture<TestService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
