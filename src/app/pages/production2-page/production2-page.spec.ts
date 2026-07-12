import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Production2Page } from './production2-page';

describe('Production2Page', () => {
  let component: Production2Page;
  let fixture: ComponentFixture<Production2Page>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Production2Page],
    }).compileComponents();

    fixture = TestBed.createComponent(Production2Page);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
