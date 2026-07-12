import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OvensPage } from './ovens-page';

describe('OvensPage', () => {
  let component: OvensPage;
  let fixture: ComponentFixture<OvensPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OvensPage],
    }).compileComponents();

    fixture = TestBed.createComponent(OvensPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
