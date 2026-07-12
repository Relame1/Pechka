import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientOrdersPage } from './client-orders-page';

describe('ClientOrdersPage', () => {
  let component: ClientOrdersPage;
  let fixture: ComponentFixture<ClientOrdersPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientOrdersPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientOrdersPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
