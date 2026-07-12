import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactsPage } from './contacts-page';

describe('ContactsPage', () => {
  let component: ContactsPage;
  let fixture: ComponentFixture<ContactsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
