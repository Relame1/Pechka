import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkAddIngredientsModal } from './bulk-add-ingredients-modal';

describe('BulkAddIngredientsModal', () => {
  let component: BulkAddIngredientsModal;
  let fixture: ComponentFixture<BulkAddIngredientsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkAddIngredientsModal],
    }).compileComponents();

    fixture = TestBed.createComponent(BulkAddIngredientsModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
