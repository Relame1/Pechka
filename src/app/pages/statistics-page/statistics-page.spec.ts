import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticsPage } from './statistics-page';

describe('StatisticsPage', () => {
  let component: StatisticsPage;
  let fixture: ComponentFixture<StatisticsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(StatisticsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
