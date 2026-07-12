import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BakingLogPage } from './baking-log-page';

describe('BakingLogPage', () => {
  let component: BakingLogPage;
  let fixture: ComponentFixture<BakingLogPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BakingLogPage],
    }).compileComponents();

    fixture = TestBed.createComponent(BakingLogPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
