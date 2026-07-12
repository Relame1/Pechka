import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddIngredientPage } from './add-ingredient-page';

describe('AddIngredientPage', () => {
  let component: AddIngredientPage;
  let fixture: ComponentFixture<AddIngredientPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddIngredientPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AddIngredientPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
