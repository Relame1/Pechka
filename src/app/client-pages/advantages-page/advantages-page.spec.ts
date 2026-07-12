import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvantagesPage } from './advantages-page';

describe('AdvantagesPage', () => {
  let component: AdvantagesPage;
  let fixture: ComponentFixture<AdvantagesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvantagesPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AdvantagesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
