import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FestivalGames } from './festival-games';

describe('FestivalGames', () => {
  let component: FestivalGames;
  let fixture: ComponentFixture<FestivalGames>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FestivalGames]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FestivalGames);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
