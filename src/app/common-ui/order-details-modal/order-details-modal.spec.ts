import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderDetailsModal } from './order-details-modal';

describe('OrderDetailsModal', () => {
  let component: OrderDetailsModal;
  let fixture: ComponentFixture<OrderDetailsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetailsModal],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailsModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
