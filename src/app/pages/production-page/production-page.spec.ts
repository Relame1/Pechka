import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductionPage } from './production-page';

describe('ProductionPage', () => {
  let component: ProductionPage;
  let fixture: ComponentFixture<ProductionPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductionPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductionPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
