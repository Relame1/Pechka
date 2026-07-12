import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesPage } from './sales-page';

describe('SalesPage', () => {
  let component: SalesPage;
  let fixture: ComponentFixture<SalesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesPage],
    }).compileComponents();

    fixture = TestBed.createComponent(SalesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
