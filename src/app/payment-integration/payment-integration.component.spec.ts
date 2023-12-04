import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentIntegrationComponent } from './payment-integration.component';

describe('PaymentIntegrationComponent', () => {
  let component: PaymentIntegrationComponent;
  let fixture: ComponentFixture<PaymentIntegrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentIntegrationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentIntegrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
