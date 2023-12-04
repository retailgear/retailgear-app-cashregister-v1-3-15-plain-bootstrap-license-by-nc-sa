import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CouponServiceComponent } from './coupon-service.component';

describe('CouponServiceComponent', () => {
  let component: CouponServiceComponent;
  let fixture: ComponentFixture<CouponServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CouponServiceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CouponServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
