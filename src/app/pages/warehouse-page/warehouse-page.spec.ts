import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarehousePage } from './warehouse-page';

describe('WarehousePage', () => {
  let component: WarehousePage;
  let fixture: ComponentFixture<WarehousePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarehousePage],
    }).compileComponents();

    fixture = TestBed.createComponent(WarehousePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
