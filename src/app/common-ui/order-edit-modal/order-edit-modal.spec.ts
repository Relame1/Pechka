import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderEditModal } from './order-edit-modal';

describe('OrderEditModal', () => {
  let component: OrderEditModal;
  let fixture: ComponentFixture<OrderEditModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderEditModal],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderEditModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
