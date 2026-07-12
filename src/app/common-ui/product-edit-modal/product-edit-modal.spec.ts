import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductEditModal } from './product-edit-modal';

describe('ProductEditModal', () => {
  let component: ProductEditModal;
  let fixture: ComponentFixture<ProductEditModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductEditModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductEditModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
