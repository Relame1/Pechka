import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductStockModal } from './product-stock-modal';

describe('ProductStockModal', () => {
  let component: ProductStockModal;
  let fixture: ComponentFixture<ProductStockModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductStockModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductStockModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
