import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerAddressDialogComponent } from './customer-address-dialog.component';

describe('CustomerAddressDialogComponent', () => {
  let component: CustomerAddressDialogComponent;
  let fixture: ComponentFixture<CustomerAddressDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerAddressDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerAddressDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
