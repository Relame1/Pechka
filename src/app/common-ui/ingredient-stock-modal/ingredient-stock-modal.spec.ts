import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientStockModal } from './ingredient-stock-modal';

describe('IngredientStockModal', () => {
  let component: IngredientStockModal;
  let fixture: ComponentFixture<IngredientStockModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IngredientStockModal],
    }).compileComponents();

    fixture = TestBed.createComponent(IngredientStockModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
