import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditCouponComponent } from './add-edit-coupon.component';

describe('AddEditCouponComponent', () => {
  let component: AddEditCouponComponent;
  let fixture: ComponentFixture<AddEditCouponComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditCouponComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditCouponComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
