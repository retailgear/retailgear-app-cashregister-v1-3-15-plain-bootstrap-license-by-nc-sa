import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomPaymentMethodComponent } from './custom-payment-method.component';

describe('CustomPaymentMethodComponent', () => {
  let component: CustomPaymentMethodComponent;
  let fixture: ComponentFixture<CustomPaymentMethodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomPaymentMethodComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomPaymentMethodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
