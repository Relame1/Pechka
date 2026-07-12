import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BakingSettingsModal } from './baking-settings-modal';

describe('BakingSettingsModal', () => {
  let component: BakingSettingsModal;
  let fixture: ComponentFixture<BakingSettingsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BakingSettingsModal],
    }).compileComponents();

    fixture = TestBed.createComponent(BakingSettingsModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
