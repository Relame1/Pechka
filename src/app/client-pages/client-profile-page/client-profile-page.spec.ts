import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientProfilePage } from './client-profile-page';

describe('ClientProfilePage', () => {
  let component: ClientProfilePage;
  let fixture: ComponentFixture<ClientProfilePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientProfilePage],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientProfilePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
