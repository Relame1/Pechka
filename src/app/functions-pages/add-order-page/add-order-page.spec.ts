import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddOrderPage } from './add-order-page';

describe('AddOrderPage', () => {
  let component: AddOrderPage;
  let fixture: ComponentFixture<AddOrderPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddOrderPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AddOrderPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
